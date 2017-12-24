import UserController from '../api/user/user.controller';
const path = require('path');
const fs = require('fs');
const {app, remote} = require('electron');
const config = require('../config/environment');
const ioClient = require('socket.io-client');
const User = require('./../api/user/user.model.js');

const Notebooks = require('./../api/notebook/notebook.model.js');
const notebookController = require('../api/notebook/notebook.controller')();

const connectionController = require('../api/connections/connection.controller')(null);


const Connection = require('./../api/connections/connection.model');

let connectionList = [];
const ip = require('ip');
let devObject = {};


module.exports = {
  //used for testing local socket events
  initLocal: function (io, win) {
    devObject.io = io;
    devObject.win = win;

    User.findOne({}, (err, user) => {
      let service = {
        name: 'Glossa-' + user._id,
        addr: ip.address()
      };
      let port = !config.secondInstance ? '9090' : '9000';
      let externalPath = 'http://' + service.addr + ':' + port;
      console.log('connecting to:', externalPath );

      //if the service is not in the master list then we connect to it as a client
      if (connectionList.indexOf(service.name) < 0) {
        let nodeClientSocket = ioClient(externalPath, {reconnection: true, reconnectionDelay: 1000});
        this.connect(service, io, nodeClientSocket);
        //handle the connection to the external socket server
      } else {
        // we are already connected to this service so just ignore
        return false;
      }
    });


  },

  connectToMockClient: function (io) {
    User.findOne({}, (err, user) => {
      console.log('...connecting to mock-client');
      const service = {
        name: 'Glossa-' + user._id,
        addr: ip.address()
      };
      let externalPath = 'http://localhost:9090';
      let nodeClientSocket = ioClient(externalPath, {});
      this.connect(service, io, nodeClientSocket);

    });
  },

  //we are going to connect to the server as a client so the server can interact with us
  init: function (service, io) {
    let nodeClientSocket;
    //if the service is not in the master list then we connect to it as a client
    if (connectionList.indexOf(service.name) < 0) {
      let externalPath = 'http://' + service.addr + ':' + config.port;

      nodeClientSocket = require('socket.io-client')(externalPath);
      //handle the connection to the external socket server
      this.connect(service, io, nodeClientSocket);
    } else {
      // we are already connected to this service so just ignore
      return false;
    }
  },


  connect: function (service, io, nodeClientSocket) {

    console.log(`Connecting to: ${service.data.name}`);

    nodeClientSocket.on('connect', onConnect);
    nodeClientSocket.on('begin-handshake', onBeginHandshake);
    nodeClientSocket.on('request:avatar', onRequestAvatar);
    nodeClientSocket.on('request:notebook-data', onRequestNotebookData);
    nodeClientSocket.on('send-profile-updates', onProfileUpdates);
    nodeClientSocket.on('return:avatar', onReturnAvatar);
    nodeClientSocket.on('rt:notebook', onRTNotebook);

    //occurs when a glossa instance broadcasts notbook updates
    function onRTNotebook(notebook) {
      console.log('--on:: rt:notebook');
      connectionController.findOneConnection(notebook.createdBy._id)
        .then((connection) => {
          if (connection.following) {
            notebookController.newDataReturned(notebook)
              .then((notebookReady) => {
                console.log('--- IPC send: update:synced-notebook');
                //use ipc here to communicate directly to the actual browser-window
                remote.webContents.fromId(2).send('update:synced-notebook', notebookReady);
              })
              .catch((err) => {
                console.log('there was an error getting new notebook', err);
              })
          }
        })
        .catch((reason) => {
          console.log('err', reason);
        });
    }

    function onProfileUpdates(user) {
      console.log('user:', user);
      let win = main.getWindow();
      win.webContents.send('sync-event-start');
      Connection.findOne({_id: user._id}, (err, connection) => {
        if (err) {
          return console.log('error finding connection:', err)
        }
        //if the name is different update the name whether we are following or not

        console.log('connection:', connection);
        if (connection.name !== user.name) {
          connection.name = user.name;
        }

        if (connection.following) {
          if (user.avatar && !connection.avatar) {
            console.log('--- Updated connection to add avatar');
            connection = getNewAvatarData(connection, user)
          } else if (!user.avatar && connection.avatar) {
            console.log('--- Update connection to remove avatar');
            connection = removeAvatarData(connection, user)
          } else if (user.avatar && user.avatar.name !== connection.avatar.name) {
            console.log('--- Update connection to update avatar');
            connection = getNewAvatarData(connection, user)
          }
          //update data and normalize notebooks
          updateConnectionsAndNotebooks(connection)
            .then(() => {
              console.log('--- IPC send:: sync-event-end to:: local-window');
              win.webContents.send('sync-event-end');
            });
        }
      })
    }


    //on begin:handshake event
    function onBeginHandshake() {
      console.log('--- on:: begin-handshake');

      //get user data
      UserController.find()
        .then((user) => {
          //build object
          const basicProfileData = {
            _id: user._id,
            name: user.name,
            type: 'external-client',
            socketId: nodeClientSocket.id,
            avatar: user.avatar
          };
          console.log(`--- --- emit:: end-handshake to:: ${service.data.name}`);
          //send object to server that emitted event
          nodeClientSocket.emit('end-handshake', basicProfileData);
        })
        .catch((reason) => {
          console.log('error finding user', reason)
        });
    }


    //on request:avatar
    //occurs when user follows client
    //occurs if their are changes with avatar
    function onRequestAvatar() {
      User.findOne({}, (err, user) => {
        if (!user.avatar || !user.avatar.absolutePath) {
          return;
        }
        UserController.encodeAvatar(user.avatar.absolutePath)
          .then((bufferString) => {

            let avatarData = user.avatar;
            avatarData.bufferString = bufferString;
            avatarData.userId = user._id;

            console.log('--- emit:: return:avatar to:: server that is connected (that made request)');
            nodeClientSocket.emit('return:avatar', avatarData);
          })
          .catch((err) => {
            console.log('There was an error', err);
            console.log('TODO: handle error')
          })
      });
    }

    //when a server returns avatar data after client has requested it
    function onReturnAvatar(avatarData) {
      console.log('');
      console.log('on:: return:avatar  (SOCKET CLIENT');
      //writes the avatar data to the file system
      //the text data should already be updated by this point
      UserController.writeAvatar(avatarData)
        .then((avatarDataNoBuffer) => {
          console.log('The avatar should be updated and written to FS successfully');
          remote.webContents.fromId(2).send('avatar-returned', avatarDataNoBuffer.userId);
        })
        .catch((err) => {
          console.log('there was an issue writing avatar image to fs', err)
        })
    }


    //on request:notebook-data
    //occurs when user follows client
    //occurs when user is following and handshake ends
    //can come from a new follow (api from server)
    //can come from endHandshake function (socket connection)
    function onRequestNotebookData(notebooks) {
      console.log('--- on:: request:notebook-data');

      notebookController.getNewAndUpdatedNotebooks(notebooks)
        .then((notebooks) => {
          //we have to loop through each one because of the date limits with socket.io library
          if (notebooks.length) {
            notebooks.forEach((notebook) => {
              console.log(`--- --- emit:: return:notebook-data to:: ${service.data.name}`);
              nodeClientSocket.emit('return:notebook-data', {notebook: notebook});
            });
          }
        })
        .catch((err) => {
          console.log('Error getting new and updated notebooks', err);
        });

    }


    function onConnect() {
     console.log('--- on:: connect');
     //when the connection is truly established, we add the service name ot the list.
     connectionList.push(service.name);
   }

    //modifies object with new avatar data
    function getNewAvatarData(connection, client) {
      //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
      console.log(`--- --- emit:: request:avatar to::  ${service.data.name}`);
      io.to(connection.socketId).emit('request:avatar');

      //resolve path
      //resolve absolutePath
      connection.avatar = client.avatar;
      connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', client.avatar.name);
      connection.avatar.path = path.normalize(client.avatar.path);
      connection.avatar = Object.assign({}, connection.avatar);
      return connection;
    }

    function removeAvatarData(connection, user) {
      fs.unlink(connection.avatar.absolutePath);
      connection.avatar = user.avatar;
      updateConnectionsAndNotebooks(connection);
      return connection;
    }

    function updateConnectionsAndNotebooks(connection) {
      console.log('--- IPC send:: sync-event-start to:: local-window');
      return new Promise((resolve, reject) => {

        connectionController.updateConnection(connection)
          .then((updatedConnection) => {
            console.log('--- IPC send:: update:connection');
            win.webContents.send('update:connection', updatedConnection || connection);


            notebookController.normalizeNotebooks(connection)
              .then((updatedNotebooks) => {
                console.log('--- IPC send:: update:synced-notebooks to:: local-window');
                win.webContents.send('update:synced-notebooks', updatedNotebooks);
                resolve(updatedNotebooks)
              })
              .catch((err) => {
                reject(err)
              });


          })
          .catch((err) => {
            reject(err)
          });


      });
    }
  }

};