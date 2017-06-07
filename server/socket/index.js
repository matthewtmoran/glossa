'use strict';

const path = require('path');
const fs = require('fs');

const config = require('./../config/environment/index');
const socketUtil = require('./socket-util');
let localClient = {};

module.exports = function (glossaUser, mySession, io) {
  io.sockets.on('connection', function (socket) {
    console.log('');
    console.log('new socket connection');

    /////////////
    //handshake//
    /////////////

    console.log('emit:: request:socket-type');
    socket.emit('request:socket-type');
    socket.on('return:socket-type', onReturnSocketType);


    //////////////////////////
    //local-client listeners//
    //////////////////////////

    socket.on('broadcast:profile-updates', onBroadcastProfileUpdates);
    socket.on('broadcast:Updates', onBroadcastUpdates);
    socket.on('request:connections', onRequestConnections);
    socket.on('update:following', onUpdateFollowing);


    /////////////////////////////
    //external-client listeners//
    /////////////////////////////

    socket.on('return:avatar', onReturnAvatar);
    socket.on('return:updates', onReturnUpdates);

    socket.on('disconnect', onDisconnect);



    ////////////////////
    //socket functions//
    ////////////////////

    /**
     * handshake response
     * determines respective connection type
     */
    function onReturnSocketType(data) {
      console.log('');
      console.log('on:: return:socket-type');

      if (data.type === 'local-client') {
        console.log('local-client connected');

        localClient = {
          socketId: socket.id,
          name: glossaUser.name,
          _id: glossaUser._id,
          disconnect: false
        };

        // glossaUser.localSocketId = socket.id; //TODO: consider deletion

        //Why do we update the existing user here?
        //update existing user to store in persistent data the new socketID
        console.log('...updating user with current state changes (socketId)');
        socketUtil.updateUser(localClient); //TODO: consider necessity .... I belive this is important because it allows us to call persisted data from socket client/util
        // socketUtil.validateOnlineConnections();

        //query connections and emit updated list to local-client
        socketUtil.getConnections()
          .then(function (data) {
            console.log('emit:: send:connections to:: local-client');
            socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
          });
      }

      if (data.type === 'external-client') {
        console.log('external-socket connected');
        console.log('...this is where another device has discovered us and is now connecting to us...');
        console.log('TODO: consider adding another room for followed clients...');
        console.log('emit:: notify:sync-begin to:: local-client');
        socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:sync-begin');

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

              var changesMade = false; //flag for changes check
              persistedClientData.online = true;
              persistedClientData.socketId = data.socketId;
              persistedClientData.disconnect = false; //for disconnect event handler

              //if client name has changes
              if (data.name !== persistedClientData.name) {
                console.log('name is different');
                persistedClientData.name = data.name;
                changesMade = true;
              }
              //if new data has avatar and if avatar is not the same as the one we have stored...
              //TODO: need to check for avatar deletion....
              if (data.avatar && data.avatar !== persistedClientData.avatar) {
                persistedClientData.avatar = data.avatar;
                console.log('TODO: probably need to refractor for avatar discrepencies');
                console.log('emit:: request:avatar to:: external-client');
                socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:avatar', {});
                changesMade = true;
              }

              //if changes have occurred
              if (changesMade) {
                console.log('');
                console.log('TODO: changes have been made but when we update the connection, we also normalize notebooks.... for now we are not doing anything here ');
                console.log('changes have been made...');
                // //normalize local data with client's updates
                // //this will
                // //emit event to the local-client with normalized updates
                // socketUtil.normalizeNotebooks(persistedClientData)
                //   .then(function (changeObject) {
                //     console.log('emit:: normalize:notebooks to:: local-client');
                //     socketUtil.emitToLocalClient(io, localClient.socketId, 'normalize:notebooks', changeObject)
                //   });
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
            socketUtil.updateConnection(persistedClientData, io, localClient)
              .then(function (updatedClient) {
                // console.log('TODO: consider just emitting single connection update event');
                // socketUtil.emitToLocalClient(io, localClient.socketId, 'update:connection', { connection:updatedClient} )
                // socketUtil.getConnections()
                //   .then(function (data) {
                //     console.log('emit:: send:connections to:: local-client');
                //     socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                //   })
              });

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

      socketUtil.getUser().then(function(user) {
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
            //TODO:Refractor this........ to many callbacks
            socketUtil.updateOrInsert(data.updates)
              .then(function (updates) {
                socketUtil.getConnectionBySocketId(socket.id)
                  .then((connection) => {
                    connection.lastSync = Date.now(); //modify lastSync for client/connection
                    //update connection in database
                    socketUtil.updateConnection(connection)
                      .then((updatedConnection) => {

                        console.log('emit:: notify:externalChanges to:: local-client');
                        //send local-client updated client data as well as the updated data
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:externalChanges', {
                          updatedData: updates
                        });

                        console.log('emit:: notify:sync-end to:: local-client');
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:sync-end');
                      })
                  });
              });
          });

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
                  socketUtil.updateConnection(currentClient)
                    .then(function (data) {
                      // console.log("data from update: ", data);
                      //get updated list of connections
                      socketUtil.getConnections()
                        .then(function (data) {
                          // console.log('amount of connections:', data.length);
                          console.log('emit:: send:connections to:: local-client');
                          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                        })
                    });
                }
              }
            }, 3000);
          });
      }
    };
  });





  ///////////
  //helpers//
  ///////////


  /**
   * removes avatar from file system
   * deletes avatar data;
   * normalizes notebooks
   * @param client
   */
  function unfollowConnection(client) {
    //if there is an avatar, remove avatar
    if (client.avatar) {
      socketUtil.removeAvatarImage(client.avatar)
        .then(function () {
          console.log('avatar removed from file system');
          // client.avatar = null;
          delete client.avatar;
          console.log('updateConnection in db');
          updateConnection(client)
        })
        .catch(function(err) {
          console.log('Error removing avatar from file system', err);
          delete client.avatar;
          updateConnection(client)
        })
    } else {
      console.log('no avatar');
      updateConnection(client);
    }
  }

  /**
   * called when user follows client
   * get data we may already have for user
   * emits to to external client request:updates with limited data objects
   * emits to external client request:avatar
   * updates client data
   * @param client
   */
  function followConnection(client) {
    socketUtil.getUserSyncedData(client)
      .then(function (data) {
        console.log('emit:: request:updates  to:: external-client');
        socketUtil.emitToExternalClient(io, client.socketId, 'request:updates', data);
        console.log('emit:: request:avatar  to:: external-client');
        console.log('TODO: I dont believe this adequately updates avatar data.......');
        socketUtil.emitToExternalClient(io, client.socketId, 'request:avatar', {});
      });
    console.log('TODO: consider if this overwrites data we need... or if it has the data we need...');
    console.log('TODO: verify no avatar descrepencies here... Im assuming there are issues.');
    updateConnection(client);
  }

  //TODO: refractor
  function updateConnection(client) {
    console.log('updating connection');
    socketUtil.updateConnection(client)
      .then(function (updatedConnection) {

        // console.log('emit:: update:connection  to:: local-client');
        // socketUtil.emitToLocalClient(io, localClient.socketId, 'update:connection', {connection: updatedConnection});
      })
  }


};