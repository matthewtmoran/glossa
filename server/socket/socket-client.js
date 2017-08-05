// var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var path = require('path');
var fs = require('fs');
var Notebooks = require('./../api/notebook/notebook.model.js');
const main = require('../../main');
const app = require('electron').app;
const config = require('../config/environment');
const ioClient = require('socket.io-client');
//master list of active socket connections
let connectionList = [];
const ip = require('ip');
let devObject = {};

module.exports = {

  initLocal: function (io, win) {
    devObject.io = io;
    devObject.win = win;
    console.log('running local dev connection');
    let service = {
      name: 'Glossa-' + global.appData.initialState.user._id,
      addr: ip.address()
    };

    console.log('TODO: for local tests, we can probably just ping the port we are trying to connect to every 3 seconds if it does not connect');
    let port = !config.secondInstance ? '9090' : '9000';
    let externalPath = 'http://' + service.addr + ':' + port;
    console.log('external path we are trying to connect to: ', externalPath);
    //if the service is not in the master list then we connect to it as a client
    if (connectionList.indexOf(service.name) < 0) {
      console.log('We are not connected to this server yet');
        let nodeClientSocket = ioClient(externalPath, {reconnection: true, reconnectionDelay: 1000});
        this.connect(service, io, win, nodeClientSocket);
      //handle the connection to the external socket server
    } else {
      // we are already connected to this service so just ignore
      console.log('we are already connected to this server');
      return false;
    }
  },

  //this occurs when bonjour discovers an external server.
  //we are going to connect to the server as a client so the server can interact with us
  init: function (service, io, win) {
    let nodeClientSocket;
    //if the service is not in the master list then we connect to it as a client
    if (connectionList.indexOf(service.name) < 0) {
      let externalPath = 'http://' + service.addr + ':' + config.port;
      nodeClientSocket = require('socket.io-client')(externalPath);
      //handle the connection to the external socket server
      this.connect(service, io, win, nodeClientSocket);
    } else {
      // we are already connected to this service so just ignore
      return false;
    }
  },

  connect: function (service, io, win, nodeClientSocket) {
    console.log('');
    console.log('--- socketClient.connect called');

    //initial connection to another server
    //.once solve the problem however I'm not sure this will work with more than one connection
    //the other issue will be removing event listeners
    //TODO: !IMPORTANT - test for multiple connections

    // //initial connection to another server
    nodeClientSocket.on('connect', () => {
      console.log('');
      console.log('--- on:: connect');
      console.log('');

      //when the connection is truly established, we add the service name ot the list.
      connectionList.push(service.name);

    });

    nodeClientSocket.on('disconnect', (reason) => {
      console.log('');
      console.log('--- on:: disconnect');
      console.log('');
      //when the socket disconnects, we remove the service name from the list
      connectionList.splice(connectionList.indexOf(service.name), 1);
      //unbind listeners so they are not duplicated
      unbind();
      this.initLocal(devObject.io, devObject.win);
    });

    //recievs event from an external server and emits the end-handshake
    nodeClientSocket.on('begin-handshake', () => {
      console.log('--- on:: begin-handshake');
      const basicProfileData = {
        _id: global.appData.initialState.user._id,
        name: global.appData.initialState.user.name,
        type: 'external-client',
        socketId: nodeClientSocket.id,
        avatar: global.appData.initialState.user.avatar
      };

      console.log('--- emit:: end-handshake');
      nodeClientSocket.emit('end-handshake', basicProfileData)
    });

    //a server is requesting data from a connected client
    //@data = {notebooks: Array}
    nodeClientSocket.on('sync-data', (data) => {
      console.log('--- on:: sync-data');

      //send sync notificatio to local window
      console.log("--- send:: sync-event-start local-window");
      win.webContents.send('sync-event-start');

      socketUtil.getNewAndUpdatedNotebooks(data.notebooks)
        .then(notebooksToSend => {
          console.log('--- emit:: sync-data:return to:: whoever requested it');
          nodeClientSocket.emit('sync-data:return', {notebooks: notebooksToSend});


          console.log('TODO: end outside client sync event display');
          console.log("--- send:: sync-event-end local-window");
          win.webContents.send('sync-event-end');
        })
    });

    nodeClientSocket.on('rt:updates', (data) => {
      console.log('on:: rt:updates');

      global.appData.initialState.connections.forEach((connection)=> {
        if (connection._id === data.user._id && connection.following) {

          console.log("--- send:: sync-event-start local-window");
          win.webContents.send('sync-event-start');

          global.appData.initialState.connections.forEach((connection) => {
            //if the user matches and we are following the user...
            if (data.user._id === connection._id && connection.following) {

              socketUtil.syncDataReturn(data)
                .then((data) => {

                  //updating the global object here
                  socketUtil.updateGlobalArrayObject(data, 'notebooks');

                  console.log('--- send:: update-rt-synced-notebooks');
                  win.webContents.send('update-rt-synced-notebooks', data);
                  console.log('--- send:: sync-event-end');
                  win.webContents.send('sync-event-end');

                })
            }
          });
        }

      });
    });

    nodeClientSocket.on('send-profile-updates', (data) => {
      console.log('--- on:: send-profile-updates');

      global.appData.initialState.connections = global.appData.initialState.connections.map((connection) => {
        if (connection._id === data._id) {
          if (connection.name !== data.name) {
            connection.name = data.name;
          }
          if (connection.following) {
            win.webContents.send('sync-event-start');
            if (data.avatar && !connection.avatar) {
              console.log('Updated connection to add avatar');
              connection = getAvatarData(connection, data)
            } else if (!data.avatar && connection.avatar) {
              console.log('Update connection to remove avatar');
              connection = removeAvatarData(connection, data)
            } else if (data.avatar && data.avatar.name !== connection.avatar.name) {
              console.log('Update connection to update avatar');
              connection = getAvatarData(connection, data)
            } else {
              console.log('Update something else - NO CONDITIONS MET');
              console.log('No Changes with avatar most likely');
              updateConnectionsAndNotebooks(connection);
            }
          }
          return connection;
        }
        return connection;
      });
    });

    nodeClientSocket.on('return:avatar', (data) => {
      socketUtil.writeAvatar(data)
        .then(() => {
          console.log('Avatar written');
        })
    });


    //on connection, avatar is different this is where the request is heard
    nodeClientSocket.on('request:avatar', (data) => {
      console.log('--- on:: request:avatar')

      socketUtil.encodeBase64(global.appData.initialState.user.avatar.absolutePath)
        .then((bufferString) => {

          let avatarData = Object.assign({}, global.appData.initialState.user.avatar);
          avatarData.bufferString = bufferString;
          console.log('--- avatarData.path', avatarData.path);
          console.log('--- emit:: return:avatar to:: server that is connected (that made request)');
          nodeClientSocket.emit('return:avatar', avatarData);
        })


    });



    //remvoes the event listener
    //TODO: !IMPORTANT - test for multiple connections
    //TODO: refractor to get all events dynamically
    function unbind() {
      console.log('unbind triggered...');
      nodeClientSocket.removeAllListeners("begin-handshake");
      nodeClientSocket.removeAllListeners("sync-data");
      nodeClientSocket.removeAllListeners("return:avatar");
      nodeClientSocket.removeAllListeners("request:avatar");
      nodeClientSocket.removeAllListeners("send-profile-updates");
      nodeClientSocket.removeAllListeners("rt:updates");
      nodeClientSocket.removeAllListeners("connect");
      nodeClientSocket.removeAllListeners("disconnect");
    }

    function getAvatarData(connection, data) {
      console.log('--- emit:: request:avatar');
      console.log('data.socketId', data.socketId);
      console.log('connection.socketId', connection.socketId);
      io.to(connection.socketId).emit('request:avatar');
      connection.avatar = data.avatar;
      connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', data.avatar.name);
      connection.avatar.path = path.resolve(data.avatar.path);

      updateConnectionsAndNotebooks(connection);

      return connection;
    }

    function removeAvatarData(connection, data) {
      fs.unlink(connection.avatar.absolutePath);
      connection.avatar = data.avatar;
      updateConnectionsAndNotebooks(connection);
      return connection;
    }

    function updateConnectionsAndNotebooks(connection) {
      socketUtil.followedConnectionUpdate(connection)
        .then((updatedConnection) => {
          // socketUtil.updateGlobalArrayObject([updatedConnection], 'connection');
          console.log('--- send:: update-connection-list to:: local window');
          win.webContents.send('update-connection-list');
          win.webContents.send('sync-event-end');
        });

      socketUtil.normalizeNotebooks(connection)
        .then((updatedNotebooks) => {
          socketUtil.updateGlobalArrayObject(updatedNotebooks, 'notebooks');
          console.log('--- send:: update-synced-notebooks to:: local window');
          win.webContents.send('update-synced-notebooks');
          win.webContents.send('sync-event-end');
        });
    }
  }

};