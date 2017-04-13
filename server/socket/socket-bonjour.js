/**
 * local-client - refers to the local socket instance on electron/browser
 *              There should only ever be one local-client per glossa application
 * external-client - refers to an other glossa instance on the network however, more specifically, it is a socket-client as a node process
 *          There can be any number of external-clients
 */


//TODO: move as much as we can to persisted data vs memory

var config = require('./../config/environment/index');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
var User = require('./../api/user/user.model.js');
var Notebooks = require('./../api/notebook/notebook.model.js');
var fs = require('fs');
var path = require('path');
var socketUtil = require('./socket-util');
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
            socketUtil.updateUserConnection(data)
        });

        //data = {userId: String, following: Boolean, socketId: String}
        socket.on('update:following', function(data) {

            console.log('');
            console.log('%% update:following Listener %%');

            var client = JSON.parse(data.connection);

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
                            requestingUpdates(client);
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
        //     socketUtil.getUser().then(function(user) {
        //
        //         for(var i = 0, len = user.connections.length; i < len; i++) {
        //             if (user.connections[i]._id === updatedConnection._id) {
        //                 user.connections[i] = updatedConnection;
        //             }
        //         }
        //
        //         socketUtil.updateUser(user).then(function(updatedUser) {
        //             if (updatedConnection.following) {
        //                 console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT - EMITTER');
        //                 socketUtil.emitToExternalClient(updatedConnection.socketId, 'request:updates', updatedConnection)
        //             }
        //         })
        //     });
        // });

        socket.on('get:updates', function(data) {
            if (!data.lastSync) {
                socketUtil.getUser().then(function(user) {
                    getNotebookChanges({
                        'createdBy': user._id
                    }).then(function(data) {

                        console.log('getNotebookChanges promise has resolved..... ');
                        console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');

                        socketUtil.emitToExternalClient(io, socket.id, 'return:data-changes', {
                            connectionId: user._id, updatedData: data
                        });
                    });
                });

                console.log('User has never connected');
            } else {
                console.log('User has connected before');


                socketUtil.getUser().then(function(user) {

                    getNotebookChanges({
                        'createdBy._id': user._id,
                        "updatedAt": {$gte: new Date(data.lastSync)}
                    }).then(function (results) {

                        console.log('getNotebookChanges promise has resolved..... ');
                        console.log('%% SOCKET-SERVER return:data-changes EMITTER %%');
                        socketUtil.emitToExternalClient(io, socket.id, 'return:data-changes', {
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

            socketUtil.addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
                var updatedConnection;
                var timeStamp = Date.now();


                socketUtil.getUser().then(function(user) {
                    user.connections.forEach(function(connection, index) {
                        if (connection._id === dataChanges.connectionId) {
                            console.log('*...is match');
                            connection.lastSync = timeStamp;
                            updatedConnection = connection;
                        }
                    });

                    console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');


                    socketUtil.updateUser(user).then(function(updatedUser) {
                        //emit to client
                        console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');
                        socketUtil.emitToLocalClient(io, 'notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
                    });
                });
            });
        });


        socket.on('get:singleUserUpdates', function(connection) {
            console.log('%% SOCKET-SERVER - get:singleUserUpdates', connection);

            console.log('%% SOCKET-SERVER - request:updates to EXTERNAL-CLIENT EMITTER');
            socketUtil.emitToExternalClient(io, connection.socketId, 'request:updates', connection);
        });

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
            console.log('data: ', data);

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



                        socketUtil.emitToLocalClient(io, 'notify:externalChanges', {connection: updatedConnection, updatedData: newNotebooks});
                    });
                });
            });




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
        //         socketUtil.emitToExternalClient(client.socketId, 'request:updates', client);
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
        // socket.on('request:userData', function(data) {
        //     console.log('');
        //     console.log('%% SOCKET-SERVER - request:userData listener');
        //     console.log('... user ' + data.name + ' is requesting data');
        //
        //     console.log('%% SOCKET-SERVER - return:userData to EXTERNAL-CLIENT EMITTER');
        //     socketUtil.emitToExternalClient(socket.id, 'return:userData', glossaUser);
        // });


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
            socketUtil.emitToLocalClient(io, 'send:updatedUserList',  {onlineUsers: externalClients});
        });


        //data = {userProfile: String, avatarString: String}
        socket.on('update:userProfile', function(data) {
            console.log('%% SOCKET SERVER update:userProfile LISTENER%%');
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
           socketUtil.broadcastToExternalClients(io, 'onlineUser:updatesMade', updateObject)
        });





        /////////////////////////////////
        //broadcast to external-clients//

        socket.on('local-client:updates', function(data) {
            console.log('');
            console.log('%% SOCKET-SERVER - local-client:updates');
            console.log("TODO: is this^ event being used?");

            console.log('...broadcast to all external clients that a user has made updates');

            socketUtil.broadcastToExternalClients(io, 'external-clients:updates', {updates: 'there were some updated made', _id: glossaUser._id})

        });



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

    //where serve connects as node client to other apps
    function connectAsNodeClient(service) {
        var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        var nodeClientSocket = ioClient.connect(externalPath);

        //Listen from external-server
        nodeClientSocket.on('connect', function() {
            console.log('');
            console.log('%% EXTERNAL-CLIENT - CONNECTED as external-client %%');

            nodeClientSocket.on('request:SocketType', function(data) {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - request:SocketType listener %%');

                socketUtil.getUser().then(function(user) {

                    var socketData = {
                        name: user.name,
                        _id: user._id,
                        type: 'external-client',
                        socketId: data.socketId,
                        avatar: user.avatar
                    };

                    //return socket type to outside application
                    console.log('%% EXTERNAL-CLIENT - return:SocketType EMITTER %%');
                    nodeClientSocket.emit('return:SocketType', socketData);
                });



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

            nodeClientSocket.on('request:avatar', function() {
                console.log('');
                console.log('%% EXTERNAL-CLIENT - request:avatar Listener %%');
                socketUtil.getUser().then(function(user) {
                   socketUtil.encodeBase64(user.avatar).then(function(data) {
                       var avatarString = data;
                        nodeClientSocket.emit('return:avatar', {avatarString: avatarString, imagePath: user.avatar});
                   });
                });
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
                console.log('Data that already exists.....::', data);
                var userId;
                socketUtil.getUser().then(function(user) {
                    userId = user._id
                });


                var newNotebookEntries = [];

                Notebooks.find({}, function(err, notebooks) {
                    if (err) {
                        return console.log('There was an Error', err);
                    }

                    notebooks.forEach(function(notebook) {
                        var exists = false;
                        data.forEach(function(d) {
                            if (notebook._id === d._id) {
                                console.log('Notebook data MATCHES check for update');
                                exists = true;

                                if (notebook.updatedAt == d.updatedAt) {
                                    console.log('updatedAt is equal....');
                                } else {
                                    console.log('typeof notebook.updatedAt', typeof notebook.updatedAt);
                                    console.log('typeof d.updatedAt',typeof d.updatedAt);
                                }
                            }
                        });

                        if(!exists) {
                            console.log('This is a new entry.........');
                            newNotebookEntries.push(notebook);
                        }

                    });



                    console.log('Notebooks that are new sending back to requester:', newNotebookEntries);

                    nodeClientSocket.emit('return:updates', {updates: newNotebookEntries});
                });


            });

            // nodeClientSocket.on('request:updates', function(data) {
            //     console.log('');
            //     console.log('%% EXTERNAL-CLIENT - request:updates listener %%');
            //     if (!data.lastSync) {
            //
            //         socketUtil.getUser().then(function(user) {
            //             getNotebookChanges({'createdBy': user._id}).then(function(data) {
            //
            //                 console.log('getNotebookChanges promise has resolved..... ');
            //                 console.log('%% EXTERNAL-CLIENT return:data-changes EMITTER %%');
            //                 nodeClientSocket.emit('return:data-changes', {connectionId: user._id, updatedData: data});
            //             });
            //         });
            //
            //         console.log('User has never connected');
            //     } else {
            //         console.log('User has connected before');
            //
            //
            //         socketUtil.getUser().then(function(user) {
            //
            //             getNotebookChanges({
            //                 'createdBy._id': user._id,
            //                 "updatedAt": {$gte: new Date(data.lastSync)}
            //             }).then(function (results) {
            //
            //                 console.log('getNotebookChanges promise has resolved..... ');
            //                 console.log('%% EXTERNAL-CLIENT return:data-changes EMITTER %%');
            //                 nodeClientSocket.emit('return:data-changes', {
            //                     connectionId: glossaUser._id,
            //                     updatedData: results
            //                 });
            //             });
            //         });
            //     }
            // });

            //Listen from external-server
            //Emit to local-client
            nodeClientSocket.on('return:data-changes', function(dataChanges) {
                socketUtil.addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
                    var updatedConnection;
                    var timeStamp = Date.now();

                    socketUtil.getUser().then(function(user) {
                        user.connections.forEach(function(connection, index) {
                            if (connection._id === dataChanges.connectionId) {
                                console.log('*...is match');
                                connection.lastSync = timeStamp;
                                updatedConnection = connection;
                            }
                        });

                        console.log('SYNC TIMESTAMP MUST BE UPDATED !!!!!!');
                        socketUtil.updateUser(user).then(function(updatedUser) {
                            //emit to client
                            console.log('%% SOCKET-SERVER - notify:externalChanges to LOCAL-CLIENT - EMITTER');
                            socketUtil.emitToLocalClient(io, 'notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
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
                socketUtil.getUser().then(function(user) {

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



    // //Triggered when a client connects to this socket
    function connectExternalClient(socket, ioClient, glossaUser, externalClient) {
        console.log('');
        console.log('~~connectExternalClient process BEGIN~~');
        console.log('Data passed when external client connects: ', externalClient);
        console.log('CLIENT CONNECTION ONLINE', externalClient._id);
        getPersistedData(externalClient)
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

                    //socketId changes when socket connection is made
                    clientStateData.socketId = externalClient.socketId;

                    console.log('A user we are following is online so get updates....');
                    // socketUtil.emitToExternalClient(clientStateData.socketId, 'request:updates', externalClient);
                    requestingUpdates(clientStateData);

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

                        socketUtil.getUser().then(function(user) {
                            for(var i = 0, len = user.connections.length; i < len; i++) {
                                if (user.connections[i]._id === clientStateData._id) {
                                    user.connections[i].name = clientStateData.name;
                                    user.connections[i].avatar = clientStateData.avatar;
                                }
                            }

                            console.log('TODO: save user with updated connection');
                            socketUtil.updateUser(user).then(function(updatedUser) {
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

                console.log('adding to onine list....');
                addToOnlineList(clientStateData)
        });


        function requestingUpdates(client) {
            console.log('');
            console.log('requestingUpdates');
            console.log('client', client);


            var query = {'createdBy._id': client._id};
            var notebookData = [];

            Notebooks.find(query, function(err, notebooks) {
                if (err) {
                    console.log('error finding notebooks....', err);
                }
                console.log('Notebooks found..', notebooks.length);
                notebooks.forEach(function(nb) {
                    notebookData.push({_id: nb._id, updatedAt: nb.updatedAt})
                });

                console.log('notebookData', notebookData);
                socketUtil.emitToExternalClient(io, client.socketId, 'request:updates', notebookData);
            });


        }




        // checkIfFollowing(externalClient, socket.id).then(function(clientStateData) {
        //
        //     console.log('Adding user to online list', clientStateData);
        //
        //     addToOnlineList(clientStateData);
        //     socket.join('externalClientsRoom');
        //     if (clientStateData.following) {
        //         socketUtil.emitToExternalClient(clientStateData.socketId, 'request:updates', {lastSync: clientStateData.lastSync});
        //     }
        // });

        /*
        checkForPersistedData(externalClient).then(function(persitedData) {

            console.log('checkForPersistedData persitedData$$$$$$$$$$$$$$$$$', persitedData);


            persitedData.online = true;
            persitedData.socketId = socket.id;



            console.log('~~connectExternalClient process END~~');
        });
         */
    }


    function getPersistedData(externaClient) {
        var persistedConnection = null;
        return socketUtil.getUser().then(function(user) {
            user.connections.forEach(function(connection) {
                if (connection._id === externaClient._id) {
                    persistedConnection = connection;
                }
            });
            return persistedConnection;
        })
    }

    function checkIfFollowing(externaClient) {
        console.log('');
        console.log('checkIfFollowing');
        var isFollowing = false;
        return socketUtil.getUser().then(function(user) {

            user.connections.forEach(function(connection) {
                if (connection._id === externaClient._id) {
                    isFollowing = true;
                }
            });

            console.log('Returning isFollowing', isFollowing);
            return isFollowing;
        })
    }

    /*
    function checkIfFollowing(externalClient, socketId) {
        console.log('');
        console.log('checkIfFollowing');
        var clientStateData = {
            name: externalClient.name,
            _id: externalClient._id,
            type: 'external-client',
            following: null,
            lastSync: null,
            avatar: externalClient.avatar || null,
            socketId: socketId,
            online: true
        };
        var isFollowing = false;
        return socketUtil.getUser().then(function(user) {
            for (var i = 0, len = user.connections.length; i < len; i++) {
                //if external client exists... it means user is following
                if (user.connections[i]._id === externalClient._id) {
                    isFollowing = true;

                    //update avatar if it is different

                    if (user.connections[i].avatar !== clientStateData.avatar && clientStateData.avatar) {
                        console.log('TODO: get user avatar...');
                        console.log('TODO: normalize data');
                        user.connections.avatar = clientStateData.avatar;
                    }

                    if (user.connections[i].name !== clientStateData.name) {
                        user.connections[i].name = clientStateData.name;
                        console.log('TODO: normalize data')
                    }

                    socketUtil.updateUser(user);


                    //update state data
                    clientStateData.lastSync = user.connections[i].lastSync;
                    clientStateData.following = user.connections[i].following;


                    console.log('TODO: get new updates from user');

                }
            }
            return clientStateData;
        })
    }

     */

    function removeFromOnlineList(socketId) {
        for (var i = 0, len = externalClients.length; i < len; i++) {
            if (externalClients[i].socketId === socketId) {
                externalClients.splice(i, 1);
                break;
            }
        }
        socketUtil.emitToLocalClient(io, 'send:updatedUserList', {onlineUsers: externalClients})
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
        socketUtil.emitToLocalClient(io, 'send:updatedUserList', {onlineUsers: externalClients});
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
                        var imagePromise = socketUtil.encodeBase64(notebook.image.path).then(function(data) {
                            notebook.imageBuffer = data;
                            return data
                        });
                        mediaPromises.push(imagePromise);
                    }

                    if (notebook.audio) {
                       var audioPromise = socketUtil.encodeBase64(notebook.audio.path).then(function(data) {
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
        socketUtil.emitToLocalClient(io, 'notify:server-connection', null);

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


    //update the local ui

    return bonjourSocketApi;
};
