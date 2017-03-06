var config = require('./config/environment');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
var User = require('./api/user/user.model');

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
            console.log('...socket type returned:', clientData.type);

            //if socket is a local client
            if (clientData.type === 'local-client') {
                console.log('...local client connected');

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
            //emit to local client the updated user list
            socket.to(localClient.socketId).emit('local-client:send:externalUserList',externalClients);
        });

        socket.on('notify:buttonPressed', function(data) {
            console.log('%% notify:buttonPressed %%');
            io.to(localClient.socketId).emit('local-client:send:buttonPressed', data);
        });



        //listener for userData request
        socket.on('request:userData', function(data) {
            console.log('%% request:userData listener %%');
            console.log('... user ' + data.name + ' is requesting data');
            socket.emit('return:userData', glossaUser);
        });


        ///////////////////////////////
        //listeners from local-client//
        ///////////////////////////////

        socket.on('get:networkUsers', function(data) {
            console.log('%% get:networkUsers listener %%');
            socket.emit('local-client:send:externalUserList', externalClients)
        });



            /////////////////////////////////
            //broadcast to external-clients//


        socket.on('local-client:buttonTest', function(data) {
            console.log('%% local-client:buttonTest %%');

            console.log('...broadcast to all external clients that a user has pressed a button');

            io.sockets.in('externalClientsRoom').emit('external-clients:buttonPressed', {updates: 'there were some updated made', userId: glossaUser._id});

        });


        socket.on('local-client:updates', function(data) {
            console.log('%% local-client:updates %%');

            console.log('...broadcast to all external clients that a user has made updates');

            io.broadcast.to('externalClientsRoom').emit('external-clients:updates', {updates: 'there were some updated made', userId: glossaUser._id});

        });










        socket.on('external-client:getUpdates', function(data) {
            console.log('%% external-client:getUpdates %%');
            console.log('...external client is requesting updates');

            //query the db for updates since last time requesting user has synced with hosting user.

        });



        socket.on('disconnect', function() {
            console.log('%% main socket process disconnect listener %%');

            //if the local-client disconnects....
            // if (localClient.socketId === socket.id) {
            //     //un-publish our service
            //     myLocalService.stop();
            // }
            externalClients = externalClients.filter(function(s) {
                console.log('updating external client list');
                return s.socketId != socket.id;
            });

            io.to(localClient.socketId).emit('local-client:send:externalUserList', externalClients);

        });
    });


    browser = bonjour.find({type: 'http'});

    browser.on('down', function(service) {
        console.log('service went down.......', service.name);
    });

    browser.on('up', function(service) {
        // console.log('***** browser listener... service is up *****');
        // console.log('Services on network:', browser.services.length);

        // browser.services.forEach(function(s) {
        //     console.log('Service Name:', s.name);
        // });

        //make sure network service is a glossa instance....
        if (service.name.indexOf('glossaApp') > -1) {
            console.log('A glossa Application is online');

            if (service.name === 'glossaApp-' + glossaUser._id) {
                console.log('...local service found IGNORE');
            } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                console.log('...connecting to external service as an external-client');
                //    connect to external service as a client
                var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
                var nodeClientSocket = ioClient.connect(externalPath);

                nodeClientSocket.on('connect', function() {

                    nodeClientSocket.on('request:SocketType', function(data) {
                        console.log('%% (client listener): request:SocketType %%');
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
                        // console.log('nodeClientSocket.id', nodeClientSocket.id);

                        io.to(localClient.socketId).emit('external-client:notify:buttonPressed', data);
                        // nodeClientSocket.emit('notify:buttonPressed', data);
                    })

                })
            }
        }


    });


    // //Triggered when a client connects to this socket
    function connectExternalClient(socket, ioClient, glossaUser, externalClient) {
        console.log('...an external client connected');
        console.log('externalClient', externalClient);

        doesConnectionExist(externalClient);

        var exists = false;
        for (var j = 0; j < externalClients.length; j++) {
            if (externalClients[j].userid === externalClient.userid) {
                exists = true;
                externalClients[j] = externalClient;
            }
        }

        if (!exists) {

            var externalClientData = {
                name: externalClient.name,
                _id: externalClient._id,
                type: 'external-client',
                socketId: externalClient.socketId
            };

            externalClients.push(externalClientData);
            socket.join('externalClientsRoom');

        }

        //emit ot the local client, the updated list of external clients
        io.to(localClient.socketId).emit('local-client:send:externalUserList', externalClients);

        console.log('...update local client with list of online users');
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

                console.log('Updated user connection success', updated);

            })
        }



    }

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

                    User.persistence.stopAutocompaction();
                    console.log('Updated user connection success!');
                    resolve(updated);

                })
            })
        });
    }

    function checkForUserConnection(userId) {
        console.log('checkForUserConnection');
        var query = {
            "connections.userid": userId
        };


        return new Promise(function(resolve, reject) {

           return User.findOne(query)
                .projection({connections: 1})
                .exec(function(err, user) {
                    if (err) {
                        console.log('There was an error looking for user connection');
                        reject(err);
                    }

                    if (!user) {
                        console.log('this connection does not exist');
                        resolve(false);
                    } else {
                        if (user.connections) {
                            user.connections.forEach(function(connection) {
                                if (connection.userid === userId) {
                                    console.log('match', connection);
                                    resolve(connection);
                                }
                            });
                        }
                    }

            })


        });


    }



    function connectLocalClient(socket, ioClient, glossaUser) {

        localClient = {
            socketId: socket.id,
            name: glossaUser.name,
            _id: glossaUser._id
        };

        io.to(localClient.socketId).emit('notify:server-connection');

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
    function updateUserConnection(changes) {
        console.log('glossaUser.connections', glossaUser.connections);
        changes = JSON.parse(changes);
        var options = { returnUpdatedDocs: true};
        // var exists = false;


        for (var i = 0; i < changes.length; i++) {
            var exists = false;
            var currentChange;
            for (var j = 0; j < glossaUser.connections.length; j++) {
                    currentChange = changes[i];
                if (changes[i]._id === glossaUser.connections[i]._id) {
                    console.log('update the existing connected user with changes');
                    exists = true;
                    glossaUser.connections[j] = changes[i];
                }
            }
            if (!exists) {
                console.log('add the connected user to connections list');
                glossaUser.connections.push(changes[i])
            }

        }

        console.log('glossaUser.connections', glossaUser.connections);

        User.update({_id: glossaUser._id}, glossaUser, options, function(err, numUpdated, updatedUser) {
            if (err) {
                return console.log('There was an error updating user connections', err);
            }
            console.log('User connections updated success');

            console.log('updatedUser.connections:', updatedUser.connections);
            User.persistence.stopAutocompaction();
        })
    }


    return bonjourSocketApi;
};
