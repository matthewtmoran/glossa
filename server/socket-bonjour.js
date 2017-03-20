/**
 * local-client - refers to the local socket instance on electron/browser
 *              There should only ever be one local-client per glossa application
 * external-client - refers to an other glossa instance on the network however, more specifically, it is a socket-client as a node process
 *          There can be any number of external-clients
 */


//TODO: move as much as we can to persisted data vs memory

var config = require('./config/environment');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
var User = require('./api/user/user.model');
var Notebooks = require('./api/notebook/notebook.model');
var fs = require('fs');
var path = require('path');

module.exports = function(glossaUser, localSession, io) {

    var localClient = {}; // The local socket instance
    var externalClients = []; //List of connected external clients
    var browser; //bonjour browser object
    var myLocalService = {}; //Local instance of bonjour service

    //a public api so we can call some stuff from the main node process
    //TODO: figure out a better way to do this?
    var bonjourSocketApi = {
        stopService: stopService,
        getService: getService
    };


    /**
     * The main socket process.
     * local-clients and external-clients will call this process
     */
    io.sockets.on('connection', function(socket) {
        console.log('');
        console.log('%% SOCKET-SERVER - New socket connection - begin handshake');

        /////////////
        //handshake//
        /////////////
        /**
         * The handshake is where we validate the kind of socket that is connecting
         * The socket will either be a local-client or an external-client
         */

        /**
         * Request the kind of socket
         * Will return event: 'return:SocketType'
         * Will return either 'local-client' or 'external-client'
         */
        console.log('%% SOCKET-SERVER - request:SocketType EMITTER');
        socket.emit('request:SocketType', {socketId: socket.id});

        /**
         * Return listener
         * @clientData - {socketType: String}
         */
        socket.on('return:SocketType', function(clientData) {
            console.log('');
            console.log('%% SOCKET-SERVER - Socket type returned: ', clientData.type);

            //if socket is a local client
            if (clientData.type === 'local-client') {

                connectLocalClient(socket, ioClient, glossaUser);

                //    if socket is an external-client
            } else if (clientData.type === 'external-client') {

                console.log('');
                console.log('... external-client connected to socket server');
                console.log('... update local-db data with info from client');
                console.log('... update local-client with updated info');
                console.log('');
                connectExternalClient(socket, ioClient, glossaUser, clientData)

            }
        });


        ////////////////////////////////////////////////////////////



        ////////////////
        //other events//
        ////////////////


        /**
         * Listen from: local-client
         * Action: update local user data in db
         * Emit: none
         * @data = Array of updated user connection from local-client
         */
        socket.on('update:userConnections', function(data) {
            console.log('');
            console.log('%% SOCKET-SERVER - update:userConnections  listener');
            updateUserConnection(data)
        });

        //data = {userId: String, following: Boolean, socketId: String}
        socket.on('update:following', function(data) {
            getUser().then(function(user) {

                var updatedConnection;
                for(var i = 0, len = user.connections.length; i < len; i++) {
                    if (user.connections[i]._id === data.userId) {
                        user.connections[i].following = data.following;
                        updatedConnection = user.connections[i];
                        updatedConnection.socketId = data.socketId;
                        break;
                    }
                }

                updateUser(user).then(function(updatedUser) {
                    if (updatedConnection.following) {

                        console.log('TODO: get updates....', updatedConnection);

                        if (updatedConnection.socketId) {
                            console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT - EMITTER');

                            emitToExternalClient(updatedConnection.socketId, 'request:updates', updatedConnection)
                        }

                    }
                })
            })

        });


        // socket.on('update:userConnection', function(data) {
        //     console.log('%% SOCKET-SERVER - update:userConnection listener');
        //
        //     var updatedConnection = JSON.parse(data.connection);
        //
        //     getUser().then(function(user) {
        //
        //         for(var i = 0, len = user.connections.length; i < len; i++) {
        //             if (user.connections[i]._id === updatedConnection._id) {
        //                 user.connections[i] = updatedConnection;
        //             }
        //         }
        //
        //         updateUser(user).then(function(updatedUser) {
        //             if (updatedConnection.following) {
        //                 console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT - EMITTER');
        //                 emitToExternalClient(updatedConnection.socketId, 'request:updates', updatedConnection)
        //             }
        //         })
        //     });
        // });

        socket.on('get:updates', function(data) {
            if (!data.lastSync) {
                getUser().then(function(user) {
                    getNotebookChanges({
                        'createdBy': user._id
                    }).then(function(data) {

                        console.log('getNotebookChanges promise has resolved..... ');
                        console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');

                        emitToExternalClient(socket.id, 'return:data-changes', {
                            connectionId: user._id, updatedData: data
                        });
                    });
                });

                console.log('User has never connected');
            } else {
                console.log('User has connected before');


                getUser().then(function(user) {

                    getNotebookChanges({
                        'createdBy._id': user._id,
                        "updatedAt": {$gte: new Date(data.lastSync)}
                    }).then(function (results) {

                        console.log('getNotebookChanges promise has resolved..... ');
                        console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');
                        emitToExternalClient(socket.id, 'return:data-changes', {
                            connectionId: user._id, updatedData: results
                        });
                    });
                });
            }
        });



        ///////////////////////////////
        //Listeners from node-clients//
        //////////////////////////////

        /**
         * Node-client events are events that are typically emitted from external-clients
         */


        /**
         * Adds data from external-clients to local db
         * Emits changes to local-client
         *
         */

        //TODO: convert to use only persisted data vs memory AND persisted data
        socket.on('return:data-changes', function(dataChanges) {
            console.log('');
            console.log('%% SOCKET-SERVER - return:data-changes');

            addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
                var updatedConnection;
                var timeStamp = Date.now();


                getUser().then(function(user) {
                    user.connections.forEach(function(connection, index) {
                        if (connection._id === dataChanges.connectionId) {
                            console.log('*...is match');
                            connection.lastSync = timeStamp;
                            updatedConnection = connection;
                        }
                    });

                    console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');


                    updateUser(user).then(function(updatedUser) {
                        //emit to client
                        console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');
                        emitToLocalClient('notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
                    });
                });

                //update application data
                // for (var i = 0; i < glossaUser.connections.length; i++) {
                //     if (glossaUser.connections[i]._id === dataChanges.connectionId) {
                //         glossaUser.connections[i].lastSync = timeStamp;
                //         updatedConnection = glossaUser.connections[i];
                //     }
                // }
                //update external client list
                // externalClients.forEach(function(client, index) {
                //     if (client._id === dataChanges.connectionId) {
                //         client.lastSync = timeStamp;
                //     }
                // });


                //update persisted data


            });
        });


        socket.on('get:singleUserUpdates', function(connection) {
            console.log('%% SOCKET-SERVER - get:singleUserUpdates', connection);

            console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT EMITTER');
            emitToExternalClient(connection.socketId, 'request:updates', connection);
        });


        // socket.on('get:userUpdates', function() {
        //     console.log('%% (local-client listener) get:userUpdates %%');
        //
        //
        //
        //     console.log('Check for updates from online users');
        //
        //     externalClients.forEach(function(client) {
        //
        //         emitToExternalClient(client.socketId, 'request:updates', client);
        //
        //
        //     });
        //
        //     // externalClients.forEach(function(exClient) {
        //     //     if (exClient.isSharing) {
        //     //
        //     //     }
        //     // });
        //
        //     // if (glossaUser.connections) {
        //     //     glossaUser.connections.forEach(function(connection) {
        //     //
        //     //     })
        //     // }
        // });


        /**
         *  Triggered when an external-client requests info
         *  Emits to specific external client
         */
        socket.on('request:userData', function(data) {
            console.log('');
            console.log('%% SOCKET-SERVER - request:userData listener');
            console.log('... user ' + data.name + ' is requesting data');

            console.log('%% SOCKET-SERVER - return:userData to EXTERNAL-CLIENT EMITTER');
            emitToExternalClient(socket.id, 'return:userData', glossaUser);
        });


        ///////////////////////////////
        //listeners from local-client//
        ///////////////////////////////

        /**
         * Called when user navigates to network settings state
         * Emits the current list of online users to client
         */
        //TODO: change this to user other event and verify we even need this listener
        socket.on('get:networkUsers', function(data) {
            console.log('');
            console.log('%% SOCKET-SERVER - get:networkUsers listener');

            console.log('%% SOCKET-SERVER - send:updatedUserList EMITTER');
            console.log('externalClients', externalClients);
            emitToLocalClient('send:updatedUserList',  {onlineUsers: externalClients});
        });


        //data = {userProfile: String, avatarString: String}
        socket.on('update:userProfile', function(data) {
            console.log('%% SOCKET SERVER update:userProfile LISTENER%%');
            var userProfile = JSON.parse(data.userProfile);
            getUser().then(function(user) {
                user = userProfile;
                updateUser(user).then(function(updatedUser) {
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
            console.log('');
            console.log('%% SOCKET-SERVER - (local-client listener) broadcast:Updates');
            console.log('TODO: Should only broadcast to users that are following...');
            var updateObject = {
                update: data,
                user: {
                    _id: glossaUser._id,
                    name: glossaUser.name
                }
            };
           broadcastToExternalClients('onlineUser:updatesMade', updateObject)
        });





        /////////////////////////////////
        //broadcast to external-clients//

        socket.on('local-client:updates', function(data) {
            console.log('');
            console.log('%% SOCKET-SERVER - local-client:updates');
            console.log("TODO: is this^ event being used?");

            console.log('...broadcast to all external clients that a user has made updates');

            broadcastToExternalClients('external-clients:updates', {updates: 'there were some updated made', _id: glossaUser._id})


            // io.broadcast.to('externalClientsRoom').emit('external-clients:updates', {updates: 'there were some updated made', userId: glossaUser._id});
        });










        // socket.on('external-client:getUpdates', function(data) {
        //     console.log('%% external-client:getUpdates %%');
        //     console.log('...external client is requesting updates');
        //
        //     //query the db for updates since last time requesting user has synced with hosting user.
        //
        // });


        /**
         * When a socket disconnects
         * Remove from online list and
         * Emit event to client the updated list
         *
         */

        //TODO: we may want to stop the local service here but I'm not sure if its the best method
        socket.on('disconnect', function() {
            console.log('');
            console.log('%% SOCKET-SERVER - main socket process disconnect listener');


            removeFromOnlineList(socket.id);

            console.log('CLIENT OFFLINE - send updated user list to local-client', externalClients);
            emitToLocalClient('send:updatedUserList', {onlineUsers: externalClients});


        });
    });


    function initiateBonjour() {
        browser = bonjour.find({type: 'http'});

        browser.on('down', function(service) {
            console.log('');
            console.log('Service went down.......', service.name);
            console.log('Service on network:', browser.services.length);
        });

        browser.on('up', function(service) {
            console.log('');
            console.log('Service went/is live........', service.name);
            console.log('Service ', service);
            console.log('Services on network:', browser.services.length);

            //make sure network service is a glossa instance....
            if (service.name.indexOf('glossaApp') > -1) {
                console.log('A glossa Application is online');

                if (service.name === 'glossaApp-' + glossaUser._id) {
                    console.log('...Local service found IGNORE');
                } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                    console.log('...External service found CONNECT');
                    //    connect to external service as a client
                    connectAsNodeClient(service);
                }
            }


        });

        console.log('LOCAL CONNECTION DONE - Listening....')
    }

    function connectAsNodeClient(service) {
        var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        var nodeClientSocket = ioClient.connect(externalPath);

        //Listen from external-server
        nodeClientSocket.on('connect', function() {
            console.log('');
            console.log('%% EXTERNAL-CLIENT - CONNECTED as external-client %%');

            nodeClientSocket.on('request:SocketType', function(data) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - request:SocketType listner %%');

                var socketData = {
                    name: glossaUser.name,
                    _id: glossaUser._id,
                    type: 'external-client',
                    socketId: data.socketId
                };

                //return socket type to outside application
                console.log('%% EXTERNAL-CLIENT - return:SocketType EMITTER %%');
                nodeClientSocket.emit('return:SocketType', socketData);
            });

            //listen from external-server
            //Emit to external-server
            //When outside application disconnects this listener is triggered
            nodeClientSocket.on('notify:userDisconnected', function(data) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - notify:userDisconnected listener %%');
                // console.log('... outside application disconnected');

                console.log('%% EXTERNAL-CLIENT - update:userlist EMITTER %%');
                nodeClientSocket.emit('update:userlist', data);
            });


            //Listen from external-server
            nodeClientSocket.on('disconnect', function() {
                console.log('');
                // console.log('external-client disconnect listener');

                //disconnect socket.... this occurs when the server this socket is connected to closes.
                nodeClientSocket.disconnect(true);

            });

            //event comes from external-server
            //Emits back to external-server
            //data = has last sync attached to it....
            nodeClientSocket.on('request:updates', function(data) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - request:updates listener %%');
                if (!data.lastSync) {

                    getUser().then(function(user) {
                        getNotebookChanges({'createdBy': user._id}).then(function(data) {

                            console.log('getNotebookChanges promise has resolved..... ');
                            console.log('%% EXTERNAL-CLIENT return:data-changes EMITTER %%');
                            nodeClientSocket.emit('return:data-changes', {connectionId: user._id, updatedData: data});
                        });
                    });

                    console.log('User has never connected');
                } else {
                    console.log('User has connected before');


                    getUser().then(function(user) {

                        getNotebookChanges({
                            'createdBy._id': user._id,
                            "updatedAt": {$gte: new Date(data.lastSync)}
                        }).then(function (results) {

                            console.log('getNotebookChanges promise has resolved..... ');
                            console.log('%% EXTERNAL-CLIENT return:data-changes EMITTER %%');
                            nodeClientSocket.emit('return:data-changes', {
                                connectionId: glossaUser._id,
                                updatedData: results
                            });
                        });
                    });
                }
            });

            //Listen from external-server
            //Emit to local-client
            nodeClientSocket.on('return:data-changes', function(dataChanges) {
                addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
                    var updatedConnection;
                    var timeStamp = Date.now();

                    getUser().then(function(user) {
                        user.connections.forEach(function(connection, index) {
                            if (connection._id === dataChanges.connectionId) {
                                console.log('*...is match');
                                connection.lastSync = timeStamp;
                                updatedConnection = connection;
                            }
                        });

                        console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');
                        updateUser(user).then(function(updatedUser) {
                            //emit to client
                            console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');
                            emitToLocalClient('notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
                        });
                    });

                });
            });

            //@dataChanges = {update: object, user: object}
            //Listen from external-server
            //Emit to external-server (if following)
            nodeClientSocket.on('onlineUser:updatesMade', function(dataChanges) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - onlineUser:updatesMade listener %%');

                var externalUser = dataChanges.user;

                // //check if we are following this user
                getUser().then(function(user) {

                    user.connections.forEach(function(connection) {
                        if (connection._id === externalUser._id && connection.following) {
                            console.log('Following user, getUpdates');
                            console.log('%% EXTERNAL-CLIENT - request:updates EMITTER %%');
                            console.log('');
                            console.log('Need to get updates from ', dataChanges.user);
                            console.log('nodeClientSocket.id', nodeClientSocket.id);

                            nodeClientSocket.emit('get:updates', connection); //emit right back to the socket that bradcasted this event

                        }
                    });
                });

            });

            nodeClientSocket.on('request-updates:external-client', function(data) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - request-updates:external-client %%')
            })


        })
    }


    //data is an array. Nedb allows the insertion of arrays
    function addExternalData(data) {

        console.log('');
        console.log('addExternalData');

        console.log("Amount of data we are adding: ", data.length);

        data.forEach(function(notebook, index) {

            if (notebook.imageBuffer) {
                console.log('notebook ahs media buffer...');
                var imagePath = path.join(__dirname, config.dataRoot, notebook.image.path);

                console.log('imagePath',imagePath);

                var buffer = new Buffer(notebook.imageBuffer, 'base64', function(err) {
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
                    delete notebook.imageBuffer
                })
            }
        });


        return new Promise(function(resolve, reject) {
            Notebooks.insert(data, function(err, notebook) {
                if (err) {
                    console.log('There was an error inserting external Notebooks', err);
                    reject(err);
                }
                console.log('External Notebooks added to local database');
                resolve(notebook);
            })

        })
    }


    // //Triggered when a client connects to this socket
    function connectExternalClient(socket, ioClient, glossaUser, externalClient) {
        console.log('');
        console.log('~~connectExternalClient process BEGIN~~');
        console.log('CLIENT CONNECTION ONLINE', externalClient._id);


        socket.userId = externalClient._id;

        checkForPersistedData(externalClient).then(function(persitedData) {

            console.log('checkForPersistedData persitedData$$$$$$$$$$$$$$$$$', persitedData);


            persitedData.online = true;
            persitedData.socketId = socket.id;

            addToOnlineList(persitedData);
            socket.join('externalClientsRoom');

            if (persitedData.following) {
                emitToExternalClient(persitedData.socketId, 'request:updates', {lastSync: persitedData.lastSync});
            }

            console.log('~~connectExternalClient process END~~');
        });

        // externalClient = checkForStateData(socket, externalClient);
        //
        // console.log('externalClient', externalClient);
        //
        // console.log('Updating local-client with STATE update');
        //
        // emitToLocalClient('local-client:send:externalUserList', externalClients);
        //
        // console.log('now that an external-client has connected... check if we are following user: ', externalClient._id);
        //
        //
        //
        //
        // if(!externalClient.following) {
        //     console.log('We are not following user so do nothing')
        // } else {
        //     console.log('We are following so request changes');
        //
        //     emitToExternalClient(externalClient.socketId, 'request:updates', {lastSync: externalClient.lastSync});
        //
        // }

    }

    function removeFromOnlineList(socketId) {
        for (var i = 0, len = externalClients.length; i < len; i++) {
            if (externalClients[i].socketId === socketId) {
                externalClients.splice(i, 1);
                break;
            }
        }
        emitToLocalClient('send:updatedUserList', {onlineUsers: externalClients})
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
        console.log('%% SOCKET-SERVER - send:updatedUserList to local-client EMITTER %%');
        emitToLocalClient('send:updatedUserList', {onlineUsers: externalClients});
    }

    function checkForStateData(socket, externalClient) {
        console.log('')
        console.log('checkForStateData')
        var clientDataState = {
            name: externalClient.name,
            _id: externalClient._id,
            type: 'external-client',
            socketId: externalClient.socketId,
            lastSync: getLastSync(externalClient._id) || null,
            following: getFollowing(externalClient._id) || null
        };

        //add externalClient state data to list
        var userStateExists = false;
        externalClients.forEach(function(connection, index) {
            if (connection._id === externalClient._id) {
                console.log('this client is already in the online user list....');
                userStateExists = true;
                connection[index] = clientDataState;
            }
        });
        if (!userStateExists) {
            console.log('this client does not exist in the online user list');
            externalClients.push(clientDataState);
            socket.join('externalClientsRoom');
        }

        console.log('externalClients.length', externalClients.length);
        console.log('State Data Updated');
        return clientDataState;
    }

    function getFollowing(userId) {
        var isFollowing = false;

        glossaUser.connections.forEach(function(connection) {
            if (connection._id === userId) {
                isFollowing = connection.following;
            }
        });

        return isFollowing;
    }
    function getLastSync(userId) {
        var lastSync = null;

        glossaUser.connections.forEach(function(connection) {
            if (connection._id === userId) {
                lastSync = connection.lastSync;
            }
        });

        return lastSync;
    }

    function checkForPersistedData(externalClient) {
        var clientDataPersisted = {};
        var connectedBefore = false;
        return getUser().then(function(user) {

            for (var i = 0, len = user.connections.length; i < len; i++) {
               if (user.connections[i]._id === externalClient._id) {
                   console.log("...external-client exists.  Change dynamic data, save and return list.");
                   //update changing data...
                   connectedBefore = true;
                   clientDataPersisted = user.connections[i];
               }
            }

            if (!connectedBefore) {
                console.log('...external-client never has connected.  Add to connections list, save data and return list.');
                clientDataPersisted = {
                    name: externalClient.name,
                    _id: externalClient._id,
                    type: 'external-client',
                    following: false,
                    lastSync: null
                };
                user.connections.push(clientDataPersisted);
            }

            return updateUser(user).then(function(updatedUser) {
                console.log('... Updated User.connections list with external-client data');
               return clientDataPersisted
            });
        });



        // update or add user data in db.....
        //update the user's connection data then push the data to connected users array
        // var connectionExists = false;
        // glossaUser.connections.forEach(function(connection, index) {
        //     if (connection._id === externalClient._id) {
        //         connectionExists = true;
        //
        //
        //         console.log('...need to look for changes and update connection');
        //
        //         // connection.name = externalClient.name;
        //     }
        // });
        // if (!connectionExists) {
        //     glossaUser.connections.push(clientDataPersisted)
        // }
        // updateUser(glossaUser);
    }


    function getUser() {
        return new Promise(function(resolve, reject) {
            User.findOne({_id: glossaUser._id}, function(err, user) {
                if (err) {
                    console.log('There was an error finding the user', err);
                    reject(err);
                }
                console.log('user found success');
                resolve(user);
            })
        })
    }

    function updateUser(update) {
        var options = {returnUpdatedDocs: true};

        return new Promise(function(resolve, reject) {
            User.update({_id: glossaUser._id}, update, options, function(err, updateCount, user) {
                if (err) {
                    console.log('There was an error updating the user', err);
                    reject(err);
                }
                console.log('Persisted User Data Success');
                resolve(user);
                User.persistence.stopAutocompaction();
            })
        })
    }

    function getNotebookChanges(query) {
        console.log('getNotebookChanges');

        return new Promise(function(resolve, reject) {
            Notebooks.find(query, function(err, notebooks) {
                if (err) {
                    console.log('There was an error getting Notebook data for external request', err);
                    reject(err);
                }


                var mediaPromises = [];
                console.log("checking for media files");
                notebooks.forEach(function(notebook, index) {
                    if (notebook.image) {
                        var imagePromise = encodeBase64(notebook.image.path).then(function(data) {
                            notebook.imageBuffer = data;
                            return data
                        });
                        mediaPromises.push(imagePromise);
                    }

                    if (notebook.audio) {
                       var audioPromise = encodeBase64(notebook.audio.path).then(function(data) {
                            notebook.audioBuffer = data;
                            return data;
                        });
                        mediaPromises.push(audioPromise);
                    }

                });

                if (mediaPromises.length) {

                    console.log('mediaPromises', mediaPromises);
                    Promise.all(mediaPromises).then(function(data) {
                        console.log('all media promises have resolved');
                        console.log('');
                        resolve(notebooks);
                    });
                } else {
                    console.log('No media promises to resolve');
                    resolve(notebooks);
                }

            })
        })
    }

    function encodeBase64(mediaPath) {
        console.log('encoding into base64....');

        var myPath = path.join(__dirname, config.dataRoot, mediaPath);
        return new Promise(function(resolve, reject){
            fs.readFile(myPath, function(err, data){
                if (err) {
                    console.log('there was an error encoding media...');
                    reject(err);
                }
                resolve(data.toString('base64'));
            });
        });
    }

    function writeAvatar(avatarString, userData) {


        var buffer = new Buffer(avatarString, 'base64', function(err) {
            if (err) {
                return console.log('issue decoding base64 data');
            }
            console.log('buffer created....');
        });
        // var imagePath = path.join(__dirname, config.dataRoot

        console.log('buffer', buffer);


        // fs.writeFile(imagePath, buffer, function(err) {
        //     if (err) {
        //         return console.log('There was an error writing file to filesystem', err);
        //     }
        //     console.log('image written to file system');
        //     delete notebook.imageBuffer
        // })
    }


    function checkForUserConnection(userId) {
        console.log('checkForUserConnection');

        User.findOne({_id: glossaUser._id}, function(err, user) {
            if (err) {
                return console.log('There was an error looking for user connection');
            }


            var connection;
            for (var i = 0; i < user.connections.length; i++) {
                if (user.connections[i] === userId) {
                    connection = user.connections[i];
                }
            }

            return connection || false;

        });

    }

    function connectLocalClient(socket, ioClient, glossaUser) {

        console.log('~~connectLocalClient process BEGIN~~');

        localClient = {
            socketId: socket.id,
            name: glossaUser.name,
            _id: glossaUser._id
        };

        console.log('%% SOCKET-SERVER - notify:server-connection to local-client EMITTER %%');
        //let local client know handshake is successful
        emitToLocalClient('notify:server-connection', null);

        if (!browser || !browser.services.length) {

            //publish service
            myLocalService = bonjour.publish({
                name:'glossaApp-' + glossaUser._id,
                type: 'http',
                port: config.port,
                txt: {
                    userid: glossaUser._id
                }
            });

            console.log('Published my glossa App... : ', myLocalService.name);

        } else if (browser.services.length > 0) {
            //flag for local service
            var localServicePublished = false;

            //check for local service in published services
            for (var i = 0; i < browser.services.length; i++) {
                if (browser.services[i].name === 'glossaApp-' + glossaUser._id) {
                    localServicePublished = true;
                }
            }

            //if local service is not published publish service
            if (!localServicePublished) {
                console.log('...Services exist but they are not my service... Publishing my service....');
                myLocalService = bonjour.publish({
                    name:'glossaApp-' + glossaUser._id,
                    type: 'http',
                    port: config.port,
                    txt: {
                        userid: glossaUser._id
                    }
                });
            } else {
                console.log('my local service IS published!!!!!!!');
            }
        }
        initiateBonjour()
    }

    function getService() {
        return myLocalService || null;
    }

    function stopService() {
        myLocalService.stop(function() {
            console.log('Service Stop Success!');
        });
    }

    //changes should be an array of user connections
    function updateUserConnection(newConnections) {
        console.log('glossaUser.connections', glossaUser.connections);
        newConnections = JSON.parse(newConnections);
        var options = { returnUpdatedDocs: true};
        // var exists = false;


        for (var i = 0; i < newConnections.length; i++) {
            var exists = false;
            var currentChange;
            for (var j = 0; j < glossaUser.connections.length; j++) {
                currentChange = newConnections[i];
                if (newConnections[i]._id === glossaUser.connections[i]._id) {
                    console.log('update the existing connected user with changes');
                    exists = true;
                    glossaUser.connections[j] = newConnections[i];
                }
            }
            if (!exists) {
                console.log('add the connected user to connections list');
                glossaUser.connections.push(newConnections[i])
            }

        }

        console.log('glossaUser.connections', glossaUser.connections);

        updateUser(glossaUser).then(function(data) {
            // updateExternalClients(data);
            emitToLocalClient('local-client:send:externalUserList', externalClients);
        })

    }

    //update the local ui
    function emitToLocalClient(eventName, data) {
        io.to(localClient.socketId).emit(eventName, data);
    }

    //event to all external socket connections
    function broadcastToExternalClients(eventName, data) {
        io.to('externalClientsRoom').emit(eventName, data)
    }

    //emit to specific external client
    function emitToExternalClient(socketId, eventName, data) {
        io.to(socketId).emit(eventName, data);
    }


    return bonjourSocketApi;
};
