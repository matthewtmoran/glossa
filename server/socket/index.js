'use strict';

var socketUtil = require('./socket-util');
var bonjourService = require('./bonjour-service');
var Notebooks = require('./../api/notebook/notebook.model.js');
var localClient = {};
var externalClients = [];
var externalSocketClient = require('./socket-client');
var path = require('path');
var fs = require('fs');
var config = require('./../config/environment/index');
var browser = null;

module.exports = function(glossaUser, mySession, io, browser, bonjour) {

    io.sockets.on('connection', function(socket) {
        console.log('%% SOCKET-SERVER - New socket connection');
        console.log('...begin handshake');


        ///////////////////////
        //Universal listeners//
        //////////////////////


        //////////////
        // handshake //
        /**
         * Request the kind of socket
         * Will return event: 'return:SocketType'
         * Will return either 'local-client' or 'external-client'
         */
        socket.emit('request:SocketType', {socketId: socket.id});


        /**
         * Return listener
         * @clientData - {socketType: String}
         */
        socket.on('return:SocketType', function(clientData) {
            console.log('...client accepted handshake');
            //if socket is a local client
            if (clientData.type === 'local-client') {

                localClientConnection(socket, glossaUser, io, browser, bonjour);

            } else if (clientData.type === 'external-client') {

                console.log('!!!!!!!! hand shake returned.  External Client !!!!!!!!!!');

                externalClientConnection(socket, io, glossaUser, clientData);

            }
        });

        socket.on('disconnect', function() {
            console.log('############DISCONNECT###################');
            console.log('browser.services.length', browser.services.length);
            //watch for local-client disconnect.... utliamtely this should shut down the server all together when we are using electron...  but for refresh, act like application is just starting up

            // externalSocketClient.destroyNodeClient();
            if (socket.id === localClient.socketId) {
                localClient.disconnect = true;

                setTimeout(function() {
                    if (localClient.disconnect) {
                        localClient = {};
                        bonjourService.destroy();
                    }
                }, 3000);

            } else {
                socketUtil.getConnectionBySocketId(socket.id).then(function(currentClient) {
                    currentClient.disconnect = true;
                    setTimeout(function() {
                        if (currentClient.disconnect) {
                            console.log('client has disconnected.');

                            if (!currentClient.following) {
                                socketUtil.removeConnection(currentClient).then(function() {
                                    console.log('removed connection');
                                    socketUtil.getConnections().then(function(connections) {
                                        console.log("emitting updated network user list", connections);
                                        socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: connections});
                                    })
                                })
                            } else {

                                currentClient.online = false;
                                delete currentClient.socketId;

                                socketUtil.updateConnection(currentClient).then(function(data) {
                                    console.log('client data updated');
                                    socketUtil.getConnections().then(function(connections) {
                                        console.log("emitting updated network user list");
                                        socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: connections});
                                    })
                                });
                            }

                            console.log('browser.services.length', browser.services.length)

                        }
                    }, 3000);
                });



            }
        });

    //////////////////////////
    //local-Client listeners//
    //////////////////////////


        socket.on('update:following', function(data) {
            console.log('');
            console.log('%% update:following Listener %%');

            var client = JSON.parse(data.connection);
            console.log('client', client);

            socketUtil.getConnection(client._id).then(function(clientPersistedData) {
                clientPersistedData.following = client.following;

                if (!clientPersistedData.following) {
                    console.log('no longer follwoing user....');
                    if (clientPersistedData.avatar) {
                        console.log('user has avatar... need to remove');
                        socketUtil.removeAvatarImage(clientPersistedData.avatar).then(function() {
                            console.log('remove avatar promise resolved');
                            clientPersistedData.avatar = null;
                        });
                    }
                }

                console.log('about to update connection', clientPersistedData);
                socketUtil.updateConnection(clientPersistedData).then(function(updatedConnection) {
                    if (updatedConnection.following) {
                        console.log('we are following user');
                        socketUtil.getUserSyncedData(updatedConnection).then(function(data) {
                            console.log('got current data:', data.length);
                            console.log('requesting updates...');
                            socketUtil.emitToExternalClient(io, updatedConnection.socketId, 'request:updates', data);
                            console.log("requesting avatar.... ");
                            socketUtil.emitToExternalClient(io, updatedConnection.socketId, 'request:avatar', {});
                        });
                    }
                    console.log('updating user list.... ');
                    socketUtil.emitToLocalClient(io, localClient, 'update:connection', {connection: updatedConnection});
                })
            });
        });

        /**
         * Called when user navigates to network settings state
         * Emits the current list of online users to client
         */
        //TODO: change this to user other event and verify we even need this listener
        socket.on('get:networkUsers', function(data) {
            socketUtil.getConnections().then(function(data) {
                socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList',  {onlineUsers: data});
            })
        });


        //data = {userProfile: String, avatarString: String}
        socket.on('update:userProfile', function(data) {

            var userProfile = JSON.parse(data.userProfile);

            socketUtil.getUser().then(function(user) {
                user = userProfile;
                socketUtil.updateUser(user).then(function(updatedUser) {

                    var completeConnectionData = {
                        name: user.name,
                        avatar: user.avatar,
                        _id: user._id
                    };

                    //here we update the notebooks in our db with our updated profile information.
                    socketUtil.normalizeNotebooks(updatedUser).then(function(changeObject) {
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'normalize:notebooks', changeObject)
                    });

                    console.log('TODO: broadcast to connections updated user data (and have them normalize the data)');
                    console.log('TODO: normalize our data');

                    socketUtil.broadcastToExternalClients(io, 'update:toConnectionData', completeConnectionData);

                })
            })
        });


        /**
         * When local-client changes are made, this broadcasts to every online user that changes are made
         *
         */
        //TODO: Should only broadcast to users that are following...
        //Listen from local-client
        //Emit to all external-clients
        socket.on('broadcast:Updates', function(data) {
            var mediaPromises = [];
            //encode image
            if (data.image) {
                mediaPromises.push(
                    socketUtil.encodeBase64(data.image.path).then(function(imageString) {
                        data.imageBuffer = imageString;
                    })
                )
            }
            //encode audio
            if (data.audio) {
                mediaPromises.push(
                    socketUtil.encodeBase64(data.audio.path).then(function(audioString) {
                        data.audioBuffer = audioString;
                    })
                )
            }

            //once image and audio has been encoded...
            Promise.all(mediaPromises).then(function(result) {
                console.log('all media promises have resolved');
                console.log('');

                var updateObject = {
                    update: data,
                    user: {
                        _id: glossaUser._id,
                        name: glossaUser.name
                    }
                };

                //send to clients
                socketUtil.broadcastToExternalClients(io, 'onlineUser:updatesMade', updateObject);
            });

        });


        socket.on('get:connections', function() {
            console.log('%% get:connections Heard in index.js %%');
            socketUtil.getConnections().then(function(data) {
                socketUtil.emitToExternalClient(io, localClient.socketId, 'send:connections', {connections: data})
            })
        });



        /////////////////////////////
    //external-client listeners//
    /////////////////////////////



        //data: {avatarString: Base64, imagePath: String, userData: object}
        socket.on('return:avatar', function(data) {
            console.log('%% return:avatar listener %%');

            console.log('return:avatar data', data.userData);

            var avatarData = {
                buffer: data.avatarString,
                path: data.imagePath
            };

            socketUtil.writeMediaFile(avatarData).then(function() {
                console.log('Avatar Image updated.... .');

                socketUtil.getConnection(data.userData._id).then(function(connection) {
                    if (connection.name != data.userData.name) {
                        connection.name = data.userData.name
                    }
                    if (connection.avatar != data.userData.avatar) {
                        connection.avatar = data.userData.avatar
                    }

                    socketUtil.updateConnection(connection).then(function(updatedConnection) {
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'update:connection', {connection: updatedConnection})
                    })
                });
            });
        });

        //@data = {updates: Array, clientId: String}
        socket.on('return:updates', function(data) {
            console.log('');
            console.log('%% return:updates Listener %%');
            //store media promises in array
            var mediaPromises = [];
            //if there are updates...
            if (data.updates.length) {

                data.updates.forEach(function(update) {
                    //if imageBuffer exists then an image exists
                    if (update.imageBuffer) {
                        //create an object  with the buffer and the path of the iamge
                        var imageUpdateObject = {
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
                        var audioUpdateObject = {
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
                Promise.all(mediaPromises).then(function(result) {

                    //store updates since we have to do them one by one
                    var insertedAndUpdated = [];
                    var query = {}; //initiate query object
                    var options = {returnUpdatedDocs: true, upsert: true}; //nedb options Insert must be true for new notebooks

                    //iterate through each update that was retrieved
                    data.updates.forEach(function(update) {
                       // query by notebook id
                       query = {_id: update._id};

                       Notebooks.update(query, update, options, function(err, updateCount, updatedDoc) {
                           if (err) {
                               return console.log('Error inserting new notebooks', err);
                           }
                           var timeStamp = Date.now();

                           //push document to array
                           insertedAndUpdated.push(updatedDoc);
                           //get connection
                           socketUtil.getConnectionBySocketId(socket.id).then(function(connection) {
                               connection.lastSync = timeStamp; //modify lastSync for client/connection
                               //update connection
                               socketUtil.updateConnection(connection).then(function(updatedConnection) {
                                   //emit changes to local-client
                                   socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:externalChanges', {connection: updatedConnection, updatedData: insertedAndUpdated});
                               })
                           });
                       })
                    });
                })
            }
        });
    });




    function localClientConnection(socket, glossaUser, io, browser, bonjour) {
        console.log('');
        console.log('local-client connecting');

        localClient = {
            socketId: socket.id,
            name: glossaUser.name,
            _id: glossaUser._id,
            disconnect: false
        };

        //basically keeps the socketId up-to-date in persisted data
        updatePersistedSocketConnection(localClient.socketId);

        console.log('initiate bonjour service');

        //publish our bonjour service
        //TODO: not sure we need this callback for anything but maybe it will be good if we actually pass errors
        console.log('publishing our bonjour service');
        bonjourService.publish(glossaUser, browser, bonjour, function(err) {
            if (err) {
                return console.log('There was an error publishing bonjour service...');
            }
        });

    }

    //when an external client comes online...
    function externalClientConnection(socket, io, glossaUser, externalClient) {

        //check persisted data for client
        socketUtil.getConnection(externalClient._id).then(function(persistedClientData) {
            //if we are following the user
            if (persistedClientData.following) {
                var changesMade = false; //flag 

                persistedClientData.online = true; // update data that toggles when user comes online
                persistedClientData.socketId = externalClient.socketId; 
                persistedClientData.disconnect = false;

                //if name changes update user at the ends
                if (externalClient.name != persistedClientData.name) {
                    persistedClientData.name = externalClient.name;
                    changesMade = true;
                }

                //TODO: might need ot be more indepth
                //if avatar is different and it exists in the user connection
                if (externalClient.avatar && externalClient.avatar !== persistedClientData.avatar) {
                    persistedClientData.avatar = externalClient.avatar;
                    socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:avatar', {});
                    changesMade = true;
                }

                if (changesMade) {
                    //normalize notebooks
                    socketUtil.normalizeNotebooks(persistedClientData).then(function(changeObject) {
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'normalize:notebooks', changeObject)
                    });
                }
                //get data we have already synced with user
                socketUtil.getUserSyncedData(persistedClientData).then(function(data) {
                    socketUtil.emitToExternalClient(io, persistedClientData.socketId, 'request:updates', data);
                });

            } else {
               // if we are not following user the create new object to cache
               persistedClientData = {
                    name: externalClient.name,
                    _id: externalClient._id,
                    type: 'external-client',
                    following: false,
                    lastSync: null,
                    avatar: null,
                    socketId: socket.id,
                    online: true
                };
            }

            //store information in database
            socketUtil.updateConnection(persistedClientData).then(function(updatedClient) {

                //send updated connection data to local-client
                socketUtil.emitToLocalClient(io. localClient.socketId, 'update:connectionInfo', {connection: updatedClient});

                //get most recent list of clients and send to local-client;
                socketUtil.getConnections().then(function(data) {
                    socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: data});
                })
            });

            //join the external room so we can broadcast events to all connections
            socket.join('externalClientsRoom');
        });
    }


    //keeps the socketId up-to-date
    function updatePersistedSocketConnection(socketId) {
        socketUtil.getUser().then(function(user) {
            user.localSocketId = socketId;
            socketUtil.updateUser(user);
        })
    }

};

