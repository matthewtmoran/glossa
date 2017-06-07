// var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var Notebooks = require('./../api/notebook/notebook.model.js');
var nodeClientSocket = '';

module.exports = {
  //this occurs when bonjour discovers an external server.
  //we are going to connect to the server as a client so the server can interact with us
  initAsClient: function(service, me, io) {

    console.log('--- initAsClient called');

    var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
    nodeClientSocket = require('socket.io-client')(externalPath);

    console.log('nodeClientSocket', nodeClientSocket);

    //initial connection to another server
    nodeClientSocket.on('connect', function() {
      console.log('--- on:: connected to a external server as a client');
    });

    //handshake
    //this event is emitted from servers we are connected to.
    //we send the servers our own data (return:socket-type)
    //the servers will then update the list of clients that are connected to them
    //the servers will then send that list to it's local-client
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
      console.log('......This is where we send our data dn should show up in the other device...');
      nodeClientSocket.emit('return:socket-type', socketData);
    });



    //when user follows
    //triggered from an external-client (which was triggered by it's local-client) when the user decides to follow the respective client
    //this client the fetches it's avatar image to send to the server that requested the image
    //once the server recieves the image, it updates the local-client data in the view
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

    //Triggered when an external-server broadcasts to external-clients
    //^^beofre that, it is emitted from the local-client to the respective server.
    //The server gets the event makes the changes locally then broadcasts to clients that are following
    //((currently only used for avatar))
    //the broadcast this event.
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
              delete dataChanges.update.imageBuffer;
            }

            if (dataChanges.update.audioBuffer) {

              var audioMediaObject = {
                path: dataChanges.update.audio.path,
                buffer: dataChanges.update.audioBuffer
              };

              mediaPromises.push(socketUtil.writeMediaFile(audioMediaObject));
              delete dataChanges.update.audioBuffer;
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
                      socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:externalChanges', {connection: connection, updatedData: updatedDocs});
                      console.log('--- emit:: notify:sync-end to:: local-client');
                      socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:sync-end');
                    });


                });

            });
          }
      });
    });

    //when a server requests updates
    //after we connect to a server and the handshake is complete
    //the server will request up-to-date data from each client
    //first the external server queries the data he already has from each client and sends that list to each respective client
    //here we immediately notify our local-client that an external-client is syncing data (so we know not to quit or understand why cpu my be strained)
    //we take the data that the external-server sent us and compare for changes and new data based on timestamps to send back to the external-server
    //we end this saga by sending an event to the local-client ending the syncing status.
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

    //when user updates profile data
    //a server emits event with updated data
    //we recieve the data and update the data we have stored and normalize notebooks
    nodeClientSocket.on('rt:profile-updates', function(data) {
      console.log('---on:: rt:profile-updates');
      console.log('data: ', data);
      //update user in connections db
      //normalize notebooks

      socketUtil.getConnection(data._id)
        .then(function(connection) {
          if (connection.name !== data.name) {
            connection.name = data.name;
          }
          socketUtil.updateConnection(connection, io, me.socketId)
          // socketUtil.getUser()
          //   .then(function(user) {
          //   });
        })

    })
  }
};