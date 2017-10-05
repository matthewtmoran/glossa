'use strict';

const path = require('path');
const fs = require('fs');
const config = require('./../config/environment/index');
const socketUtil = require('./socket-util');
const main = require('../../main');
const app = require('electron').app;

const User = require('./../api/user/user.model.js');
const Notebooks = require('./../api/notebook/notebook.model.js');
const Connection = require('./../api/connections/connection.model');
const Session = require('./../api/session/session.model');
const Transcriptions = require('./../api/transcription/transcription.model');
const Hashtags = require('./../api/hashtag/hashtag.model');

const notebookController = require('../api/notebook/notebook.controller');

let localClient = {};
let connectedClients = {};


module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('');
    console.log('on:: connection');
    console.log('');

    /////////////
    //handshake//
    /////////////

    console.log('STEP 1 - emit:: begin-handshake');
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

    socket.on('return:new-data', onReturnNewData);

    ////////////////////
    //socket functions//
    ////////////////////


    //when data is returned from connections
    function onReturnNewData(data) {
      console.log('on:: sync-data:return');
      let win = main.getWindow();

      //if there is actually data to update...
      //TODO: at the very least update the last sync time
      if (data.notebooks.length) {
        notebookController.newDataReturned(data)
          .then((notebooks) => {
            console.log('IPC send:: update:synced-notebooks to:: local-window');
            win.webContents.send('update:synced-notebooks');
            win.webContents.send('sync-event-end');
          })
          .catch((err) => {
            console.log('Error updating new data', err);
            win.webContents.send('sync-event-end');
          })

      } else {
        console.log('IPC send:: sync-event-end to:: local-window');
        win.webContents.send('sync-event-end');
        console.log('no new data from this connection');
      }
    }

    //client returns 'end-handshake with data'
    function onEndHandshake(client) {
      console.log('STEP 2  -  on:: end-handshake');
      console.log(`User ${client.name} just connected. ID = ${client._id}`);
      console.log(`User ${client.name} socketID = ${client.socketId}`);

      //keep track of connections
      connectedClients[socket.id] = {};
      connectedClients[socket.id].disconnected = false;

      //get main window object
      let win = main.getWindow();

      // console.log('IPC send:: sync-event-start to:: local-window', 'line 49');
      // win.webContents.send('sync-event-start');
      //dumb check just to make sure it's a client we want...
      if (client.type === 'external-client') {
        //update existing connections
        Connection.findOne({_id: client._id}, (err, connection) => {
          if (err) {return console.log('error finding connection');}
          if (!connection) {
            console.log('STEP 3(c) - new user, we know we are not following at this point');
            console.log('is a brand new connection');

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

            return Connection.insert(clientData, (err, newConnection) => {
              if (err) {
                return console.log('error inserting new connection', err);
              }
              console.log('SEND:: new:connection');
              console.log('TODO: change to socket event');
              socket.join('externalClientsRoom');
             return win.webContents.send('new:connection', newConnection);
            });
          }

          console.log("connection already exists");

          //updates dynamic data
          connection.online = true;
          connection.socketId = client.socketId;
          connection.name = client.name;

          if (connection.following) {
            console.log('STEP 3(a) - get data we are following');
            //should return an updated connection object
            //takes the new connection that already exists and updates profile data accordingly
            returnUpdateInfo(connection, client)
              .then((modifiedConnection) => {
                const options = {returnUpdatedDocs: true};
                Connection.update(modifiedConnection, options, (err, updatedCount, updatedConnection) => {
                  if (err) {return err;}


                  socket.join('externalClientsRoom');
                  //send new connection object to local-client
                  console.log('SEND:: update:connection', updatedConnection);
                  console.log('TODO: change to socket event');
                  win.webContents.send('update:connection', updatedConnection);


                  //normalize exising notebooks with new user data
                  notebookController.normalizeNotebooks(updatedConnection)
                    .then((updatedNotebooks) => {
                      console.log('SEND:: update:synced-notebooks');
                      console.log('TODO: change to socket event');
                      //send local-client updated notebooks
                      win.webContents.send('update:synced-notebooks', updatedNotebooks);
                    })
                    .catch((err) => {
                      console.log('there was an issue normalizing notebooks', err);
                    });
                });

                //get notebook data created by user
                notebookController.getExistingNotebooks(modifiedConnection)
                  .then((notebookSummaries) => {
                    //send notification to local client that we have begun syncing
                    win.webContents.send('sync-event-start');
                    //send notebook summary to connection
                    io.to(modifiedConnection.socketId).emit('request:new-data', notebookSummaries)
                  })
                  .catch((err) => {
                    console.log('Error getting existing notebooks.')
                  });
              });
          } else {
            console.log('STEP 3(b) - not following user, but we store it in the db till it disconnects');
            const options = {returnUpdatedDocs: true};
            //update connection
            Connection.update(connection, options, (err, updatedCount, updatedConnection) => {
              if (err) {
                return err;
              }
              console.log('SEND:: update:connection', updatedConnection);
              console.log('TODO: change to socket event');
              socket.join('externalClientsRoom');
              //send new connection object to local-client
              win.webContents.send('update:connection', updatedConnection);

              //normalize existing notebooks with new user data
              notebookController.normalizeNotebooks(updatedConnection)
                .then((updatedNotebooks) => {
                  console.log('SEND:: update:synced-notebooks');
                  console.log('TODO: change to socket event');
                  //send local-client updated notebooks
                  win.webContents.send('update:synced-notebooks', updatedNotebooks);
                })
                .catch((err) => {
                  console.log('there was an issue normalizing notebooks', err);
                });
            })
          }
        });
      } else {
        console.log('SOMEONE IS SNOOPING');
      }
    }

    //when profile data is returned from connections
    function returnUpdateInfo(connection, client) {
      return new Promise((resolve, reject) => {

        //update name if it is not the same
        if (connection.name !== client.name) {connection.name = client.name;}
        //if client has avatar object exist and client avatar name exists as a field
        //and
        //connection.avatar does not exist or if the connection.avatar.name field does not exist
        if ((client.avatar && client.avatar.name) && (!connection.avatar || !connection.avatar.name)) {
          //request avatar, which will is async but modifies connection object with new avatar data

          getNewAvatarData(connection, client)
            .then((con) => {
              resolve(con);
            })
          //  if client.avatar does not exist or if client.avatar.name field does not exist
          //  and
          //  connection.avatar exists and connection.avatar.name field exists,
          //  remove the file and remove the avatar data on the connection object
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
          resolve(connection);
          //  if client avatar exists and client avatar.name exists and connection.avatar exists and connection.avatar.name eixsts and client .avatar.name is not the same as connection.avatar.name
        } else if (client.avatar && client.avatar.name && connection.avatar && connection.avatar.name && client.avatar.name !== connection.avatar.name) {
          //this means client has changed his avatar image to a new avatar
          //remove the image attached to the connection object and get new data
          fs.unlink(connection.avatar.absolutePath);
          getNewAvatarData(connection, client)
            .then((con) => {
              resolve(con);
            })
        }
      })
    }

    function disconnect(reason) {
      let win = main.getWindow();
      console.log('');
      console.log('on:: disconnect');
      console.log('');

      Connection.findOne({socketId: socket.id}, (err, connection) => {
        if (err) {
          return console.log("could not find client on disconnect");
        }
        if (!connection) {
          return console.log('This connection does not exist');
        }

        if (!connection.following) {
          Connection.remove({socketId: socket.id}, (err, count) => {
            if (err) {
              return console.log('Error removing connection on disconnect');
            }
            console.log('Send:: remove:connection');
            console.log('TODO: change to socket event');
            win.webContents.send('remove:connection', connection);
          })
        } else {
          connection.online = false;
          connection.socketId = false;
          const options = {returnUpdateDocs: true};
          Connection.update({_id: connection._id}, connection, options, (err, updatedCount, updatedConnection) => {
            if (err) {
              return console.log('Error updating connection on disconnect');
            }
            console.log('Send:: update:connection');
            console.log('TODO: change to socket event');
            win.webContents.send('update:connection', updatedConnection);
          })
        }
      });
    }

    //modifies object with new avatar data
    function getNewAvatarData(connection, client, win) {
      return new Promise((resolve, reject) => {

        //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
        console.log('emit:: request:avatar to:: server that sent us basic changes');
        io.to(client.socketId).emit('request:avatar');

        //resolve path
        //resolve absolutePath
        connection.avatar = client.avatar;
        connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', client.avatar.name);
        connection.avatar.path = path.normalize(client.avatar.path);
        connection.avatar = Object.assign({}, connection.avatar);

        resolve(connection);

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
    }

  });


};