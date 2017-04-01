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

                var persistedData = {
                    name: user.name,
                    avatar: user.avatar,
                    _id: user._id
                };

                var avatarString = data;

                socketClient.emit('return:avatar', {avatarString: avatarString, imagePath: user.avatar, userData: persistedData});
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

    //data should be a list of notebook ids and updatedAt that the requesting user already has in his db
    //@data = {_id: String, updatedAt: Date}
    socketClient.on('request:updates', function(data) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - request:updates listener %%');
        //get me
        socketUtil.getUser().then(function(user) {
            return user._id;
        }).then(function(userId) {
            var newNotebookEntries = [];
            var mediaPromises = [];

            console.log('looking for the notebooks i created.... ');
            Notebooks.find({"createdBy._id": userId}, function (err, notebooks) {
                if (err) {
                    return console.log('There was an Error', err);
                }

                //if no data... get all notebooks
                if (!data) {
                    console.log('no data sent to compare against');
                    // notebooks.forEach(function (notebook) {
                    //     if (notebook.image) {
                    //         console.log('Notebook has image');
                    //         mediaPromises.push(
                    //             socketUtil.encodeBase64(notebook.image.path).then(function (imageString) {
                    //                 console.log('Encoded notebook image.');
                    //                 notebook.imageBuffer = imageString;
                    //             })
                    //         );
                    //     }
                    //     if (notebook.audio) {
                    //         mediaPromises.push(
                    //             socketUtil.encodeBase64(notebook.audio.path).then(function (audioString) {
                    //                 console.log('Encoded notebook audio.');
                    //                 notebook.audioBuffer = audioString;
                    //             })
                    //         )
                    //     }
                    //     newNotebookEntries.push(notebook);
                    // });
                } else {
                    console.log('some data sent to compare against: ', data.length);
                    //if there is data compare so we can get updates to notebooks...

                    notebooks.forEach(function(notebook) {
                        var exists = false;

                        data.forEach(function(d) {
                            if (d._id === notebook._id) {
                                console.log('This notebook entry already exists.');
                                exists = true;
                                if (notebook.updatedAt == d.updatedAt) {
                                    console.log('updatedAt is equal.... so we need to get updated notebook');
                                } else {
                                    console.log('typeof notebook.updatedAt', typeof notebook.updatedAt);
                                    console.log('typeof d.updatedAt', typeof d.updatedAt);
                                }
                            }
                        });

                        if (!exists) {
                            console.log('Notebook is new...');
                            if (notebook.image) {
                                console.log('Notebook has image');
                                mediaPromises.push(
                                    socketUtil.encodeBase64(notebook.image.path).then(function (imageString) {
                                        console.log('Encoded notebook image.');
                                        notebook.imageBuffer = imageString;
                                    })
                                );
                            }
                            if (notebook.audio) {
                                mediaPromises.push(
                                    socketUtil.encodeBase64(notebook.audio.path).then(function (audioString) {
                                        console.log('Encoded notebook audio.');
                                        notebook.audioBuffer = audioString;
                                    })
                                )
                            }
                            newNotebookEntries.push(notebook);
                        }
                    });
                }

                //these promises will be media promises
                Promise.all(mediaPromises).then(function (data) {
                    console.log('');
                    console.log('all media promises have resolved');
                    socketClient.emit('return:updates', {updates: newNotebookEntries});
                });
            });
        });
    });


    //Listen from external-server
    //Emit to local-client
    socketClient.on('return:data-changes', function(dataChanges) {
        socketUtil.addExternalData(dataChanges.updatedData).then(function(updatedDocs) {
            var updatedConnection;
            var timeStamp = Date.now();


            socketUtil.getConnection(dataChanges.connectionId).then(function(connection) {
                connection.lastSync = timeStamp;
                socketUtil.updateConnection(connection).then(function() {
                    socketUtil.emitToLocalClient(localClient.socketId, 'notify:externalChanges', {connection: updatedConnection, updatedData: updatedDocs});
                })

            });
        });
    });

    //@dataChanges = {update: object, user: object}
    //Listen from external-server
    //Emit to external-server (if following)
    socketClient.on('onlineUser:updatesMade', function(dataChanges) {

        console.log('%%  onlineUser:updatesMade  %%');

        var externalUser = dataChanges.user;

        socketUtil.getConnection(externalUser._id).then(function(connection) {
            if (connection.following) {

                var mediaPromises = [];
                if (dataChanges.update.imageBuffer) {
                    var imageMediaObject = {
                        path: dataChanges.update.image.path,
                        buffer: dataChanges.update.imageBuffer
                    };
                    mediaPromises.push(socketUtil.writeMediaFile(imageMediaObject));
                    // delete dataChanges.update.imageBuffer;
                }
                if (dataChanges.update.audioBuffer) {
                    var audioMediaObject = {
                        path: dataChanges.update.audio.path,
                        buffer: dataChanges.update.audioBuffer
                    };
                    mediaPromises.push(socketUtil.writeMediaFile(audioMediaObject));
                    // delete dataChanges.update.audioBuffer;
                }

                Promise.all(mediaPromises).then(function(result) {

                    Notebooks.insert(dataChanges.update, function(err, updatedDocs) {
                        if (err) {
                            return console.log('Error inserting external Updates');
                        }

                        console.log('Inserted notebook success');

                        socketUtil.getUser().then(function(user) {
                            socketUtil.emitToLocalClient(io, user.localSocketId, 'notify:externalChanges', {connection: connection, updatedData: updatedDocs});
                        })


                    });

                });
            }
        });
    });


    //data = {connection: {_id: String, name: String, avatar: String}
    socketClient.on('update:toConnectionData', function(data) {
        console.log('');
        console.log('%% EXTERNAL-CLIENT - update:toConnectionData %%');
        console.log('data', data);


        socketUtil.getConnection(data._id).then(function(connection) {
             connection.name = data.name;
             connection.avatar = data.avatar;

             socketUtil.updateConnection(connection).then(function(updatedConnection) {
                 socketUtil.getUser().then(function(user) {
                    socketUtil.emitToLocalClient(io, user.localSocketId, 'update:connectionInfo', {connection: updatedConnection})

                 })
             })
        });

    })
}
