'use strict';

var User = require('./../api/user/user.model.js');
var Notebooks = require('./../api/notebook/notebook.model.js');
var path = require('path');
var fs = require('fs');
var config = require('./../config/environment/index');
module.exports = {

    getUser: function() {
        return new Promise(function(resolve, reject) {
            User.findOne({}, function(err, user) {
                if (err) {
                    console.log('There was an error finding the user', err);
                    reject(err);
                }
                console.log('user found success');
                resolve(user);
            })
        })
    },

    encodeBase64: function(mediaPath) {
        console.log('encoding into base64....');
        var myPath = path.join(config.root, '/server/data/', mediaPath);
        console.log('myPath', myPath);
        return new Promise(function(resolve, reject){
            fs.readFile(myPath, function(err, data){
                if (err) {
                    console.log('there was an error encoding media...');
                    reject(err);
                }
                console.log('read file:');
                resolve(data.toString('base64'));
            });
        });
    },

    writeMediaFile: function(data) {
        return new Promise(function(resolve, reject) {
            var mediaPath = path.join(config.root, '/server/data/', data.path);

            var buffer = new Buffer(data.buffer, 'base64', function(err) {
                if (err) {
                    console.log('issue decoding base64 data');
                    reject(err);
                }
                console.log('buffer created....');
            });

            fs.writeFile(mediaPath, buffer, function(err) {
                if (err) {
                    console.log('There was an error writing file to filesystem', err);
                    reject(err);
                }
                console.log('media file written to file system');
                resolve('success');
            })
        });



    },

    addExternalData: function(data) {

        console.log('');
        console.log('addExternalData');
        console.log("Amount of data we are adding: ", data.length);

        data.forEach(function(notebook, index) {
            //TODO: imagebuffer is not being deleted
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
    },

    requestingUpdates: function(client, callback) {
        console.log('');
        console.log('requestingUpdates');
        console.log('client', client);


        var query = {'createdBy._id': client._id};
        var notebookData = [];

        Notebooks.find(query, function(err, notebooks) {
            if (err) {
                console.log('error finding notebooks....', err);
                return callback("There was an error", null);
            }
            console.log('Notebooks found..', notebooks.length);
            notebooks.forEach(function(nb) {
                notebookData.push({_id: nb._id, updatedAt: nb.updatedAt})
            });

            return callback(null, notebookData);
        });
    },

    getPersistedData: function(externaClient) {
        var persistedConnection = null;
        return this.getUser().then(function(user) {
            user.connections.forEach(function(connection) {
                if (connection._id === externaClient._id) {
                    persistedConnection = connection;
                }
            });
            return persistedConnection;
        })
    },

    updateUser: function(update) {
        var options = {returnUpdatedDocs: true};
        return new Promise(function(resolve, reject) {
            User.update({_id: update._id}, update, options, function(err, updateCount, user) {
                if (err) {
                    console.log('There was an error updating the user', err);
                    reject(err);
                }
                console.log('Persisted User Data Success');
                resolve(user);
                User.persistence.stopAutocompaction();
            })
        })
    },

    //TODO: concat these function
    emitToLocalClient: function(io, socketId, eventName, data) {
        io.to(socketId).emit(eventName, data);
    },
    //emit to specific external client
     emitToExternalClient: function(io, socketId, eventName, data) {
        io.to(socketId).emit(eventName, data);
    },

    //event to all external socket connections
    broadcastToExternalClients: function(io, eventName, data) {
        io.to('externalClientsRoom').emit(eventName, data)
    }


};