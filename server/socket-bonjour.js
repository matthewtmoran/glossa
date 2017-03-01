var config = require('./config/environment');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
module.exports = function(glossaUser, localSession, io) {

    var socketArray = [];
    var externalSockets = [];
    var localClient = {};
    var externalClients = [];
    var isLocalClientConnected = false;
    var browser;




    // console.log('Bonjour browser', browser);


    io.sockets.on('connection', function(socket) {
        console.log('...new socket connection');


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

        //listener for the updated user list
        socket.on('update:userlist', function() {
            //emit to local client the updated user list
            socket.to(localClient.socketId).emit('local-client:send:externalUserList',externalClients);
        });


        //listener for userData request
        socket.on('request:userData', function(data) {
            console.log('%% request:userData listener %%');
            console.log('... user ' + data.name + ' is requesting data');
            socket.emit('return:userData', glossaUser);
        });

        socket.on('get:networkUsers', function(data) {
            console.log('%% get:networkUsers listener %%');
            socket.emit('local-client:send:externalUserList', externalClients)
        });

        socket.on('disconnect', function() {
            console.log('%% disconnect listener %%');
            console.log('socket.id', socket.id);


            externalClients = externalClients.filter(function(s) {
               return s.socketId != socket.id;
            });

            io.to(localClient.socketId).emit('local-client:send:externalUserList', externalClients);

        });

        socket.on('local-client:updates', function(data) {
            console.log('%% local-client:updates %%');

            console.log('...broadcast to all external clients that a user has made updates');

            io.broadcast.to('externalClientsRoom').emit('external-clients:updates', {updates: 'there were some updated made', userId: glossaUser._id});

        });

        socket.on('local-client:buttonTest', function(data) {
            console.log('%% local-client:buttonTest %%');

            console.log('...broadcast to all external clients that a user has pressed a button');

            io.sockets.in('externalClientsRoom').emit('external-clients:buttonPressed', {updates: 'there were some updated made', userId: glossaUser._id});

        });


        socket.on('external-client:getUpdates', function(data) {
            console.log('%% external-client:getUpdates %%');
            console.log('...external client is requesting updates');

            //query the db for updates since last time requesting user has synced with hosting user.

        });

        socket.on('notify:buttonPressed', function(data) {
            console.log('%% notify:buttonPressed %%');
            io.to(localClient.socketId).emit('local-client:send:buttonPressed', data);
        })

    });



    //Triggered when a client connects to this socket
    function connectExternalClient(socket, ioClient, glossaUser, externalClient) {
        console.log('...an external client connected');

        console.log('external-client data', externalClient);
        socket.instance = 'Server1';

        //check if this external client exists in the list of clients
        // if it does exist, update it.
        //if it does not exist add it.

        var exists = false;
        for (var j = 0; j < externalClients.length; j++) {
            if (externalClients[j].userid === externalClient.userid) {
                exists = true;
                externalClients[j] = externalClient;
            }
        }

        if (!exists) {

            var externalClientData = {
                userName: externalClient.userName,
                userid: externalClient.userid,
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


    function connectLocalClient(socket, ioClient, glossaUser) {

        localClient = {
            socketId: socket.id,
            userName: glossaUser.name,
            userId: glossaUser._id
        };

        console.log('...let local-client know server is connected');
        io.to(localClient.socketId).emit('notify:server-connection');
        console.log('... Now that a local socket is connected, we want to publish our bonjour service');

        // var onlineServices = browser.services;

        if (!browser || !browser.services || !browser.services.length) {
            console.log('no service published');

            bonjour.publish({
                name:'glossaApp-' + glossaUser._id,
                    type: 'http',
                    port: config.port,
                    txt: {
                        userid: glossaUser._id
                    }
            });
            console.log('service published...')

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
                bonjour.publish({
                    name:'glossaApp-' + glossaUser._id,
                    type: 'http',
                    port: config.port,
                    txt: {
                        userid: glossaUser._id
                    }
                });
            }
        }
        //look for http services on the network
        initBonjour();
    }

    function initBonjour() {
        console.log('...bonjour activated and listening');


        browser = bonjour.find({type: 'http'});

        browser.on('up', function(service) {

            console.log('...service is up', service.name);

            if (service.name === 'glossaApp-' + glossaUser._id) {
                console.log('...local service found IGNORE');
            } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                console.log('...connecting to external service as an external-client');
                //    connect to external service as a client
                var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
                var nodeClientSocket = ioClient.connect(externalPath);

                nodeClientSocket.on('connect', function() {
                    console.log('...connected to external socket server as a client');

                    nodeClientSocket.on('request:SocketType', function(data) {
                        console.log('%% request:SocketType %%');
                        console.log('...outside application asking for socket type');

                        var socketData = {
                            userName: glossaUser.name,
                            userid: glossaUser._id,
                            type: 'external-client',
                            socketId: data.socketId
                        };

                        //return socket type to outside application
                        nodeClientSocket.emit('return:SocketType', socketData);
                    });

                    //When outside application disconnects this listener is triggered
                    nodeClientSocket.on('notify:userDisconnected', function(data) {
                        console.log('%% notify:userDisconnected %%');

                        console.log('... outside application disconnected');

                        nodeClientSocket.emit('update:userlist', data);
                    });


                    nodeClientSocket.on('disconnect', function() {
                        console.log('client disconnect');
                        nodeClientSocket.disconnect(true);
                    });



                    nodeClientSocket.on('external-clients:buttonPressed', function(data) {
                        console.log('%% external-clients:buttonPressed %%');


                        io.to(localClient.socketId).emit('external-client:notify:buttonPressed', data);
                        // nodeClientSocket.emit('notify:buttonPressed', data);

                    })

                })
            }
        });
    }
};
