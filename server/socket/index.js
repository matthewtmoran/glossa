'use strict';

const path = require('path');
const fs = require('fs');
const config = require('./../config/environment/index');
const socketUtil = require('./socket-util');
const main = require('../../main');
const app = require('electron').app;
let localClient = {};
let connectedClients = {};


module.exports = function (io) {
  io.on('connection', function (socket) {
    console.log('');
    console.log('');
    console.log('on:: connection');
    console.log('socket.id:', socket.id);
    console.log('');

    /////////////
    //handshake//
    /////////////

    console.log('emit:: begin-handshake');
    //every socket connection, ask for some data
    socket.emit('begin-handshake');

    //this should be the return of the data we asked for
    socket.on('end-handshake', onEndHandshake);
    // when a socket disconnects remove from connection list
    socket.on('disconnect', disconnect);
    //when client sends data back to us
    socket.on('sync-data:return', syncDataReturn);
    //when a client has requested the actual avatar image file.
    socket.on('request:avatar', onRequestAvatar);

    socket.on('return:avatar', onReturnAvatar);


    ////////////////////
    //socket functions//
    ////////////////////

    //client returns 'end-handshake with data'
    function onEndHandshake(client) {
      console.log('on:: endHandShake');
      console.log(`User ${client.name} just connected. ID = ${client._id}`);
      console.log(`User ${client.name} socketID = ${client.socketId}`);

      connectedClients[socket.id] = {};
      connectedClients[socket.id].disconnected = false;

      let win = main.getWindow();
      console.log('IPC send:: sync-event-start to:: local-window', 'line 49');
      // win.webContents.send('sync-event-start');
      //dumb check just to make sure it's a client we want...
      if (client.type === 'external-client') {
        //update existing connections
        let connectionExists = false;
        global.appData.initialState.connections = global.appData.initialState.connections.map((connection) => {
          if (connection._id !== client._id) {
            return connection;
          }
          //update data that we do not store
          connection.online = true;
          connection.socketId = client.socketId;

          //i already know it's following here but just in case and for consitency sake
          if (connection.following) {
            //if client has avatar exists
            if ((client.avatar && client.avatar.name) && (!connection.avatar || !connection.avatar.name)) {
              console.log("client has avatar connection does not have avatar");
              //this means connection is null but client is not null
              //client has an avatar image we need
              getNewAvatarData(connection, client, win)
            } else if ((!client.avatar || !client.avatar.name) && (connection.avatar && connection.avatar.name)) {
              //this means client is null but connection is not null
              //client has removed his avatar image
              console.log('TODO: get rid of the stored avatar data we hold');
              fs.unlink(connection.avatar.absolutePath, (err) => {
                if (err) {
                 return console.log("There was an error trying to remove avatar file", err);
                }
              });
              delete connection.avatar;
            } else if (client.avatar && client.avatar.name && connection.avatar && connection.avatar.name && client.avatar.name !== connection.avatar.name) {
              //this means client has changed his avatar image to a new avatar
              console.log('TODO: remove the data we hold and get the new data');
              fs.unlink(connection.avatar.absolutePath);
              getNewAvatarData(connection, client, win)
            }

            socketUtil.syncData(connection, (data) => {
              console.log('emit:: sync-data to:: a client');
              io.to(client.socketId).emit('sync-data', data)
            });
          }
          connection = Object.assign({}, connection);
          connectionExists = true;
          return connection;
        });

        //if client still does not exist it means its a new client
        if (!connectionExists) {

          const clientData = {
            name: client.name,
            _id: client._id,
            type: 'external-client',
            following: false,
            lastSync: null,
            avatar: client.avatar,
            socketId: client.socketId,
            online: true
          };

          //concat to array
          global.appData.initialState.connections = [clientData, ...global.appData.initialState.connections]
        }

        socket.join('externalClientsRoom');
        console.log('IPC send:: update-connection-list');
        win.webContents.send('update-connection-list');

      } else {
        //if it's not its probably someone at the coffee shop
        console.log('********SOMEONE IS SNOOPING*********')
      }
    }

    function disconnect(reason, test) {
      let win = main.getWindow();
      console.log('');
      console.log('');
      console.log('');
      console.log('on:: disconnect');
      console.log('Server disconnect data:', reason);
      console.log('test:', test);
      console.log("socket.id", socket.id);
      console.log('');
      console.log('');
      console.log('');

      //get connection from list
      let connection = global.appData.initialState.connections.find(con => con.socketId === socket.id);

      if (!connection) {
        return console.log("no connection in global object.  Am going to throw an error")
      }

      if (!connection.following) {
        //remove non-followed users from connection array
        global.appData.initialState.connections = global.appData.initialState.connections.filter(con => con._id !== connection._id);
        console.log('global.appData.initialState.connections', global.appData.initialState.connections);
      } else {
        //if we are following, updated data don't remove
        global.appData.initialState.connections = global.appData.initialState.connections.map((con) => {
          if (con._id !== connection._id) {
            return con;
          }
          //reset dynamic data;
          con.online = false;
          delete con.socketId;
          con = Object.assign({}, con);
          return con;
        })
      }
      console.log('IPC send: update-connection-list');
      win.webContents.send('update-connection-list');

    }

    function getNewAvatarData(connection, client, win) {
      //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
      console.log('emit:: request:avatar to:: server that sent us basic changes');
      io.to(client.socketId).emit('request:avatar');

      //resolve path
      //resolve absolutePath

      connection.avatar = client.avatar;
      connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', client.avatar.name);
      connection.avatar.path = path.normalize(client.avatar.path);
      connection.avatar = Object.assign({}, connection.avatar);


      socketUtil.followedConnectionUpdate(connection)
        .then((updatedConnection) => {
          // socketUtil.updateGlobalArrayObject([updatedConnection], 'connection');
          global.appData.initialState.connections = global.appData.initialState.connections.map((con) => {
            return con;
          });
        });

      socketUtil.normalizeNotebooks(connection)
        .then((updatedNotebooks) => {
          socketUtil.updateGlobalArrayObject(updatedNotebooks, 'notebooks');
          console.log('IPC send:: update-synced-notebooks to:: local window');
          win.webContents.send('update-synced-notebooks');
        });
    }

    //socket client returns data
    function syncDataReturn(data) {
      console.log('on:: sync-data:return');
      let win = main.getWindow();

      //if there is actually data to update...
      //TODO: at the very least update the last sync time
      if (data.notebooks.length) {
        socketUtil.syncDataReturn(data)
          .then((data) => {

            socketUtil.updateGlobalArrayObject(data, 'notebooks');
            console.log('IPC send:: update-synced-notebooks to:: local-window');
            win.webContents.send('update-synced-notebooks');
            console.log('IPC send:: sync-event-end to:: local-window');
            win.webContents.send('sync-event-end');


          })
      } else {
        console.log('IPC send:: sync-event-end to:: local-window');
        win.webContents.send('sync-event-end');
        console.log('no new data from this connection');
      }
      //
      // //if there is actually data to update...
      // //TODO: at the very least update the last sync time
      // if (data.notebooks.length) {
      //   //write the media buffers to the file system
      //   socketUtil.writeSyncedMedia(data.notebooks)
      //     .then((notebooks) => {
      //     console.log('writeSyncedMedia has resolved');
      //       //when that is complete, update the database
      //       socketUtil.updateOrInsertNotebooks(notebooks)
      //         .then((notebooks) => {
      //           notebooks.forEach((notebook) => {
      //             let notebookExists = false;
      //
      //             //update the global object
      //             global.appData.initialState.notebooks.forEach((nb, index) => {
      //               if (nb._id === notebook._id) {
      //                 notebookExists = true;
      //                 //update the object
      //                 global.appData.initialState.notebooks[index] = Object.assign({}, notebook);
      //               }
      //             });
      //
      //             if (!notebookExists) {
      //               global.appData.initialState.notebooks = [notebook, ...global.appData.initialState.notebooks]
      //             }
      //           });
      //
      //           main.getWindow(function(err, window) {
      //             if (err) {
      //               return console.log('error getting window...');
      //             }
      //             window.webContents.send('update-synced-notebooks');
      //           });
      //
      //           //tell client to update notebooks
      //           // win.webContents.send('update-synced-notebooks');
      //         })
      //     })
      // } else {
      //   console.log('no new data from this connection');
      // }
      // console.log('TODO: end display sync-event');
      // console.log('TODO: update last sync time');
    }

    function onRequestAvatar() {
      console.log('on:: request:avatar');

      socketUtil.encodeBase64(global.appData.initialState.user.avatar.absolutePath)
        .then((bufferString) => {

          let avatarData = Object.assign({}, global.appData.initialState.user.avatar);
          avatarData.bufferString = bufferString;
          console.log('avatarData.path', avatarData.path);
          console.log('emit:: return:avatar');
          io.to(socket.id).emit('return:avatar', avatarData);

        })
    }

    function onReturnAvatar(data) {
      console.log('on:: return:avatar ');
      let win = main.getWindow();
      socketUtil.writeAvatar(data)
        .then(() => {
          console.log('IPC send:: update-connection-list');
          win.webContents.send('update-connection-list');
        })
    }

  });


};