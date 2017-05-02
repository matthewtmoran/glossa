var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var Notebooks = require('./../api/notebook/notebook.model.js');
var nodeClientSocket = '';

module.exports = {
  initAsClient: function(service, me, io) {

    console.log('--- initAsClient called');

    var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
    nodeClientSocket = ioClient.connect(externalPath);

    //initial connection to another server
    nodeClientSocket.on('connect', function() {
      console.log('--- on:: connected to a external server as a client');
    });

    //handshake
    nodeClientSocket.on('request:socket-type', function() {
      console.log('--- on:: request:socket-type heard in server as a client');

      var socketData = {
        name: me.name,
        _id: me._id,
        type:'external-client',
        socketId: nodeClientSocket.id,
        avatar: me.avatar
      };

      console.log('--- emit:: return:socket-type');
      nodeClientSocket.emit('return:socket-type', socketData);
    });

    //when user follows
    nodeClientSocket.on('request:avatar', function() {
      console.log('--- on:: request:avatar');
      socketUtil.getUser()
        .then(function(user) {
          socketUtil.encodeBase64(user.avatar)
            .then(function(data) {

              var persistedData = {
                name: user.name,
                avatar: user.avatar,
                _id: user._id
              };

              console.log('--- emit:: return:avatar');
              nodeClientSocket.emit('return:avatar', {avatarString: data, imagePath: user.avatar, userData: persistedData});
            });
        });
    });

    nodeClientSocket.on('rt:updates', function(dataChanges) {
      console.log('--- on:: rt:updates');
      console.log("--- emit:: notify:sync-begin to:: local-client");

      socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:sync-begin');

      var externalUser = dataChanges.user;

      socketUtil.getConnection(externalUser._id)
        .then(function(connection) {
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

            Promise.all(mediaPromises)
              .then(function(result) {

                var options = {returnUpdatedDocs: true, upsert: true};
                var query = {_id: dataChanges.update._id};

                Notebooks.update(query, dataChanges.update, options, function(err, updatedCount, updatedDocs) {
                  if (err) {
                    return console.log('Error inserting external Updates');
                  }
                  console.log('--- Inserted notebook success');
                  Notebooks.persistence.compactDatafile();
                  //TODO: do i need to query user here?
                  socketUtil.getUser()
                    .then(function(user) {
                      console.log('--- emit:: notify:externalChanges to:: local-client');
                      socketUtil.emitToLocalClient(io, user.localSocketId, 'notify:externalChanges', {connection: connection, updatedData: updatedDocs});
                      console.log('--- emit:: notify:sync-end to:: local-client');
                      socketUtil.emitToLocalClient(io, user.localSocketId, 'notify:sync-end');
                    });


                });

            });
          }
      });
    });

    nodeClientSocket.on('request:updates', function(data) {
      console.log('--- on:: request:updates');
      console.log('--- emit:: notify:sync-begin to:: local-client');
      socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:sync-begin');

      //get me
      socketUtil.getUser()
        .then(function(user) {
          return user._id;
        })
        .then(function(userId) {
          var newNotebookEntries = [];
          var mediaPromises = [];

          console.log('--- looking for the notebooks i created.... ');
          Notebooks.find({"createdBy._id": userId}, function (err, notebooks) {
            if (err) {
              return console.log('There was an Error', err);
            }
            //if no data... get all notebooks
            if (!data) {
              console.log('--- no data sent to compare against');
              console.log('--- TODO: need to get all notebooks');
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
              console.log('--- some data sent to compare against: ', data.length);
              //if there is data compare so we can get updates to notebooks...

              notebooks.forEach(function(notebook) {
                var exists = false;
                var updates = false;

                data.forEach(function(d) {
                  if (d._id === notebook._id) {

                    exists = true;
                    var externalUpdatedAtDateObject = new Date(d.updatedAt);

                    //TODO: when manual timestamp is implemented - change this to be more simple
                    if (notebook.updatedAt.getTime() !== externalUpdatedAtDateObject.getTime()) {
                      if (notebook.updatedAt.getTime() > externalUpdatedAtDateObject.getTime()) {
                        updates = true;
                      }
                    }
                  }
                });

                if (!exists || updates) {
                  if (notebook.image) {
                    mediaPromises.push(
                      socketUtil.encodeBase64(notebook.image.path)
                        .then(function (imageString) {
                          notebook.imageBuffer = imageString;
                        })
                      );
                  }
                  if (notebook.audio) {
                    mediaPromises.push(
                      socketUtil.encodeBase64(notebook.audio.path)
                        .then(function (audioString) {
                          notebook.audioBuffer = audioString;
                        })
                    )
                  }
                  newNotebookEntries.push(notebook);
                }
              });
            }

            //these promises will be media promises
            Promise.all(mediaPromises)
              .then(function (data) {
                console.log('--- emit:: return:updates to:: external-client');
                nodeClientSocket.emit('return:updates', {updates: newNotebookEntries});
                console.log('--- emit:: notify:sync-end to:: local-client');
                socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:sync-end');
              });
          });
      });
    });

  }
};