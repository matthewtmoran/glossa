'use strict';

var localSocketClient = require('./socket-local-client');
var socketUtil = require('./socket-util');
var bonjourService = require('./bonjour-service');
var Notebooks = require('./../api/notebook/notebook.model.js');
var localClient = {};
var externalClients = [];
var externalSocketClient = require('./socket-client');
var path = require('path');
var fs = require('fs');
var config = require('./../config/environment/index');

module.exports = function(glossaUser, mySession, io) {
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

                localClientConnection(socket, glossaUser, io);

            } else if (clientData.type === 'external-client') {

                externalClientConnection(socket, io, glossaUser, clientData);

            }
        });

        socket.on('disconnect', function() {
            console.log('############DISCONNECT###################');
            //watch for local-client disconnect.... utliamtely this should shut down the server all together when we are using electron...  but for refresh, act like application is just starting up

            // externalSocketClient.destroyNodeClient();
            if (socket.id === localClient.socketId) {
                localClient.disconnect = true;

                setTimeout(function() {
                    if (localClient.disconnect) {
                        localClient = {};
                        bonjourService.destroy();
                    }
                }, 5000);

            } else {
                var currentClient = getClientBySocketId(socket.id);
                currentClient.disconnect = true;


                setTimeout(function() {
                    if (currentClient.disconnect) {
                        removeFromOnlineList(currentClient.socketId);
                        socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: externalClients});
                    }
                }, 5000);
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

            socketUtil.getUser().then(function(user) {
                //if we are following
                if (client.following) {

                    //create object with only properties we want to store
                    var persistedData = {
                        name: client.name,
                        _id: client._id,
                        type: client.type,
                        following: client.following,
                        lastSync: client.lastSync,
                        avatar: client.avatar
                    };

                    //add to connections array
                    user.connections.push(persistedData);
                } else {
                    //if user is not following
                    user.connections.forEach(function(connection, index) {
                        if (connection._id === client._id) {
                            //remove from connections array
                            user.connections.splice(index, 1);
                        }
                    })
                }

                //update user with new connection data
                socketUtil.updateUser(user).then(function(updatedUser) {
                    if (client.following) {
                        //if client is online and if we are following user.
                        if (client.socketId && client.following) {
                            console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT - EMITTER');
                            // socketUtil.emitToExternalClient(client.socketId, 'request:updates', client)
                            socketUtil.requestingUpdates(client, function(data) {
                                socketUtil.emitToExternalClient(io, client.socketId, 'request:updates', data);
                            });
                        }
                    }
                })
            })

        });

        /**
         * Called when user navigates to network settings state
         * Emits the current list of online users to client
         */
        //TODO: change this to user other event and verify we even need this listener
        socket.on('get:networkUsers', function(data) {
            socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList',  {onlineUsers: externalClients});
        });


        //data = {userProfile: String, avatarString: String}
        socket.on('update:userProfile', function(data) {
            var userProfile = JSON.parse(data.userProfile);
            socketUtil.getUser().then(function(user) {
                user = userProfile;
                socketUtil.updateUser(user).then(function(updatedUser) {
                    console.log('TODO: broadcast to connections updated user data')
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
            if (data.image) {
                mediaPromises.push(
                    socketUtil.encodeBase64(data.image.path).then(function(imageString) {
                        data.imageBuffer = imageString;
                    })
                )
            }

            if (data.audio) {
                mediaPromises.push(
                    socketUtil.encodeBase64(data.audio.path).then(function(audioString) {
                        data.audioBuffer = audioString;
                    })
                )
            }

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


                socketUtil.broadcastToExternalClients(io, 'onlineUser:updatesMade', updateObject);
            });

        });



        /////////////////////////////
    //external-client listeners//
    /////////////////////////////


        // /**
        //  * Adds data from external-clients to local db
        //  * Emits changes to local-client
        //  *
        //  */
        // //TODO: convert to use only persisted data vs memory AND persisted data
        // socket.on('return:data-changes', function(dataChanges) {
        //     console.log('');
        //     console.log('%% SOCKET-SERVER - return:data-changes');
        //
        //     socketUtil.addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
        //         var updatedConnection;
        //         var timeStamp = Date.now();
        //
        //
        //         socketUtil.getUser().then(function(user) {
        //             user.connections.forEach(function(connection, index) {
        //                 if (connection._id === dataChanges.connectionId) {
        //                     console.log('*...is match');
        //                     connection.lastSync = timeStamp;
        //                     updatedConnection = connection;
        //                 }
        //             });
        //
        //             console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');
        //
        //
        //             socketUtil.updateUser(user).then(function(updatedUser) {
        //                 //emit to client
        //                 console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');
        //                 socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
        //             });
        //         });
        //     });
        // });


        //data: {avatarString: Base64, imagePath: String}
        socket.on('return:avatar', function(data) {
            console.log('%% return:avatar listener %%');

            var imagePath = path.join(__dirname, config.dataRoot, data.imagePath);

            var buffer = new Buffer(data.avatarString, 'base64', function(err) {
                if (err) {
                    return console.log('issue decoding base64 data');
                }
                console.log('buffer created....');
            });

            fs.writeFile(imagePath, buffer, function(err) {
                if (err) {
                    return console.log('There was an error writing file to filesystem', err);
                }
                console.log('image written to file system');
            })

        });

        //@data = {updates: Array, clientId: String}
        socket.on('return:updates', function(data) {
            console.log('');
            console.log('%% return:updates Listener %%');

            var mediaPromises = [];

            if (data.updates.length) {
                console.log('data.updates exists!!!!!!!!!');
                console.log('data.updates.length', data.updates.length);

                data.updates.forEach(function(update) {
                    console.log('update.name', update.name);
                    if (update.imageBuffer) {
                        console.log('There is an image to transfer...');
                        var imageUpdateObject = {
                            path: update.image.path,
                            buffer: update.imageBuffer
                        };
                        mediaPromises.push(
                            socketUtil.writeMediaFile(imageUpdateObject)
                        );

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

                Promise.all(mediaPromises).then(function(result) {

                    console.log('inserting updates count:...', data.updates.length);
                    Notebooks.insert(data.updates, function(err, newNotebooks) {
                        if (err) {
                            return console.log('Error inserting new notebooks', err);
                        }
                        var timeStamp = Date.now();
                        var updatedConnection;

                        console.log('number of new notebooks inserted:', newNotebooks.length);

                        socketUtil.getUser().then(function(user) {

                            var userId;
                            externalClients.forEach(function(client) {
                                if (client.socketId === socket.id) {
                                    userId = client._id;
                                }
                            });

                            user.connections.forEach(function(connection, index) {
                                if (connection._id === userId) {
                                    console.log('*...is match');
                                    connection.lastSync = timeStamp;
                                    updatedConnection = connection;
                                }
                            });

                            console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');
                            socketUtil.updateUser(user).then(function(updatedUser) {
                                //emit to client
                                console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');



                                socketUtil.emitToLocalClient(io, localClient.socketId, 'notify:externalChanges', {connection: updatedConnection, updatedData: newNotebooks});
                            });
                        });
                    });
                })
            }

        });


        //
        socket.on('get:updates', function(data) {
            console.log('%% SOCKET-SERVER get:updates Listener %%');

            console.log('TODO: get my updates and send to user who just requested them');




            // if (!data.lastSync) {
            //     socketUtil.getUser().then(function(user) {
            //         getNotebookChanges({
            //             'createdBy': user._id
            //         }).then(function(data) {
            //
            //             console.log('getNotebookChanges promise has resolved..... ');
            //             console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');
            //
            //             socketUtil.emitToExternalClient(io, socket.id, 'return:data-changes', {
            //                 connectionId: user._id, updatedData: data
            //             });
            //         });
            //     });
            //
            //     console.log('User has never connected');
            // } else {
            //     console.log('User has connected before');
            //
            //
            //     socketUtil.getUser().then(function(user) {
            //
            //         getNotebookChanges({
            //             'createdBy._id': user._id,
            //             "updatedAt": {$gte: new Date(data.lastSync)}
            //         }).then(function (results) {
            //
            //             console.log('getNotebookChanges promise has resolved..... ');
            //             console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');
            //             socketUtil.emitToExternalClient(io, socket.id, 'return:data-changes', {
            //                 connectionId: user._id, updatedData: results
            //             });
            //         });
            //     });
            // }
        });

    });

    function updatePersistedSocketConnection(socketId) {
        socketUtil.getUser().then(function(user) {
            user.localSocketId = socketId;
            socketUtil.updateUser(user);
        })
    }

    function localClientConnection(socket, glossaUser, io) {
        console.log('');
        console.log('local-client connecting');

        localClient = {
            socketId: socket.id,
            name: glossaUser.name,
            _id: glossaUser._id,
            disconnect: false
        };

        updatePersistedSocketConnection(localClient.socketId);

        console.log('initiate bonjour service');
        bonjourService.initListeners(localClient).then(function(service) {
            console.log('connect as a client to an external server.');
            externalSocketClient.initNodeClient(service, localClient, io);
        });

        //publish our bonjour service
        //TODO: not sure we need this callback for anything but maybe it will be good if we actually pass errors
        console.log('publishing our bonjour service')
        bonjourService.publish(glossaUser, function(err) {
            if (err) {
                return console.log('There was an error publishing bonjour service...');
            }
        });

    }
    function externalClientConnection(socket, io, glossaUser, externalClient) {
        socketUtil.getPersistedData(externalClient)
            .then(function(clientPersistedData) {
                console.log('the persisted data returned ... ', clientPersistedData);
                var clientStateData = {};
                //if persisted data returns it means we are following this user.
                if (clientPersistedData) {
                    console.log("TODO: we are following - sync");
                    console.log("Persisted client data: ", clientPersistedData);

                    var connectionChanges = false;

                    //never changes
                    clientStateData._id = clientPersistedData._id;
                    clientStateData.type = clientPersistedData.type;

                    //might change sometimes;
                    // get most up-to-date data from external-client data
                    clientStateData.name = externalClient.name;
                    clientStateData.avatar = externalClient.avatar || null;


                    //is updated on follow action so get it from persisted data
                    clientStateData.following = clientPersistedData.following;

                    //change often

                    //lastSync stored in persisted data
                    clientStateData.lastSync = clientPersistedData.lastSync;

                    //if we are hear, then the user is online...
                    clientStateData.online = true;
                    clientStateData.disconnect = false;

                    //socketId changes when socket connection is made
                    clientStateData.socketId = externalClient.socketId;

                    console.log('A user we are following is online so get updates....');
                    // socketUtil.emitToExternalClient(clientStateData.socketId, 'request:updates', externalClient);
                    socketUtil.requestingUpdates(clientStateData, function (err, data) {
                        if (err) {
                            return console.log('there was an error requesting updates...')
                        }
                        socketUtil.emitToExternalClient(io, clientStateData.socketId, 'request:updates', data);
                    });

                    //At this point clientStateData should be the most up-to-date

                    //                    TODO: change the data that is persisted per user connection

                    if (clientStateData.name !== clientPersistedData.name) {
                        connectionChanges = true;
                        console.log("Client name has changed");
                        console.log("TODO: update connection in user.connections array");
                    }

                    if (clientStateData.avatar && clientStateData.avatar !== clientPersistedData.avatar) {
                        connectionChanges = true;
                        console.log('Client avatar has changed');
                        console.log("TODO: Get new avatar image");
                        console.log("TODO: update connection in user.connections array");

                        socketUtil.emitToExternalClient(io, clientStateData.socketId, 'request:avatar', {});

                    }

                    if (connectionChanges) {

                        socketUtil.getUser().then(function (user) {
                            for (var i = 0, len = user.connections.length; i < len; i++) {
                                if (user.connections[i]._id === clientStateData._id) {
                                    user.connections[i].name = clientStateData.name;
                                    user.connections[i].avatar = clientStateData.avatar;
                                }
                            }

                            console.log('TODO: save user with updated connection');
                            socketUtil.updateUser(user).then(function (updatedUser) {
                                console.log('TODO: emit to local-client updated connections list........');
                            });
                        })


                    }

                } else {
                    console.log("TODO: we are NOT following add to online list");
                    clientStateData = {
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


                socket.join('externalClientsRoom');
                //TODO: fallback for the client to request online list once view has loaded...
                //this function should emit to the local client that a user has joined....

                console.log('adding to online list....');
                addToOnlineList(clientStateData)
            });
    }

    function removeFromOnlineList(socketId) {
        for (var i = 0, len = externalClients.length; i < len; i++) {
            if (externalClients[i].socketId === socketId) {
                externalClients.splice(i, 1);
                break;
            }
        }
        socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: externalClients})
    }

    function addToOnlineList(client) {
        var exists = false;
        for (var i = 0, len = externalClients.length; i < len; i++) {
            if (externalClients[i]._id === client._id) {
                exists = true;
                externalClients[i] = client;
                break;
            }
        }

        if (!exists) {
            externalClients.push(client);
        }
        console.log('Online user list: ', externalClients);
        console.log('%% SOCKET-SERVER - send:updatedUserList to local-client EMITTER %%');
        socketUtil.emitToLocalClient(io, localClient.socketId, 'send:updatedUserList', {onlineUsers: externalClients});
    }

    function getClientBySocketId(socketId) {
        var currentClient = {};
        externalClients.forEach(function(client) {
            if (client.socketId === socketId) {
                currentClient = client;
            }
        });
        return currentClient;
    }
};

