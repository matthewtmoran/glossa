// var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var path = require('path');
var fs = require('fs');
const main = require('../../../main');
const app = require('electron').app;
const config = require('../config/environment');
const ioClient = require('socket.io-client');


const User = require('./../api/user/user.model.js');
const Notebooks = require('./../api/notebook/notebook.model.js');
const notebookController = require('../api/notebook/notebook.controller');


const Connection = require('./../api/connections/connection.model');
const Session = require('./../api/session/session.model');
const Transcriptions = require('./../api/transcription/transcription.model');
const Hashtags = require('./../api/hashtag/hashtag.model');


//master list of active socket connections
let connectionList = [];
const ip = require('ip');
let devObject = {};

module.exports = {

  initLocal: function (io, win) {
    devObject.io = io;
    devObject.win = win;
    let service = {
      name: 'Glossa-' + global.appData.initialState.user._id,
      addr: ip.address()
    };
    let port = !config.secondInstance ? '9090' : '9000';
    let externalPath = 'http://' + service.addr + ':' + port;
    //if the service is not in the master list then we connect to it as a client
    if (connectionList.indexOf(service.name) < 0) {
      // let nodeClientSocket = ioClient(externalPath, {transports: ['websocket'], upgrade: false});
      // let nodeClientSocket = ioClient.connect(externalPath, {reconnection: true, reconnectionDelay: 1000});
      let nodeClientSocket = ioClient(externalPath, {reconnection: true, reconnectionDelay: 1000});
      this.connect(service, io, win, nodeClientSocket);
      //handle the connection to the external socket server
    } else {
      // we are already connected to this service so just ignore
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

    nodeClientSocket.on('test:event', (data) => {
      console.log('Heard test:event');
    });

    nodeClientSocket.on('disconnect', (reason) => {
      console.log('');
      console.log('');
      console.log('');
      console.log('--- on:: disconnect');
      console.log('--- reason:', reason);
      console.log('');
      console.log('');
      console.log('');
      //when the socket disconnects, we remove the service name from the list
      connectionList.splice(connectionList.indexOf(service.name), 1);
      //unbind listeners so they are not duplicated
      unbind();

      //if its' lcal dev start again...
      if (config.localDev) {
        // this.initLocal(devObject.io, devObject.win);
      }
    });

    //recievs event from an external server and emits the end-handshake
    nodeClientSocket.on('begin-handshake', onBeginHandshake);
    function onBeginHandshake() {
      console.log('--- on:: begin-handshake');

      User.findOne({}, (err, user) => {
        if (err) {
          return console.log('error finding user');
        }

        const basicProfileData = {
          _id: user._id,
          name: user.name,
          type: 'external-client',
          socketId: nodeClientSocket.id,
          avatar: user.avatar
        };

        console.log('--- emit:: end-handshake to:: external node server');
        nodeClientSocket.emit('end-handshake', basicProfileData)
      });
    }

    //a server is requesting data from a connected client
    //@data = {notebooks: Array}
    nodeClientSocket.on('request:new-data', onRequestNewData);
    function onRequestNewData(data) {
      console.log('--- on:: request:new-data');
      //send sync notification to local window
      console.log("--- IPC send:: sync-event-start local-window", 'line 107');
      win.webContents.send('sync-event-start');

      notebookController.getNewAndUpdatedNotebooks(data.notebooks)
        .then((notebooks) => {
          console.log('--- emit:: return:new-data to:: whoever requested it');
          nodeClientSocket.emit('return:new-data', {notebooks: notebooks});
        })
        .catch((err) => {
          console.log('Error getting new and updated notebooks', err);
          console.log("--- IPC send:: sync-event-end local-window");
          win.webContents.send('sync-event-end');
        });
    }


    nodeClientSocket.on('rt:updates', onRtUpdates);

    function onRtUpdates(data) {

      Connection.findOne({_id: data.user._id}, (err, connection) => {
        if (err) {
          return console.log('Eror finding connection', err);
        }

        if (!connection) {
          return console.log('No connection found');
        }

        if (connection.following) {

        }

      })


    }

    nodeClientSocket.on('rt:updates', (data) => {
      console.log('on:: rt:updates');

      global.appData.initialState.connections.forEach((connection) => {
        if (connection._id === data.user._id && connection.following) {

          console.log("--- IPC send:: sync-event-start local-window", 'line 128');
          win.webContents.send('sync-event-start');

          global.appData.initialState.connections.forEach((connection) => {
            //if the user matches and we are following the user...
            if (data.user._id === connection._id && connection.following) {

              socketUtil.syncDataReturn(data)
                .then((data) => {

                  //updating the global object here
                  socketUtil.updateGlobalArrayObject(data, 'notebooks');

                  console.log('--- IPC send:: update-rt-synced-notebooks');
                  win.webContents.send('update-rt-synced-notebooks', data);
                  console.log('--- IPC send:: sync-event-end');
                  win.webContents.send('sync-event-end');

                })
            }
          });
        }

      });
    });

    nodeClientSocket.on('send-profile-updates', (user) => {
      console.log('--- on:: send-profile-updates');

      Connection.findOne({_id: user._id}, (err, connection) => {
        if (connection.name !== user.name) {
          connection.name = user.name;
        }
        if (connection.following) {
          if (user.avatar && !connection.avatar) {
            console.log('--- Updated connection to add avatar');
            connection = getAvatarData(connection, user)
          } else if (!user.avatar && connection.avatar) {
            console.log('--- Update connection to remove avatar');
            connection = removeAvatarData(connection, user)
          } else if (user.avatar && user.avatar.name !== connection.avatar.name) {
            console.log('--- Update connection to update avatar');
            connection = getAvatarData(connection, user)
          } else {
            console.log('--- Update something else - NO CONDITIONS MET');
            console.log('--- No Changes with avatar most likely');
            updateConnectionsAndNotebooks(connection);
          }
        }

        const options = {returnUpdatedDocs: true};
        Connection.update({_id: connection._id}, connection, options, (err, updatedCount, updatedConnection) => {

        })
      });


      Connection.find({}, (err, connections) => {
        connections.forEach((connection) => {
          if (connection._id === user._id) {
            if (connection.name !== user.name) {
              connection.name = user.name;
            }
            if (connection.following) {
              if (user.avatar && !connection.avatar) {
                console.log('--- Updated connection to add avatar');
                connection = getAvatarData(connection, user)
              } else if (!user.avatar && connection.avatar) {
                console.log('--- Update connection to remove avatar');
                connection = removeAvatarData(connection, user)
              } else if (user.avatar && user.avatar.name !== connection.avatar.name) {
                console.log('--- Update connection to update avatar');
                connection = getAvatarData(connection, user)
              } else {
                console.log('--- Update something else - NO CONDITIONS MET');
                console.log('--- No Changes with avatar most likely');
                updateConnectionsAndNotebooks(connection);
              }
            }
            return connection;
          }
        })


      });

      global.appData.initialState.connections = global.appData.initialState.connections.map((connection) => {
        if (connection._id === data._id) {
          if (connection.name !== data.name) {
            connection.name = data.name;
          }
          if (connection.following) {
            if (data.avatar && !connection.avatar) {
              console.log('--- Updated connection to add avatar');
              connection = getAvatarData(connection, data)
            } else if (!data.avatar && connection.avatar) {
              console.log('--- Update connection to remove avatar');
              connection = removeAvatarData(connection, data)
            } else if (data.avatar && data.avatar.name !== connection.avatar.name) {
              console.log('--- Update connection to update avatar');
              connection = getAvatarData(connection, data)
            } else {
              console.log('--- Update something else - NO CONDITIONS MET');
              console.log('--- No Changes with avatar most likely');
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
      console.log('--- on:: request:avatar');

      User.findOne({}, (err, user) => {
        if (!user.avatar || !user.avatar.absolutePath) {
          return;
        }
        socketUtil.encodeBase64(user.avatar.absolutePath)
          .then((bufferString) => {

            let avatarData = Object.assign({}, user.avatar);
            avatarData.bufferString = bufferString;
            avatarData.userId = user._id;

            console.log('--- emit:: return:avatar to:: server that is connected (that made request)');
            nodeClientSocket.emit('return:avatar', avatarData);
          })
      });
    });

    nodeClientSocket.on('new:notebook', (data) => {
      console.log('--- on:: new:notebook', data);
      console.log('add notebook to database');
      console.log("notify local client");
    });


    //remvoes the event listener
    //TODO: !IMPORTANT - test for multiple connections
    //TODO: refractor to get all events dynamically
    function unbind() {
      nodeClientSocket.removeAllListeners("begin-handshake");
      nodeClientSocket.removeAllListeners("request:new-data");
      nodeClientSocket.removeAllListeners("return:avatar");
      nodeClientSocket.removeAllListeners("request:avatar");
      nodeClientSocket.removeAllListeners("send-profile-updates");
      nodeClientSocket.removeAllListeners("rt:updates");
      nodeClientSocket.removeAllListeners("connect");
      nodeClientSocket.removeAllListeners("disconnect");
    }

    function getAvatarData(connection, data) {
      console.log('--- emit:: request:avatar');
      io.to(connection.socketId).emit('request:avatar');

      connection.avatar = data.avatar;
      connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', data.avatar.name);
      connection.avatar.path = path.normalize(data.avatar.path);

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
      console.log('--- IPC send:: sync-event-start to:: local-window', 'line 245');
      win.webContents.send('sync-event-start');


      let promises = [];
      promises.push(

        new Promise((resolve, reject) => {
          socketUtil.followedConnectionUpdate(connection)
            .then((updatedConnection) => {
              // socketUtil.updateGlobalArrayObject([updatedConnection], 'connection');
              console.log('--- IPC send:: update:connection to:: local-window');
              win.webContents.send('update:connection', updatedConnection);
              resolve(updatedConnection)
            })
            .catch((err) => {
              reject(err);
            })
        }),

        new Promise((resolve, reject) => {
          socketUtil.normalizeNotebooks(connection)
            .then((updatedNotebooks) => {
              console.log('--- IPC send:: update:notebooks to:: local-window');
              win.webContents.send('update:notebooks', updatedNotebooks);
              resolve(updatedNotebooks)
            })
            .catch((err) => {
              reject(err)
            })
        })
      );

      Promise.all(promises).then((results) => {

        // win.webContents.send('update-connection-list');

        // win.webContents.send('update-synced-notebooks');
        console.log('--- IPC send:: sync-event-end to:: local-window');
        win.webContents.send('sync-event-end');
      })
    }
  }

};