'use strict';

const path = require('path');
const fs = require('fs');

const config = require('./../config/environment/index');
const socketUtil = require('./socket-util');
const bonjourService = require('./bonjour-service');
let localClient = {};

module.exports = function (glossaUser, mySession, io, browser, bonjour) {
  io.sockets.on('connection', function(socket) {
    console.log('new socket connection');

    //begin handshake
    console.log('emit:: request:socket-type');
    socket.emit('request:socket-type');

    socket.on('return:socket-type', function(data) {
      console.log('on:: return:socket-type - :type', data.type);

      if (data.type === 'local-client') {

        console.log('local socket connecting');
        localClient = {
          socketId: socket.id,
          name: glossaUser.name,
          _id: glossaUser._id,
          disconnect: false
        };

        glossaUser.localSocketId = socket.id;
        socketUtil.updateUser(glossaUser);
        socketUtil.validateOnlineConnections();


        console.log('local data normalized time to publish service on network');

        bonjourService.publish(glossaUser, browser, bonjour, function (err) {
          if (err) {
            return console.log('There was an error publishing bonjour service...');
          }
        });
      }
      if (data.type === 'external-client') {
        console.log('this is an external client server');

        console.log('emit:: notify:sync-begin to:: local-client');
        socketUtil.emitToLocalClient(io, localClient.localSocketId, 'notify:sync-begin');

        socketUtil.getConnection(data._id)
          .then(function(persistedClientData) {
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
              var changesMade = false;
              persistedClientData.online = true;
              persistedClientData.socketId = data.socketId;
              persistedClientData.disconnect = false;

              if (data.name != persistedClientData.name) {
                persistedClientData.name = data.name;
                changesMade = true;
              }
              if (data.avatar && data.avatar !== persistedClientData.avatar) {
                persistedClientData.avatar = data.avatar;
                console.log('emit:: request:avatar to:: local-client');
                socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:avatar', {});
                changesMade = true;
              }

              if (changesMade) {
                socketUtil.normalizeNotebooks(persistedClientData).then(function (changeObject) {
                console.log('emit:: normalize:notebooks to:: local-client');
                  socketUtil.emitToLocalClient(io, localClient.socketId, 'normalize:notebooks', changeObject)
                });
              }

              socketUtil.getUserSyncedData(persistedClientData).then(function (data) {
                console.log('emit:: request:updates to:: external-client');
                socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:updates', data);
              });
            }

            socketUtil.updateConnection(persistedClientData)
              .then(function(updatedClient) {
                console.log('emit:: update:connectionInfo to:: local-client');
                socketUtil.emitToLocalClient(io, localClient.socketId, 'update:connectionInfo', {connection: updatedClient});

                socketUtil.getConnections()
                  .then(function(data) {
                    console.log('emit:: send:connections to:: local-client');
                    socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                  })
              });
              console.log('adding socket to externalClientsRoom');
              socket.join('externalClientsRoom');
          })
      }
    });

    socket.on('request:connections', function() {
      console.log('on:: request:connections');
      socketUtil.getConnections()
        .then(function(data) {
          console.log('emit:: send:connections to:: local-client');
          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
        })
    });

    socket.on('disconnect', function() {
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
        console.log('disconnect if from external-client');
        socketUtil.getConnectionBySocketId(socket.id)
          .then(function (currentClient) {
            console.log('client disconnecting name:', currentClient.name);
            currentClient.disconnect = true;
            setTimeout(function () {
              if (currentClient.disconnect) {
                console.log('external-socket did not reconnecting in time');
                if (!currentClient.following) {
                  console.log('we are not following external-client');
                  console.log('removing connection from db.');
                  socketUtil.removeConnection(currentClient)
                    .then(function () {
                      console.log('get updated list of connections');
                      socketUtil.getConnections()
                        .then(function (data) {
                          console.log('amount of connections:', data.length);
                          console.log('emit:: send:connections to:: local-client');
                          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                      })
                  })
                } else {
                  console.log('we are following external-client');

                  currentClient.online = false;
                  delete currentClient.socketId;

                  console.log('update connections in db');
                  socketUtil.updateConnection(currentClient)
                    .then(function (data) {
                      console.log("data from update: ", data);
                      console.log('get updated list of connections');
                      socketUtil.getConnections()
                        .then(function (data) {
                          console.log('amount of connections:', data.length);
                          console.log('emit:: send:connections to:: local-client');
                          socketUtil.emitToLocalClient(io, localClient.socketId, 'send:connections', {connections: data});
                        })
                  });
                }
              }
            }, 3000);
        });
      }
    });

    socket.on('update:following', function (data) {
      console.log('');
      console.log('on:: update:following');

      let client = JSON.parse(data.connection);

      console.log('looking for connection in db');
      socketUtil.getConnection(client._id)
        .then(function(clientPersistedData) {
          console.log('modify following status');
          clientPersistedData.following = client.following;

          if (!clientPersistedData.following) {
            console.log('we are not following connection');
            if (clientPersistedData.avatar) {
              console.log('connections has avatar. need to remove from file system');
              socketUtil.removeAvatarImage(clientPersistedData.avatar)
                .then(function () {
                  console.log('avatar removed');
                  clientPersistedData.avatar = null;
              });
            }
          }

        console.log('update connection in database');
        socketUtil.updateConnection(clientPersistedData)
          .then(function (updatedConnection) {
            if (updatedConnection.following) {
              console.log('we are following connection');
              console.log('sync data with connection');
              console.log('TODO: notify local-client sync is taking place.');
              socketUtil.getUserSyncedData(updatedConnection)
                .then(function (data) {
                  console.log('base data queried to compare against.');
                  console.log('emit:: request:updates  to:: external-client');
                  socketUtil.emitToExternalClient(io, updatedConnection.socketId, 'request:updates', data);
                  console.log("requesting avatar.... ");
                  console.log('emit:: request:avatar  to:: external-client');
                  socketUtil.emitToExternalClient(io, updatedConnection.socketId, 'request:avatar', {});
                });
            }

          console.log('emit:: update:connection  to:: local-client');
          socketUtil.emitToLocalClient(io, localClient, 'update:connection', {connection: updatedConnection});
        })
      });
    });

    //data: {avatarString: Base64, imagePath: String, userData: object}
    socket.on('return:avatar', function (data) {
      console.log('on:: return:avatar ');

      var avatarData = {
        buffer: data.avatarString,
        path: data.imagePath
      };

      socketUtil.writeMediaFile(avatarData)
        .then(function() {
          socketUtil.getConnection(data.userData._id)
            .then(function(connection) {
              if (connection.name != data.userData.name) {
                connection.name = data.userData.name
              }
              if (connection.avatar != data.userData.avatar) {
                connection.avatar = data.userData.avatar
              }
              socketUtil.updateConnection(connection)
                .then(function(updatedConnection) {
                  console.log('emit:: update:connection  to:: local-client');
                  socketUtil.emitToLocalClient(io, localClient.socketId, 'update:connection', {connection: updatedConnection})
                })
          });
        });
    });

    //Listen from local-client
    //Emit to all external-clients
    socket.on('broadcast:Updates', function (data) {
      console.log('on:: broadcast:Updates');
      let mediaPromises = [];
      //encode image
      if (data.image) {
        mediaPromises.push(
          socketUtil.encodeBase64(data.image.path)
            .then(function(imageString) {
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
        console.log('');

        let updateObject = {
          update: data,
          user: {
            _id: glossaUser._id,
            name: glossaUser.name
          }
        };

        //send to clients
        console.log('emit:: onlineUser:updatesMade to:: all external clients');
        socketUtil.broadcastToExternalClients(io, 'rt:updates', updateObject);
        // socketUtil.broadcastToExternalClients(io, 'onlineUser:updatesMade', updateObject);
      });
    });

    socket.on('return:updates', function (data) {
      console.log('on:: return:updates');
      //store media promises in array
      let mediaPromises = [];
      //if there are updates...
      if (data.updates.length) {

        data.updates.forEach(function(update) {
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
            //delete image buffer from object.
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
              .then(function(updates) {
                socketUtil.getConnectionBySocketId(socket.id)
                  .then((connection) => {
                    connection.lastSync = Date.now(); //modify lastSync for client/connection
                    //update connection
                    socketUtil.updateConnection(connection)
                      .then((updatedConnection) => {
                      //emit changes to local-client
                        console.log('emit:: notify:externalChanges to:: local-client');
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:externalChanges', {
                          connection: updatedConnection,
                          updatedData: updates
                        });
                        console.log('emit:: notify:sync-end to:: local-client');
                        socketUtil.emitToLocalClient(io, localClient.localSocketId, 'notify:sync-end');
                    })
                });
            });
        });

      }
    });



  });



  function updatePersistedSocketConnection(socketId) {
    socketUtil.getUser().then(function (user) {
      user.localSocketId = socketId;
      socketUtil.updateUser(user);
    })
  }
};