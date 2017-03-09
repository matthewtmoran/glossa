var config = require('./config/environment');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
var User = require('./api/user/user.model');
var Notebooks = require('./api/notebook/notebook.model');
var fs = require('fs');
var path = require('path');

module.exports = function(glossaUser, localSession, io) {

    var localClient = {};
    var externalClients = [];
    var browser;
    var myLocalService = {};

    var bonjourSocketApi = {
        stopService: stopService,
        getService: getService
    };


    io.sockets.on('connection', function(socket) {
        console.log('...New socket connection - begin handshake');

        /////////////
        //handshake//
        /////////////

        //request the socket type from the newly connected socket
        socket.emit('request:SocketType', {socketId: socket.id});

        //socktype listener
        socket.on('return:SocketType', function(clientData) {
            console.log('...Socket type returned: ', clientData.type);

            //if socket is a local client
            if (clientData.type === 'local-client') {

                connectLocalClient(socket, ioClient, glossaUser);

                //    if socket is an external-clietn
            } else if (clientData.type === 'external-client') {

                connectExternalClient(socket, ioClient, glossaUser, clientData)

            }
        });


        ////////////////////////////////////////////////////////////



        ////////////////
        //other events//
        ////////////////


        // socket.on('request:data-changes', function(data) {
        //     console.log('%% (external-listener) request:data-changes %%');
        //     if (data.lastSync) {
        //         console.log('query db up to last sync date')
        //     }
        //
        //     if (!data.lastSync) {
        //         console.log('get all updates....');
        //     }
        // });


        /**
         * Listen from: local-client
         * Action: update local user data in db
         * Emit: none
         * @data = Array of updated user connection from local-client
         */
        socket.on('update:userConnections', function(data) {
            console.log('%% update:userConnections  listener%%');
            updateUserConnection(data)
        });




        ///////////////////////////////
        //Listeners from node-clients//
        //////////////////////////////

        //listener for the updated user list
        socket.on('update:userlist', function() {
            //  to local client the updated user list

            emitToLocalClient('local-client:send:externalUserList', externalClients);

            // socket.to(localClient.socketId).emit('local-client:send:externalUserList',externalClients);
        });

        socket.on('notify:buttonPressed', function(data) {
            console.log('%% notify:buttonPressed %%');

            emitToLocalClient('local-client:send:buttonPressed', data);

            // io.to(localClient.socketId).emit('local-client:send:buttonPressed', data);
        });


        socket.on('return:data-changes', function(dataChanges) {
            console.log('%% (external-client) return:data-changes %%');

            addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
                var updatedConnection;
                var timeStamp = Date.now();

                //update application data
                for (var i = 0; i < glossaUser.connections.length; i++) {
                    if (glossaUser.connections[i]._id === dataChanges.connectionId) {
                        glossaUser.connections[i].lastSync = timeStamp;
                        updatedConnection = glossaUser.connections[i];
                    }
                }
                //update external client list
                externalClients.forEach(function(client, index) {
                    if (client._id === dataChanges.connectionId) {
                        client.lastSync = timeStamp;
                    }
                });


                //update persisted data
                updateUser(glossaUser).then(function(data) {
                    //emit to client
                    emitToLocalClient('notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
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



        //listener for userData request
        socket.on('request:userData', function(data) {
            console.log('%% request:userData listener %%');
            console.log('... user ' + data.name + ' is requesting data');

            emitToExternalClient(socket.id, 'return:userData', glossaUser);

            // socket.emit('return:userData', glossaUser);
        });


        ///////////////////////////////
        //listeners from local-client//
        ///////////////////////////////

        socket.on('get:networkUsers', function(data) {
            console.log('%% get:networkUsers listener @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@22%%');
            socket.emit('local-client:send:externalUserList', externalClients)
        });

        socket.on('broadcast:Updates', function(data) {

            console.log('%% (local-client listener) broadcast:Updates %%');

            var updateObject = {
                update: data,
                user: {
                    _id: glossaUser._id,
                    name: glossaUser.name
                }
            };

           broadcastToExternalClients('external-ss:real-time-update:all', updateObject)
        });





        /////////////////////////////////
        //broadcast to external-clients//


        socket.on('local-client:buttonTest', function(data) {
            console.log('%% local-client:buttonTest %%');

            console.log('...broadcast to all external clients that a user has pressed a button');

            broadcastToExternalClients('external-clients:buttonPressed', {updates: 'there were some updated made', _id: glossaUser._id})

            // io.sockets.in('externalClientsRoom').emit('external-clients:buttonPressed', {updates: 'there were some updated made', userId: glossaUser._id});

        });


        socket.on('local-client:updates', function(data) {
            console.log('%% local-client:updates %%');

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



        socket.on('disconnect', function() {
            console.log('%% main socket process disconnect listener %%');

            //if the local-client disconnects....
            // if (localClient.socketId === socket.id) {
            //     //un-publish our service
            //     myLocalService.stop();
            // }

            console.log('externalClients.length', externalClients.length);

            for (var i = 0; i < externalClients.length; i++) {
                if (externalClients[i].socketId === socket.id) {

                    externalClients.splice(i, 1);
                }
            }

            emitToLocalClient('local-client:send:externalUserList', externalClients);

        });
    });


    function initiateBonjour() {
        browser = bonjour.find({type: 'http'});

        browser.on('down', function(service) {
            console.log('service went down.......', service.name);
        });

        browser.on('up', function(service) {

            //make sure network service is a glossa instance....
            if (service.name.indexOf('glossaApp') > -1) {
                console.log('A glossa Application is online');

                if (service.name === 'glossaApp-' + glossaUser._id) {
                    console.log('...local service found IGNORE');
                } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                    console.log('...connecting to external service as an external-client');
                    //    connect to external service as a client
                    connectAsNodeClient(service);
                }
            }


        });
    }

    function connectAsNodeClient(service) {
        var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        var nodeClientSocket = ioClient.connect(externalPath);

        nodeClientSocket.on('connect', function() {
            console.log('%% Connected as external-client %%');

            nodeClientSocket.on('request:SocketType', function(data) {
                console.log('%% (external-client listener): request:SocketType %%');
                console.log('...outside application asking for socket type');

                var socketData = {
                    name: glossaUser.name,
                    _id: glossaUser._id,
                    type: 'external-client',
                    socketId: data.socketId
                };

                //return socket type to outside application
                nodeClientSocket.emit('return:SocketType', socketData);
            });

            //When outside application disconnects this listener is triggered
            nodeClientSocket.on('notify:userDisconnected', function(data) {
                console.log('%% (client listener) notify:userDisconnected %%');
                // console.log('... outside application disconnected');

                nodeClientSocket.emit('update:userlist', data);
            });


            nodeClientSocket.on('disconnect', function() {
                // console.log('external-client disconnect listener');

                //disconnect socket.... this occurrs when the server this socket is connected to closes.
                nodeClientSocket.disconnect(true);

            });


            nodeClientSocket.on('external-clients:buttonPressed', function(data) {
                console.log('%% (client listener) external-clients:buttonPressed listener %%');
                emitToLocalClient('external-client:notify:buttonPressed', data);
            });


            nodeClientSocket.on('request:updates', function(data) {
                console.log('%% (client listener) request:updates %%');
                if (!data.lastSync) {
                    console.log('User has never connected');
                    getNotebookChanges({}).then(function(data) {

                        console.log('getNotebookChanges promise has resolved..... ');

                        nodeClientSocket.emit('return:data-changes', {connectionId: glossaUser._id, updatedData: data});
                    });
                } else {
                    console.log('User has connected before');
                    getNotebookChanges({"updatedAt": {$gte: new Date(data.lastSync)}}).then(function(data) {
                        nodeClientSocket.emit('return:data-changes', {connectionId: glossaUser._id, updatedData: data});
                    });
                }
            });

            //@dataChanges = {update: object, user: object}
            nodeClientSocket.on('external-ss:real-time-update:all', function(dataChanges) {
                console.log('%% (client listener) external-ss:real-time-update:all %%');

                var user = dataChanges.user;


                //check if we are following this user
                externalClients.forEach(function(client, index) {
                    if (client._id === user._id) {
                        if (client.following) {
                            //update the user object to get additional properties
                            user = client;
                        }
                    }
                });

                if (user.following) {
                    console.log('I am following user so request updates....');
                    emitToExternalClient(user.socketId, 'request:updates', user)
                }

            });

            nodeClientSocket.on('request-updates:external-client', function(data) {
                console.log('%% {Process: node-client } request-updates:external-client %%')
            })


        })
    }


    //data is an array. Nedb allows the insertion of arrays
    function addExternalData(data) {

        console.log('');
        console.log('addExternalData');
        console.log('');

        console.log("data.length", data.length);

        data.forEach(function(notebook) {
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
                    console.log('There was an error inserting external Notebooks');
                    reject(err);
                }
                console.log('External Notebooks added to local database');
                resolve(notebook);
            })

        })
    }


    // //Triggered when a client connects to this socket
    function connectExternalClient(socket, ioClient, glossaUser, externalClient) {
        console.log('...an external client connected');

        checkForPersistedData(externalClient);

        externalClient = checkForStateData(socket, externalClient);

        console.log('Updating local-client with STATE update');

        emitToLocalClient('local-client:send:externalUserList', externalClients);

        console.log('now that an external-client has connected... check if we are following user', externalClient);




        if(!externalClient.following) {
            console.log('We are not following user so do nothing')
        } else {
            console.log('We are following so request changes');

            emitToExternalClient(externalClient.socketId, 'request:updates', {lastSync: externalClient.lastSync});

        }
    }

    function checkForStateData(socket, externalClient) {
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
        var clientDataPersisted = {
            name: externalClient.name,
            _id: externalClient._id,
            type: 'external-client',
            following: false
        };
        // update or add user data in db.....
        //update the user's connection data then push the data to connected users array
        var connectionExists = false;
        glossaUser.connections.forEach(function(connection, index) {
            if (connection._id === externalClient._id) {
                connectionExists = true;


                console.log('...need to look for changes and update connection');

                // connection.name = externalClient.name;
            }
        });
        if (!connectionExists) {
            glossaUser.connections.push(clientDataPersisted)
        }
        updateUser(glossaUser);
    }

    function updateUser(update) {
        var options = {returnUpdatedDocs: true};

        return new Promise(function(resolve, reject) {
            User.update({_id: glossaUser._id}, update, options, function(err, updateCount, user) {
                if (err) {
                    reject(err);
                }
                console.log('Persisted User Data Success');
                glossaUser = user;
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
        console.log('mediaPath', mediaPath);

        var myPath = path.join(__dirname, config.dataRoot, mediaPath);
        console.log('myPath', myPath);
        return new Promise(function(resolve, reject){
            fs.readFile(myPath, function(err, data){
                if (err) {
                    console.log('there was an error encoding media...');
                    reject(err);
                }
                console.log('')

                resolve(data.toString('base64'));


                // socket.emit('imageConversionByClient', { image: true, buffer: data });
                // socket.emit('imageConversionByServer', "data:image/png;base64,"+ data.toString("base64"));
            });
        });


    }

    function doesConnectionExist(externalClient) {
        var exists = false;
        if (!glossaUser.connections) {
            glossaUser.connections = [];
            glossaUser.connections.push(externalClient);

        } else {
            glossaUser.connections.forEach(function(connection, index) {
                if (connection._id === externalClient._id) {
                    console.log('connection aready exists so we dont need to update the user....');

                    exists = true;

                    if (connection.isSharing) {
                        console.log('I am following this user.');

                        connection.socketId = externalClient.socketId;

                        getUpdatesSinceLastSync(connection);
                    } else {
                        console.log('I am NOT following this user')
                    }

                }
            });
        }

        if (!exists) {
            glossaUser.connections.push(externalClient);

            var options = { returnUpdatedDocs: true};
            User.update({_id: glossaUser._id}, glossaUser, options, function(err, updatedCount, updated) {
                if (err) {
                    return console.log('Error updating user connections', err);
                }

                glossaUser = updated;

                console.log('Updated user connection success', updated);

            })
        }
    }

    function getUpdatedFromClient(connection) {
        if (!connection.lastSync) {
            console.log('Never synced with client... get all data');
        } else {
            console.log('Get updates since last sync');
        }
    }



    function getMedia(mediaPath) {

    }

    // function getUpdatesSinceLastSync(connection) {
    //
    //     console.log('getting new data from client', connection._id);
    //
    //     if (!connection.lastSync) {
    //         console.log('never synced with this connection get all updates');
    //
    //         var newDate = Date.now();
    //
    //         connection.lastSync = new Date(newDate);
    //
    //         emitToExternalClient(connection.socketId, 'request:data-changes', {lastSync: null});
    //
    //         // io.to(connection.socketId).emit('request:data-changes', {lastSync: null});
    //
    //     //    set time stamp to now
    //     //    get all updates before now
    //     //    next time we connect
    //     //    get all updates up to now (which is last synce)
    //     } else {
    //         console.log('I have synced with this connection before so get recent changes...');
    //
    //         emitToExternalClient(connection.socketId, 'request:data-changes', {lastSync: connection.lastSync});
    //         // io.to(connection.socketId).emit('request:data-changes', {lastSync: connection.lastSync});
    //     }
    //
    //
    // }

    function addToUserConnections(newConnection) {

        return new Promise(function(resolve, reject) {

            User.findOne({_id: glossaUser._id}, function(err, user) {
                if (err) {
                    console.log('There was an error getting user data');
                    reject(err);
                }



                if (user.connections) {
                    var exists = false;
                    user.connections.forEach(function(connection, index) {
                        if (connection._id === newConnection._id) {
                            exists = true;
                            connection[index] = newConnection;
                        }
                    });
                    if (!exists) {
                        console.log('user.connections exists but is empty...');
                        user.connections.push(newConnection);
                    }
                } else if (!user.connections) {
                    console.log('user.connections is false...');
                    user.connections = [];
                    user.connections.push(newConnection);
                }






                var options = { returnUpdatedDocs: true};
                return User.update({_id: glossaUser._id}, user, options, function(err, updatedCount, updated) {
                    if (err) {
                        console.log('Error updating user connection');
                        reject(err);
                    }

                    glossaUser = updated;

                    User.persistence.stopAutocompaction();
                    console.log('Updated user connection success!');
                    resolve(updated);

                })
            })
        });
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


        // return new Promise(function(resolve, reject) {
        //
        //    return User.findOne(query)
        //         .projection({connections: 1})
        //         .exec(function(err, user) {
        //             if (err) {
        //                 console.log('There was an error looking for user connection');
        //                 reject(err);
        //             }
        //
        //             if (!user) {
        //                 console.log('this connection does not exist');
        //                 resolve(false);
        //             } else {
        //                 if (user.connections) {
        //                     user.connections.forEach(function(connection) {
        //                         if (connection.userid === userId) {
        //                             console.log('match', connection);
        //                             resolve(connection);
        //                         }
        //                     });
        //                 }
        //             }
        //
        //     })
        //
        //
        // });


    }


    function connectLocalClient(socket, ioClient, glossaUser) {

        console.log('connectLocalClient process');

        localClient = {
            socketId: socket.id,
            name: glossaUser.name,
            _id: glossaUser._id
        };

        emitToLocalClient('notify:server-connection', null);

        // io.to(localClient.socketId).emit('notify:server-connection');

        if (!browser || !browser.services.length) {

            myLocalService = bonjour.publish({
                name:'glossaApp-' + glossaUser._id,
                type: 'http',
                port: config.port,
                txt: {
                    userid: glossaUser._id
                }
            });

            console.log('Published my glossa App...')

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
        //look for http services on the network
        // initBonjour();
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

        updateUser(glossaUser);

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
