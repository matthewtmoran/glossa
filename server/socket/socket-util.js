'use strict';
var _ = require('lodash');
var User = require('./../api/user/user.model.js');
var Notebooks = require('./../api/notebook/notebook.model.js');
var Connection = require('./../api/connections/connection.model');
var Session = require('./../api/session/session.model');
var Transcriptions = require('./../api/transcription/transcription.model');
var path = require('path');
var fs = require('fs');
var config = require('./../config/environment/index');
var app = require('electron').app;

var ipcUtil = require('../ipc/util');
module.exports = {

  getUser: function () {
    console.log('getUser in socket.util')
    return new Promise(function (resolve, reject) {
      User.findOne({}, function (err, user) {
        if (err) {
          console.log('There was an error finding the user', err);
          reject(err);
        }
        console.log('user found success');
        resolve(user);
      })
    })
  },

  encodeBase64(mediaPath) {
    return new Promise((resolve, reject) => {
      fs.readFile(mediaPath, (err, data) => {
        if (err) {
          console.log('there was an error encoding media...');
          reject(err);
        }
        resolve(data.toString('base64'));
      });
    });
  },



  //Queries the database for a clients data to send to client to compare against.
  getUserSyncedData: function (client) {
    return new Promise(function (resolve, reject) {
      var query = {'createdBy._id': client._id};
      var notebookData = [];

      Notebooks.find(query, function (err, notebooks) {
        if (err) {
          console.log('error finding notebooks....', err);
          reject(err);
        }
        console.log('Notebooks found..', notebooks.length);
        notebooks.forEach(function (nb) {
          notebookData.push({_id: nb._id, updatedAt: nb.updatedAt})
        });

        resolve(notebookData);
      });
    });
  },

  getConnections: getConnections,

  getConnection: function (clientId) {
    return new Promise(function (resolve, reject) {
      Connection.findOne({_id: clientId}, function (err, connection) {
        if (err) {
          console.log('There was an error finding connection');
          reject(err);
        }
        if (!connection) {
          console.log('connection does not exist');
          resolve({});
        }
        resolve(connection);
      })
    });
  },

  getConnectionBySocketId: function (socketId) {
    return new Promise(function (resolve, reject) {
      Connection.findOne({socketId: socketId}, function (err, connection) {
        if (err) {
          console.log('There was an error finding connection');
          reject(err);
        }
        if (!connection) {
          console.log('connection does not exist');
          resolve({});
        }
        resolve(connection);
      })
    });
  },


  removeConnection: function (client) {
    return new Promise(function (resolve, reject) {
      Connection.remove({_id: client._id}, client, function (err, removedCount) {
        if (err) {
          console.log('There eas an error removing connection');
          reject(err);
        }
        resolve('success');
      })
    })
  },

  //updates client in persisted data with the object we pass to it
  //normalizes notebooks
  updateConnection: function (client, io) {
    return new Promise(function (resolve, reject) {
      var options = {returnUpdatedDocs: true, upsert: true};
      Connection.update({_id: client._id}, client, options, function (err, updatedCount, updatedDoc) {
        if (err) {
          console.log('There eas an error updating connection');
          reject(err);
        }

        getLocalSocketId()
          .then(function (socketId) {

            getConnections()
              .then(function (connections) {
                // console.log('emit:: send:connections to:: local-client');

                console.log('send:: send:connections ipc');
                ipcUtil.send('send:connections', {connections: connections})
                // io.to(socketId).emit('send:connections', {connections: connections});
              });

            normalizeNotebooks(updatedDoc, io, socketId);
            resolve();
          });

        Connection.persistence.compactDatafile();
      })
    })
  },

  getPersistedData: function (externaClient) {
    var persistedConnection = null;
    return this.getUser().then(function (user) {
      user.connections.forEach(function (connection) {
        if (connection._id === externaClient._id) {
          persistedConnection = connection;
        }
      });
      return persistedConnection;
    })
  },

  //remove avatar from file system
  //TODO: refractor path
  removeAvatarImage: function (imagePath) {
    return new Promise(function (resolve, reject) {
      var myPath = path.join(config.root, '/server/data/', imagePath);

      fs.unlink(myPath, function (err) {
        if (err) {
          console.log('There was an error trying to remove avatar image.', err);
          reject(err);
        }
        resolve('Success')
      })
    })
  },

  //updates our own user object
  updateUser: function (update) {
    var options = {returnUpdatedDocs: true};
    return new Promise(function (resolve, reject) {
      User.findOne({_id: update._id}, function (err, user) {
        if (err) {
          console.log('There was an error updating the user', err);
          reject(err);
        }
        var options = {returnUpdatedDocs: true};
        var updated = _.merge(user, update);
        User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
          if (err) {
            console.log('There was an error updating the user', err);
            reject(err);
          }
          User.persistence.compactDatafile(); // concat db
          console.log('*TODO: emit event to local-client');
          resolve(updatedDoc);
        });
      });

      // User.update({_id: update._id}, update, options, function(err, updateCount, user) {
      //     if (err) {
      //         console.log('There was an error updating the user', err);
      //         reject(err);
      //     }
      //     console.log('Persisted User Data Success');
      //     User.persistence.compactDatafile();
      //     resolve(user);
      // })
    })
  },

  resetClientData: function () {
    console.log('');
    console.log('resetClientData called');
    return new Promise(function (resolve, reject) {
      var promises = [];

      promises.push(removeConnectionsOnClose());
      promises.push(updateConnectionsOnClose());

      Promise.all(promises).then(function () {
        resolve('closing cleaning data done');
      })
    })
  },

  //check whether document should be updated or inserted as new
  updateOrInsert: (array, io) => {
    return new Promise((resolve, reject) => {
      let options = {returnUpdatedDocs: true, upsert: true};
      array.map((update) => {
        let query = {_id: update._id};
        let manualTimeEntry = new Date(update.updatedAt);
        update.updatedAt = new Date(manualTimeEntry.getTime());
        Notebooks.update(query, update, options, (err, updateCount, updatedDoc) => {
          if (err) {
            console.log('Error inserting new notebooks', err);
            reject(err);
          }
          update = updatedDoc;
        });
      });

      getLocalSocketId()
        .then(function (socketId) {
          console.log('emit:: notify:externalChanges to:: local-client');
          io.to(socketId).emit('notify:externalChanges', {updatedData: array});
        });

      resolve(array);
    });
  },


  validateOnlineConnections: function () {
    console.log('validateOnlineConnections');
    Connection.find({}, function (err, connections) {
      console.log('TODO: set all connections.online to false or ping them.')
      console.log('connections length', connections.length);
    })
  },


  //TODO: concat these function
  emitToLocalClient: emitToLocalClient,

  //emit to specific external client
  emitToExternalClient: function (io, socketId, eventName, data) {
    io.to(socketId).emit(eventName, data);
  },

  //event to all external socket connections
  broadcastToExternalClients: function (io, eventName, data) {
    io.to('externalClientsRoom').emit(eventName, data)
  },

  emitToLocalClientWithQuery: function (io, eventName, data) {
    getLocalSocketId().then(function (socketId) {
      io.to(socketId).emit(eventName, data)
    })
  },
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////


  //called when new data comes from external clients
  syncDataReturn(data) {
    return new Promise((resolve, reject) => {
      //write the media buffers to the file system
      this.writeSyncedMedia(data.notebooks)
        .then((notebooks) => {
          //when that is complete, update the database
          this.updateOrInsertNotebooks(notebooks)
            .then((notebooks) => {
              resolve(notebooks);
            })
        })
    });

  },

  //helper function to update the global object works with any array....
  updateGlobalArrayObject(array, type) {
    array.forEach((item) => {
      let itemExists = false;
      //update the global object
      global.appData.initialState[type].forEach((nb, index) => {
        if (nb._id === item._id) {
          itemExists = true;
          //update the object
          global.appData.initialState[type][index] = Object.assign({}, item);
        }
      });

      if (!itemExists) {
        global.appData.initialState[type] = [item, ...global.appData.initialState[type]]
      }
    });
  },


  //toggle follow status
  updateFollow(data) {
    //we are just updating following status
    //we don't want the data that changes often
    if (data.socketId) {
      delete data.socketId;
    }
    if (data.hasOwnProperty('online')) {
      delete data.online;
    }

    console.log('data.avatar',data.avatar); //path is good at this point

    return new Promise((resolve, reject) => {
      Connection.findOne({_id: data._id}, (err, connection) => {
        if (err) {
          reject(err);
        }
        //if no user is found, we are begining to follow user
        if (!connection) {
          data.following = true;
          Connection.insert(data, (err, newConnection) => {
            resolve(newConnection);
            console.log('New connection after save in db', newConnection);
          })
        }
        //if user is found we are no longer following user
        if (connection) {
          Connection.remove({_id: data._id}, {}, (err, numRemoved) => {
              if (err) {
                reject(err);
              }
              data.following = false;
              resolve(data);
            }
          )
        }
      });

    })
  },

  //called when we follow someone or when someone we follow comes online
  //we get our data then send back
  syncData(client, callback) {
    //  search for notebooks we have from this client
    //  will return empty array if their are none
    this.findNotebooksByCreatedBy(client._id)
      .then((notebooks) => {
        callback({notebooks: notebooks});
      })

  },

  //helper functio nto write the media dat to the filesystem
  writeSyncedMedia(notebooks) {
    return new Promise((resolve, reject) => {
      let mediaPromises = [];
      //if there are updates...
      if (notebooks.length) {
        notebooks = notebooks.map((notebook) => {
          //if imageBuffer exists then write it to system
          if (notebook.imageBuffer) {
            //create an object  with the buffer and the path of the iamge
            let imageUpdateObject = {
              type: 'image',
              name: notebook.image.filename,
              absolutePath: path.join(app.getPath('userData'), 'image', notebook.image.filename),
              buffer: notebook.imageBuffer
            };
            //store promise of image file in array
            mediaPromises.push(
              this.writeMediaFile(imageUpdateObject)
            );
            //delete image buffer from object so we don't save it in the db
            delete notebook.imageBuffer;
            notebook.image.absolutePath = imageUpdateObject.absolutePath;
            notebook = Object.assign({}, notebook);
          }
          //if audioBuffer exist then write it to system
          if (notebook.audioBuffer) {
            let audioUpdateObject = {
              type: 'audio',
              name: notebook.audio.filename,
              absolutePath: path.join(app.getPath('userData'), 'audio', notebook.audio.filename),
              buffer: notebook.audioBuffer
            };

            mediaPromises.push(
              this.writeMediaFile(audioUpdateObject)
            );
            notebook.audio.absolutePath = audioUpdateObject.absolutePath;
            delete notebook.audioBuffer;
            notebook = Object.assign({}, notebook);
          }


          return notebook;
        });
        if (mediaPromises.length) {
          Promise.all(mediaPromises)
            .then((result) => {
              //once all media files have been written to the system successfully
              resolve(notebooks);
            });
        } else {
          resolve(notebooks);
        }
      } else {
        resolve(notebooks);
      }
    });
  },

  //does the actual writing of the media file
  writeMediaFile(data) {
    return new Promise((resolve, reject) => {

      let buffer = new Buffer(data.buffer, 'base64', (err) => {
        if (err) {
          console.log('issue decoding base64 data');
          reject(err);
        }
      });

      fs.writeFile(data.absolutePath, buffer, (err) => {
        if (err) {
          console.log('There was an error writing file to filesystem', err);
          reject(err);
        }
        resolve('success');
      })
    });
  },

  //adds or updates notebook to datbase
  updateOrInsertNotebooks(notebooks) {
    return new Promise((resolve, reject) => {
      let options = {returnUpdatedDocs: true, upsert: true};
      notebooks.forEach((notebook) => {

        let query = {_id: notebook._id};
        //becuase nedb auto time stamp does not work
        let manualTimeEntry = new Date(notebook.updatedAt);
        notebook.updatedAt = new Date(manualTimeEntry.getTime());
        Notebooks.update(query, notebook, options, (err, updateCount, updatedDoc) => {
          if (err) {
            console.log('Error inserting new notebooks', err);
            reject(err);
          }
        });

      });
      resolve(notebooks);
    });
  },

  //finds notebooks based on created by and projects limited data from them
  findNotebooksByCreatedBy(createdById) {
    return new Promise((resolve, reject) => {
      const query = {
        'createdBy._id': createdById
      };
      //_id is also projected
      const projection = {
        updatedAt: 1,
        createdAt: 1
      };
      Notebooks.find(query, projection, (err, notebooks) => {
        if (err) {
          reject(err);
        }
        resolve(notebooks);
      })
    })
  },


  //called by socket client with data passed from external server
  //@oldData = array
  getNewAndUpdatedNotebooks(oldData) {
    return new Promise((resolve, reject) => {

      let mediaPromises = [];
      let notebooksToSend = [];
      let allPotentialNotebooks = global.appData.initialState.notebooks.filter(notebook => notebook.createdBy._id === global.appData.initialState.user._id);


      if (oldData.length === 0) {

        notebooksToSend = allPotentialNotebooks.map((notebook) => {
          if (notebook.image) {
            mediaPromises.push(
              this.encodeBase64(notebook.image.absolutePath).then(imageBufferString => {
                notebook.imageBuffer = imageBufferString;
              })
            )
          }
          if (notebook.audio) {
            mediaPromises.push(
              this.encodeBase64(notebook.audio.absolutePath).then(audioBufferString => {
                notebook.audioBuffer = audioBufferString;
              })
            )
          }
          return notebook;
        });


      } else {
        //notebookdsToSend should only be new or updated notebooks
        notebooksToSend = allPotentialNotebooks.filter((notebook) => {

          let notebookExists = false;
          let notebookNeedsUpdate = false;


          //run through the data we have
          oldData.forEach((oldNotebook) => {
            //if we have the data set the exist flag to true
            if (oldNotebook._id === notebook._id) {
              notebookExists = true;
              //get the updatedAt data object for the existing notebook
              let externalUpdatedAtDateObject = new Date(oldNotebook.updatedAt);

              //check if notebook needs to be updated.
              //if the times are note equal
              if (notebook.updatedAt.getTime() !== externalUpdatedAtDateObject.getTime()) {
                //and if the time of the new notebook is greater than the oldData notebook match
                //we know there must be an update to this specific notebook;
                //TODO: maybe to a deep object comparison...
                if (notebook.updatedAt.getTime() > externalUpdatedAtDateObject.getTime()) {
                  notebookNeedsUpdate = true;
                }
              }
            }
          });

          //if the notebook does not exist or if the notebook needs to be updated
          //this means it's a new notebook or a notebook that has a newer updated time
          //we assume it needs to be updatd
          //we don't care what data has changed, we grab it all
          if (!notebookExists || notebookNeedsUpdate) {

            if (notebook.image) {
              mediaPromises.push(
                this.encodeBase64(notebook.image.absolutePath)
                  .then((imageString) => {
                    notebook.imageBuffer = imageString;
                  })
              );
            }
            if (notebook.audio) {
              mediaPromises.push(
                this.encodeBase64(notebook.audio.absolutePath)
                  .then((audioString) => {
                    notebook.audioBuffer = audioString;
                  })
              )
            }
            //only return notebook if it has update or is new.
            return notebook;
          }
        });
      }

      Promise.all(mediaPromises)
        .then(data => {
          resolve(notebooksToSend);
        })
    })
  },


  followedConnectionUpdate(client) {
    return new Promise((resolve, reject) => {

      const query = {
        _id: client._id
      };

      const update = {
        $set: {
          name: client.name,
          avatar: client.avatar
        }
      };

      const options = {
        returnUpdatedDocs: true
      };

      Connection.update(query, update, options, (err, updatedCount, updatedDoc) => {
        if (err) {
          console.log("there was an error", err);
          reject(err)
        }
        Connection.persistence.compactDatafile();
        resolve(updatedDoc)
      });
    });


  },


  normalizeNotebooks(client) {
    return new Promise(function (resolve, reject) {

      const query = {"createdBy._id": client._id};
      const options = {returnUpdatedDocs: true, multi: true};
      const update = {$set: {
        "createdBy.name": client.name,
        "createdBy.avatar": client.avatar
      }};

      Notebooks.update(query, update, options, function (err, updatedCount, updatedDocs) {
        if (err) {
          console.log('Error normalizing notebook data', err);
          reject(err);
        }

        // emitToLocalClient(io, socketId, 'normalize:notebooks', updatedDocs);
        Notebooks.persistence.compactDatafile();
        resolve(updatedDocs);
      });
    });


  },



  writeAvatar(data) {
    return new Promise((resolve, reject) => {
      let filename = data.path.replace(/^.*[\\\/]/, '');

      let mediaObject = {
        type: 'image',
        name: filename,
        buffer: data.bufferString,
        absolutePath: path.join(app.getPath('userData'), 'image', filename),
        path: path.join('image', filename),
      }; //path is good at this point


      this.writeMediaFile(mediaObject)
        .then(()=> {
          resolve('success')
        })
    });
  },

  saveSession(data) {
    return new Promise((resolve, reject) => {

      Session.findOne({}, (err, session) => {
        if (err) {
          console.log('error finding state');
          reject(err);
        }

        session.currentState = data.currentState;
        // session.currentState = data.currentStateParams;

        const options = {returnUpdatedDocs: true};
        Session.update({_id: session._id}, session, options, (err, updatedCount, updatedDoc) => {
          if (err) {
            console.log('error updating state');
            reject(err);
          }
          resolve(updatedDoc)
        })
      });

    })
  },

  createTranscription(data) {
    return new Promise((resolve, reject) => {
      Transcriptions.insert(data, (err, insertedDoc) => {
        if (err) {
          reject(err);
        }
        resolve(insertedDoc);
      })
    })
  },
  removeTranscription(transcriptionId) {
    return new Promise((resolve, reject) => {
      Transcriptions.remove({_id: transcriptionId}, {}, (err, removedCount) => {
        if (err) {
          reject(err);
        }
        resolve(removedCount);
      })
    })
  }



/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////


};

function getConnections() {
  return new Promise(function (resolve, reject) {
    Connection.find({}, function (err, connections) {
      if (err) {
        console.log('There was an error finding connections', err);
        reject(err);
      }
      resolve(connections);
    })
  })
}

function removeConnectionsOnClose() {
  return new Promise(function (resolve, reject) {
    var options = {multi: true};
    Connection.remove({following: false}, options, function (err, notFollowingUsers) {
      if (err) {
        console.log('Issue finding non-following users');
        reject(err);
      }
      resolve('success remove on close');
    });
  })
}

function updateConnectionsOnClose() {
  return new Promise(function (resolve, reject) {
    var update = {$set: {online: false, socketId: null}};
    Connection.update({following: true}, update, function (err, updatedCount) {
      if (err) {
        console.log('Issue finding non-following users');
        reject(err);
      }
      Connection.persistence.compactDatafile();
      resolve('success update on close');
    });
  })
}

function getLocalSocketId() {
  return new Promise(function (resolve, reject) {
    User.findOne({}, function (err, user) {
      if (err) {
        reject(err);
      }
      resolve(user.socketId);
    })
  });
}


function emitToLocalClient(io, socketId, eventName, data) {
  io.to(socketId).emit(eventName, data);
};



