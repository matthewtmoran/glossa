const path = require('path');
const fs = require('fs');
const app = require('electron').app;
const config = require('../config/environment');
const ioClient = require('socket.io-client');
const main = require('../../main');
const User = require('./../api/user/user.model.js');

const Notebooks = require('./../api/notebook/notebook.model.js');
const notebookController = require('../api/notebook/notebook.controller');
const userController = require('../api/user/user.controller');

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

  connect: function (service, io, win, nodeClientSocket) {
    nodeClientSocket.on('connect', onConnect);
    nodeClientSocket.on('begin-handshake', onBeginHandshake);
    nodeClientSocket.on('request:avatar', onRequestAvatar);
    nodeClientSocket.on('request:notebook-data', onRequestNotebookData);
    nodeClientSocket.on('send-profile-updates', onProfileUpdates);
    nodeClientSocket.on('return:avatar', onReturnAvatar);

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

    function onBeginHandshake() {
      console.log('--- on:: begin-handshake');

      User.findOne({}, (err, user) => {
        if (err) {return console.log('error finding user');}

        const basicProfileData = {
          _id: user._id,
          name: user.name,
          type: 'external-client',
          socketId: nodeClientSocket.id,
          avatar: user.avatar
        };

        console.log('--- emit:: end-handshake to:: external node server');
        nodeClientSocket.emit('end-handshake', basicProfileData);
        console.log('');
      });
    }

    function onRequestAvatar() {
      User.findOne({}, (err, user) => {
        if (!user.avatar || !user.avatar.absolutePath) {
          return;
        }
        userController.encodeAvatar(user.avatar.absolutePath)
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
      console.log('on:: return:avatar ');
      //writes the avatar data to the file system
      //the text data should already be updated by this point
      userController.writeAvatar(avatarData)
        .then((avatarDataNoBuffer) => {
          console.log('The avatar should be updated and written to FS successfully');
          main.getWindow().webContents.send('avatar-returned', avatarDataNoBuffer.userId);
        })
        .catch((err) => {
          console.log('there was an issue writing avatar image to fs', err)
        })
    }

    //triggered when a server asks for notebook data
    //data - array of notebooks that external server already has
    //can come from a new follow (api from server)
    //can come from endHandshake function (socket connection)
    function onRequestNotebookData(notebooks) {
      console.log('');
      console.log('--- on:: request:notebook-data');
      console.log("--- IPC send:: sync-event-start local-window");
      win.webContents.send('sync-event-start');


      notebookController.getNewAndUpdatedNotebooks(notebooks)
        .then((notebooks) => {
          console.log('--- emit:: return:notebook-data to:: server who requested it');

          nodeClientSocket.emit('test:test', {testData: 'this is a string!'});
          if (notebooks.length) {
            notebooks.forEach((notebook) => {
              console.log('--- emit:: return:notebook-data');
              nodeClientSocket.emit('return:notebook-data', {notebook: notebook});
            });
          }

          console.log("--- IPC send:: sync-event-end local-window");
          win.webContents.send('sync-event-end');
        })
        .catch((err) => {
          console.log('Error getting new and updated notebooks', err);
          console.log("--- IPC send:: sync-event-end local-window");
          win.webContents.send('sync-event-end');
        });

    }


    function onConnect() {
     console.log('');
     console.log('--- on:: connect');
     console.log('');

     //when the connection is truly established, we add the service name ot the list.
     connectionList.push(service.name);
   }

    //modifies object with new avatar data
    function getNewAvatarData(connection, client) {
      //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
      console.log('emit:: request:avatar to:: server that sent us basic changes');
      console.log('emitting event to : ', client.socketId);
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