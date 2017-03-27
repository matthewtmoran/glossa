var config = require('./../config/environment/index');
var bonjour = require('bonjour')();
var ioClient = require('socket.io-client');
var User = require('./../api/user/user.model.js');
var Notebooks = require('./../api/notebook/notebook.model.js');
var fs = require('fs');
var path = require('path');
var socketUtil = require('./socket-util');
var nodeClientSocket = '';


module.exports = {
    initNodeClient: function(service, me, io) {
        var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        nodeClientSocket = ioClient.connect(externalPath);

        nodeClientSocket.on('connect', function() {
            console.log('');
            console.log('server to server connection made');
            console.log('I am client', nodeClientSocket.id);
            console.log('my local socket instance:', me);
            console.log('');

            initNodeClientListeners(nodeClientSocket, me, io);

        })
    }
};

function initNodeClientListeners(socketClient, me, io) {

    socketClient.on('request:SocketType', function(data) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - request:SocketType Listener %%');

        console.log('External application requesting handshake');

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

            socketClient.emit('return:SocketType', socketData);
        });
    });

    //listen from external-server
    //Emit to external-server
    //When outside application disconnects this listener is triggered
    socketClient.on('notify:userDisconnected', function(data) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - notify:userDisconnected listener %%');
        // console.log('... outside application disconnected');

        console.log('%% EXTERNAL-CLIENT - update:userlist EMITTER %%');
        socketClient.emit('update:userlist', data);
    });

    socketClient.on('request:avatar', function() {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - request:avatar Listener %%');
        socketUtil.getUser().then(function(user) {
            socketUtil.encodeBase64(user.avatar).then(function(data) {
                var avatarString = data;
                socketClient.emit('return:avatar', {avatarString: avatarString, imagePath: user.avatar});
            });
        });
    });


    //Listen from external-server
    socketClient.on('disconnect', function() {
        console.log('');
        console.log('socketClient disconnect');

        // console.log('external-client disconnect listener');

        //disconnect socket.... this occurs when the server this socket is connected to closes.
        socketClient.disconnect(true);

    });

    //event comes from external-server
    //Emits back to external-server
    //data = has last sync attached to it....

    socketClient.on('request:updates', function(data) {
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

            socketClient.emit('return:updates', {updates: newNotebookEntries});
        });


    });

    // socketClient.on('request:updates', function(data) {
    //     console.log('');
    //     console.log('%% EXTERNAL-CLIENT - request:updates listener %%');
    //     if (!data.lastSync) {
    //
    //         socketUtil.getUser().then(function(user) {
    //             getNotebookChanges({'createdBy': user._id}).then(function(data) {
    //
    //                 console.log('getNotebookChanges promise has resolved..... ');
    //                 console.log('%% EXTERNAL-CLIENT return:data-changes EMITTER %%');
    //                 socket.emit('return:data-changes', {connectionId: user._id, updatedData: data});
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
    //                 socket.emit('return:data-changes', {
    //                     connectionId: glossaUser._id,
    //                     updatedData: results
    //                 });
    //             });
    //         });
    //     }
    // });

    //Listen from external-server
    //Emit to local-client
    socketClient.on('return:data-changes', function(dataChanges) {
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
                    socketUtil.emitToLocalClient(localClient.socketId, 'notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
                });
            });
        });
    });

    //@dataChanges = {update: object, user: object}
    //Listen from external-server
    //Emit to external-server (if following)
    socketClient.on('onlineUser:updatesMade', function(dataChanges) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - onlineUser:updatesMade listener %%');

        var externalUser = dataChanges.user;

        // //check if we are following this user
        socketUtil.getUser().then(function(user) {

            user.connections.forEach(function(connection) {
                if (connection._id === externalUser._id && connection.following) {
                    console.log('%% EXTERNAL-CLIENT - request:updates EMITTER %%');
                    console.log('');
                    console.log(' I am follwing user - store the updates sent....');

                    console.log('dataChanges', dataChanges);

                    Notebooks.insert(dataChanges.update, function(err, updatedDocs) {
                        if (err) {
                            return console.log('Error inserting external Updates', err);
                        }

                        console.log('Inserted notebook success');



                        socketUtil.emitToLocalClient(io, user.localSocketId, 'notify:externalChanges', {connection: connection, updatedData: updatedDocs});
                    });
                }
            });
        });

    });

    socketClient.on('request-updates:external-client', function(data) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - request-updates:external-client %%')
    })
}
