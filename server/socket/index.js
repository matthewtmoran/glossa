'use strict';

const path = require('path');
const fs = require('fs');

const config = require('./../config/environment/index');
const socketUtil = require('./socket-util');
let localClient = {};
const main = require('../../main');


module.exports = function (glossaUser, mySession, io, bonjour, win) {
  console.log('socket index.js called');
  io.sockets.on('connection', function (socket) {
    console.log('');
    console.log('on:: connection');

    /////////////
    //handshake//
    /////////////

    console.log('emit:: begin-handshake');
    //every socket connection, ask for some data
    socket.emit('begin-handshake');


    //this should be the return of the data we asked for
    socket.on('end-handshake', endHandShake);
    // when a socket disconnects remove from connection list
    socket.on('disconnect', disconnect);

    //when client sends data back to us
    socket.on('sync-data:return', syncDataReturn);


    // console.log('emit:: request:socket-type');
    // socket.emit('request:socket-type');
    // socket.on('return:socket-type', onReturnSocketType);
    //
    //
    // //////////////////////////
    // //local-client listeners//
    // //////////////////////////
    //
    // socket.on('broadcast:profile-updates', onBroadcastProfileUpdates);
    // socket.on('broadcast:Updates', onBroadcastUpdates);
    // socket.on('request:connections', onRequestConnections);
    // socket.on('update:following', onUpdateFollowing);
    //
    //
    // /////////////////////////////
    // //external-client listeners//
    // /////////////////////////////
    //
    // socket.on('return:avatar', onReturnAvatar);
    // socket.on('return:updates', onReturnUpdates);
    //
    // socket.on('disconnect', onDisconnect);


    ////////////////////
    //socket functions//
    ////////////////////

    //client returns 'end-handshake with data'
    function endHandShake(client) {
      console.log('on:: endHandShake');
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
            console.log('TODO: begin display sync-event');
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
          console.log('is a new client');

          const clientData = {
            name: client.name,
            _id: client._id,
            type: 'external-client',
            following: false,
            lastSync: null,
            avatar: null,
            socketId: client.socketId,
            online: true
          };

          //concat to array
          global.appData.initialState.connections = [clientData, ...global.appData.initialState.connections]
        }


        socket.join('externalClientsRoom');

        main.getWindow(function (err, window) {
          if (err) {
            return console.log('error getting window...', err);
          }
          console.log("send:: update-connection-list local-window");
          window.webContents.send('update-connection-list');
        });

        //tell browser to update it's data.
        // win.webContents.send('update-connection-list');
      } else {
        //if it's not its probably someone at the coffee shop
        console.log('********SOMEONE IS SNOOPING*********')
      }
    }

    function disconnect() {
      console.log('');
      console.log('on:: disconnect');
      //get connection from list
      let connection = global.appData.initialState.connections.find(con => con.socketId === socket.id);

      if (!connection.following) {
        //remove non-followed users from connection array
        global.appData.initialState.connections = global.appData.initialState.connections.filter(con => con._id !== connection._id);
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
      main.getWindow(function (err, window) {
        if (err) {
          return console.log('error getting window...');
        }
        window.webContents.send('update-connection-list');
      });

    }

    //socket client returns data
    function syncDataReturn(data) {
      console.log('on:: sync-data:return');

      console.log('data', data);

      //if there is actually data to update...
      //TODO: at the very least update the last sync time
      if (data.notebooks.length) {
        socketUtil.syncDataReturn(data)
          .then((data) => {

            socketUtil.updateGlobalArrayObject(data);

            main.getWindow((err, window) => {
              if (err) {
                return console.log('error getting window...');
              }
              window.webContents.send('update-synced-notebooks');
            });


          })
      } else {
        console.log('no new data from this connection');
      }
      console.log('TODO: end display sync-event');
      console.log('TODO: update last sync time');


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

    //helper functions

    //modifiess dynamic data for persisted connection
    //TODO: I don't believe i need touch nedb since this is only data that lasts a session... and we update global.appData
    function existingConnection(connection, client) {
      console.log('is an offline client that we follow or connection dropped');
      connection.online = true;
      connection.socketId = client.socketId;
      return connection
    }


    /**
     * handshake response
     * determines respective connection type
     */
    function onReturnSocketType(data) {
      console.log('');
      console.log('on:: return:socket-type');

      if (data.type === 'external-client') {
        console.log('external-socket connected');
        console.log('...this is where another device has discovered us and is now connecting to us...');
        console.log('TODO: consider adding another room for followed clients...');

        //query for external-client data in database
        //return either an empty object or client data
        socketUtil.getConnection(data._id)
          .then(function (persistedClientData) {

            //if we are not following the user just create a basic object with updated state data
            if (!persistedClientData.following) {
              persistedClientData = {
                name: data.name,
                _id: data._id,
                type: 'external-client',
                following: false,
                lastSync: null,
                avatar: null,
                socketId: socket.id,
                online: true
              };
            } else {

              console.log('emit:: notify:sync-begin to:: local-client');
              socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:sync-begin');

              persistedClientData.online = true;
              persistedClientData.socketId = data.socketId;
              persistedClientData.disconnect = false; //for disconnect event handler

              //if client name has changes
              if (data.name !== persistedClientData.name) {
                persistedClientData.name = data.name;
              }
              //if new data has avatar and if avatar is not the same as the one we have stored...
              //TODO: need to check for avatar deletion....
              if (data.avatar && data.avatar !== persistedClientData.avatar) {
                persistedClientData.avatar = data.avatar;
                console.log('TODO: probably need to refractor for avatar discrepencies');
                console.log('emit:: request:avatar to:: external-client');
                socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:avatar', {});
              }

              //get all the client's data we have stroed
              // send a limited array of data to that client
              //that client will take the data compare it with the data is has and returns updatea/newdata
              socketUtil.getUserSyncedData(persistedClientData)
                .then(function (data) {
                  console.log('emit:: request:updates to:: external-client');
                  socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:updates', data);
                });
            }

            //update persisted database whether or not we are following user
            //send entire list back to local-client
            //normalizes notebooks
            socketUtil.updateConnection(persistedClientData, io);

            console.log('external-client added to externalClientsRoom');
            //add the socket to a room for broadcast events
            socket.join('externalClientsRoom');
          })
      }
    }

    /**
     * local-client profile updated
     * (used http post to update database and data received here is the response data on success
     * now we need to broadcast the changes to all connected clients
     * broadcast to all users changes in profile
     */
    function onBroadcastProfileUpdates() {
      console.log('');
      console.log('on:: broadcast:profile-updates');
      console.log('TODO: update to include phone numbers');
      console.log('TODO: update to include avatar');

      socketUtil.getUser().then(function (user) {
        let limitedUser = {};
        limitedUser._id = user._id;
        limitedUser.name = user.name;
        limitedUser.socketId = user.socketId;
        socketUtil.broadcastToExternalClients(io, 'rt:profile-updates', limitedUser);
      });

    }

    /**
     *
     * Listen from local-client
     * should happen whenever new posts are made by local-client
     * encodes media to base64
     * Emit rt:updates to all external-clients (in room)
     * @param data
     */
    function onBroadcastUpdates(data) {
      console.log('');
      console.log('on:: broadcast:Updates');
      let mediaPromises = [];
      //encode image
      if (data.image) {
        mediaPromises.push(
          socketUtil.encodeBase64(data.image.path)
            .then(function (imageString) {
              data.imageBuffer = imageString;
            })
        )
      }
      //encode audio
      if (data.audio) {
        mediaPromises.push(
          socketUtil.encodeBase64(data.audio.path)
            .then(function (audioString) {
              data.audioBuffer = audioString;
            })
        )
      }

      //once image and audio has been encoded...
      Promise.all(mediaPromises).then(function (result) {

        let updateObject = {
          update: data,
          user: {
            _id: glossaUser._id,
            name: glossaUser.name
          }
        };

        //send to clients
        console.log('emit:: rt:updates to:: all external clients');
        socketUtil.broadcastToExternalClients(io, 'rt:updates', updateObject);
      });
    }

    /**
     * local-client request connections
     * only emitted by local-client
     * TODO: consider deletion / refractor
     */
    function onRequestConnections() {
      console.log('on:: request:connections');
      socketUtil.getConnections()
        .then(function (data) {
          console.log('emit:: send:connections to:: local-client');
          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
        })
    }

    /**
     * when user toggles follow on an external client
     * @param data
     * TODO: refractor
     */
    function onUpdateFollowing(data) {
      console.log('');
      console.log('on:: update:following');
      let client = JSON.parse(data.connection);
      //qeury client
      socketUtil.getConnection(client._id)
        .then(function (clientPersistedData) {
          //toggle follow
          clientPersistedData.following = !client.following;
          if (!clientPersistedData.following) {
            console.log('we are NOT following connection');
            //if we are no longer following client
            unfollowConnection(clientPersistedData)
          } else {
            console.log('we are following connection');
            //if we are following client
            followConnection(clientPersistedData);
          }
        })
    }

    /**
     * response to 'request:avatar' emitted event
     * occurs during the handshake if client has update avatar
     * data:
     * @param data = {avatarString: Base64, imagePath: String, userData: object}
     */
    function onReturnAvatar(data) {
      console.log('');
      console.log('on:: return:avatar ');

      //store buffer object and path
      var avatarData = {
        buffer: data.avatarString,
        path: data.imagePath
      };

      //writes media to file system
      socketUtil.writeMediaFile(avatarData)
        .then(function () {
          console.log('TODO: watch results: media file written, client data note returned after, consider what we need to do to reflect changes')
        });
    }

    /**
     *
     * response to 'request:updates' emitted event
     * occurs during the handshake if a followed client is online
     * updates client data sync data
     * updates database with returned data
     * emits local-client with user and data(notebook) changes
     * emits to local-client end-sync event
     * @param data
     */
    function onReturnUpdates(data) {
      console.log('');
      console.log('on:: return:updates');
      //store media promises in array
      let mediaPromises = [];
      //if there are updates...
      if (data.updates.length) {

        data.updates.forEach(function (update) {
          //if imageBuffer exists then an image exists
          if (update.imageBuffer) {
            //create an object  with the buffer and the path of the iamge
            let imageUpdateObject = {
              path: update.image.path,
              buffer: update.imageBuffer
            };
            //store promise of image file in array
            mediaPromises.push(
              socketUtil.writeMediaFile(imageUpdateObject)
            );
            //delete image buffer from object so we don't save it in the db
            delete update.imageBuffer;
          }
          if (update.audioBuffer) {
            let audioUpdateObject = {
              path: update.audio.path,
              buffer: update.audioBuffer
            };

            mediaPromises.push(
              socketUtil.writeMediaFile(audioUpdateObject)
            );

            delete update.audioBuffer
          }
        });

        //once all media promises have resolved
        Promise.all(mediaPromises)
          .then(function (result) {
            //made this into a promise because I need to all to resolve.....
            socketUtil.updateOrInsert(data.updates, io);
            socketUtil.getConnectionBySocketId(socket.id)
              .then((connection) => {
                connection.lastSync = Date.now(); //modify lastSync for client/connection
                //update connection in database
                socketUtil.updateConnection(connection, io)
              });
            console.log('emit:: notify:sync-end to:: local-client');
            socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:sync-end');
          });

      } else {
        console.log('emit:: notify:sync-end to:: local-client');
        socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:sync-end');
      }
    }

    /**
     * disconnect event listener
     */
    function onDisconnect() {
      console.log('');
      console.log('on:: disconnect');
      if (socket.id === localClient.socketId) {
        console.log('socket disconnect is from local-client');
        localClient.disconnect = true;
        setTimeout(function () {
          if (localClient.disconnect) {
            console.log('local-client disconnected');
          }
        }, 2000)
      } else {
        //disconnect if from external-client
        socketUtil.getConnectionBySocketId(socket.id)
          .then(function (currentClient) {
            console.log('client disconnecting name:', currentClient.name);
            currentClient.disconnect = true;
            setTimeout(function () {
              if (currentClient.disconnect) {
                console.log('external-socket did not reconnecting in time');
                if (!currentClient.following) {
                  //we are not following external-client
                  //removing connection from db
                  socketUtil.removeConnection(currentClient)
                    .then(function () {
                      //get updated list of connections
                      socketUtil.getConnections()
                        .then(function (data) {
                          // console.log('amount of connections:', data.length);
                          console.log('emit:: send:connections to:: local-client');
                          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                        })
                    })
                } else {
                  //we are following external-client'

                  currentClient.online = false;
                  delete currentClient.socketId;

                  //update connections in db
                  //normalizes notebooks
                  socketUtil.updateConnection(currentClient, io)
                }
              }
            }, 3000);
          });
      }
    };
  });


};