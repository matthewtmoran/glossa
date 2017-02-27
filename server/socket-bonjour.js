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

    function initBonjour() {
        console.log('...bonjour activated and listening');


        browser = bonjour.find({type: 'http'});

        browser.on('up', function(service) {

            console.log('...service is up', service.name);

            if (service.name === 'glossaApp-' + glossaUser._id) {
                console.log('...local service found');
            } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                console.log('...external service found');



                console.log('...connecting to that external service as an external-client');
                //    connect to external service as a client
                var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
                var externalSocket = ioClient.connect(externalPath);

                externalSocket.on('connect', function() {
                    console.log('connected as client to external socket server');

                    externalSocket.on('request:SocketType', function(data) {

                        console.log('...external server requesting socket type (which is external-client)')


                        var socketData = {
                            userName: glossaUser.name,
                            userid: glossaUser._id,
                            type: 'external-client',
                            socketId: data.socketId
                        };

                        externalSocket.emit('return:SocketType', socketData);
                    });

                    externalSocket.on('notify:userDisconnected', function(data) {
                        externalSocket.emit('update:userlist', data);
                    })

                })
            }
        });
    }


    // console.log('Bonjour browser', browser);


    io.sockets.on('connection', function(socket) {
        console.log('...new socket connection');


        socket.emit('request:SocketType', {socketId: socket.id});

        socket.on('update:userlist', function() {
            socket.to(localClient.socketId).emit('local-client:send:externalUserList',externalClients);
        });

        socket.on('return:SocketType', function(data) {
            console.log('...socket type returned:', data.type);

            if (data.type === 'local-client') {
                console.log('...local client connected');

                connectLocalClient(socketArray, socket, io, ioClient, glossaUser);


                // if (!socketArray.length) {
                //     socketArray.push({localClient:{socketId: socket.id, userName: glossaUser.name, userId: glossaUser._id}});
                // } else {
                //     for (var j = 0; j < socketArray.length; j++) {
                //         if (socketArray[j].localClient.socketId === socket.id) {
                //             socketArray[j] = {localClient:{socketId: socket.id, userName: glossaUser.name, userId: glossaUser._id}};
                //             break;
                //         }
                //     }
                // }

            } else if (data.type === 'external-client') {
                console.log('...an external client connected');

                console.log('external-client data', data);

                var exists = false;
                for (var j = 0; j < externalClients.length; j++) {
                    if (externalClients[j].userid === data.userid) {
                        exists = true;
                        externalClients[j] = data;
                    }
                }

                if (!exists) {
                    externalClients.push({
                        userName: data.userName,
                        userid: data.userid,
                        type: 'external-client',
                        socketId: data.socketId
                    })
                }

                io.to(localClient.socketId).emit('local-client:send:externalUserList', externalClients);

                console.log('...external client list updated', externalClients);

                console.log('...update local client with list of online users');
            }
        });


        socket.on('request:userData', function(data) {
            console.log('... user ' + data.name + ' is requesting data');
            socket.emit('return:userData', glossaUser);
        });

        socket.on('get:networkUsers', function(data) {
            socket.emit('local-client:send:externalUserList', externalClients)
        });

        socket.on('disconnect', function() {
            console.log("socket  -  disconnect");

            console.log('externalClients', externalClients);

            console.log('socket.id', socket.id);

            externalClients = externalClients.filter(function(s) {
               return s.socketId != socket.id;
            });

            console.log('externalClients',externalClients);

            // externalClients.forEach(function(s, index) {
            //     console.log('s', s);
            //     if (s.socketId === socket.id) {
            //         console.log('there is a match');
            //         console.log('externalClients',externalClients);
            //         externalClients.splice(index, 1);
            //         console.log('externalClients',externalClients);
            //     }
            // });


            io.to(localClient.socketId).emit('local-client:send:externalUserList', externalClients);
            // externalClients.forEach(function(s) {
            //     io.to(s.socketId).emit('notify:userDisconnected', externalClients);
            // })

        });
    });


    function connectLocalClient(socketArray, socket, io, ioClient, glossaUser) {



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
            initBonjour();
    }
};


function externalClientShit() {

}

function setLocaClientObject(socketArray, socket, io, ioClient, glossaUser) {
    console.log('...check if socket is in list already');

    var localClientObject = {
        socketId: socket.id,
        userName: glossaUser.name,
        userId: glossaUser._id
    };

    if (!socketArray.length) {
        console.log('......nothing is in the list');
        socketArray.push(localClientObject);
    } else {

    }
}

function addSocketTosocketList() {

}

function connectExternalClient(service, io) {

    var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
    var externalSocket = ioClient.connect(externalPath);

}

