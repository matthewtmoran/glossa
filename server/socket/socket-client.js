// var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var path = require('path');
var fs = require('fs');
var Notebooks = require('./../api/notebook/notebook.model.js');
const main = require('../../main');
const app = require('electron').app;
const config = require('../config/environment');

module.exports = {
  //this occurs when bonjour discovers an external server.
  //we are going to connect to the server as a client so the server can interact with us
  init: function (service, io, win) {

    console.log('');
    console.log('--- socketClient.init called');

    let externalPath = 'http://' + service.addr + ':' + config.port;
    console.log('externalPathL ', externalPath);
    let nodeClientSocket = require('socket.io-client')(externalPath, {forceNew: true});


    //initial connection to another server
    //.once solve the problem however I'm not sure this will work with more than one connection
    //the other issue will be removing event listeners
    //TODO: !IMPORTANT - test for multiple connections

    // //initial connection to another server
    nodeClientSocket.once('connect', () => {
      console.log('');
      console.log('--- on:: connect');
      console.log('');
    });

    nodeClientSocket.on('disconnect', (reason) => {
      console.log('');
      console.log('--- on:: disconnect');
      console.log('');
      unbind();
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
      console.log('on:: send-profile-updates');

      global.appData.initialState.connections = global.appData.initialState.connections.map((connection) => {
        if (connection._id === data._id) {
          if (connection.following) {
            win.webContents.send('sync-event-start');

            //if client avatar exists and it is different than connection avatar
            if ((data.avatar.name !== connection.avatar.name) || (!connection.avatar && data.avatar.name)) {
              //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
              console.log('emit:: request:avatar to:: server that sent us basic changes');
              io.to(data.socketId).emit('request:avatar');

              connection.avatar = data.avatar;
              connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', data.avatar.name);
              connection.avatar.path = path.resolve(data.avatar.path);
              connection.avatar = Object.assign({}, connection.avatar);


              socketUtil.followedConnectionUpdate(connection)
                .then((updatedConnection) => {
                  // socketUtil.updateGlobalArrayObject([updatedConnection], 'connection');
                  console.log('--- send:: update-connection-list to:: local window');
                  win.webContents.send('update-connection-list');
                });

              socketUtil.normalizeNotebooks(connection)
                .then((updatedNotebooks) => {
                  socketUtil.updateGlobalArrayObject(updatedNotebooks, 'notebooks');
                  console.log('--- send:: update-synced-notebooks to:: local window');
                  win.webContents.send('update-synced-notebooks');
                });



            }
            //if client avatar does not exist but connection avatar does exist
            else if (!data.avatar || !data.avatar.name && connection.avatar && connection.avatar.name) {
            //  copy data object, save data, remove old image from filesystem, normalize notebooks
              connection.avatar = Object.assign({}, data.avatar);

              fs.unlink(connection.avatar.absolutePath);

              socketUtil.followedConnectionUpdate(connection)
                .then((updatedConnection) => {
                  // socketUtil.updateGlobalArrayObject([updatedConnection], 'connection');
                  console.log('--- send:: update-connection-list to:: local window');
                  win.webContents.send('update-connection-list');
                });

              socketUtil.normalizeNotebooks(connection)
                .then((updatedNotebooks) => {
                  socketUtil.updateGlobalArrayObject(updatedNotebooks, 'notebooks');
                  console.log('--- send:: update-synced-notebooks to:: local window');
                  win.webContents.send('update-synced-notebooks');
                });

            }
          }
          return connection;
        }
        return connection;
      });
        win.webContents.send('update-connection-list');
        win.webContents.send('sync-event-end');
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
  }
};