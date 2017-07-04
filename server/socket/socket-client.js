// var ioClient = require('socket.io-client');
var socketUtil = require('./socket-util');
var Notebooks = require('./../api/notebook/notebook.model.js');
const main = require('../../main');

module.exports = {
  //this occurs when bonjour discovers an external server.
  //we are going to connect to the server as a client so the server can interact with us
  initAsClient: function (service, me, io) {

    console.log('');
    console.log('--- initAsClient called');

    let externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
    let nodeClientSocket = require('socket.io-client')(externalPath, {forceNew: true});


    //initial connection to another server
    //.once solve the problem however I'm not sure this will work with more than one connection
    //the other issue will be removing event listeners
    //TODO: !IMPORTANT - test for multiple connections

    // //initial connection to another server
    nodeClientSocket.once('connect', () => {
      console.log('');
      console.log('--- on:: connect');
      console.log('');
    });

    nodeClientSocket.on('disconnect', (reason) => {
      console.log('');
      console.log('--- on:: disconnect');
      console.log('');
      unbind();
    });

    //recievs event from an external server and emits the end-handshake
    nodeClientSocket.on('begin-handshake', () => {
      console.log('--- on:: begin-handshake');
      const basicProfileData = {
        _id: global.appData.initialState.user._id,
        name: global.appData.initialState.user.name,
        type: 'external-client',
        socketId: nodeClientSocket.id,
        avatar: global.appData.initialState.user.avatar
      };

      console.log('--- emit:: end-handshake');
      nodeClientSocket.emit('end-handshake', basicProfileData)
    });

    //a server is requesting data from a connected client
    //@data = {notebooks: Array}
    nodeClientSocket.on('sync-data', (data) => {
      console.log('--- on:: sync-data');

      //send sync notificatio to local window
      main.getWindow(function (err, window) {
        if (err) {
          return console.log('error getting window...', err);
        }
        console.log("send:: sync-event-start local-window");
        window.webContents.send('sync-event-start');
      });

      socketUtil.getNewAndUpdatedNotebooks(data.notebooks)
        .then(notebooksToSend => {
          console.log('--- emit:: sync-data:return to:: whoever requested it');
          nodeClientSocket.emit('sync-data:return', {notebooks: notebooksToSend});


          console.log('TODO: end outside client sync event display');
          main.getWindow((err, window) => {
            if (err) {
              return console.log('error getting window...');
            }
            window.webContents.send('sync-event-end');
          });
        })
    });

    nodeClientSocket.on('rt:updates', (data) => {
      console.log('on:: rt:updates');
      //send sync notification to user
      main.getWindow((err, window) => {
        if (err) {
          return console.log('error getting window...');
        }
        window.webContents.send('sync-event-start');
      });



      global.appData.initialState.connections.forEach((connection) => {
        //if the user matches and we are following the user...
        if (data.user._id === connection._id && connection.following) {

          socketUtil.syncDataReturn(data)
            .then((data) => {


              console.log('sync dat returned... ', data);

              //updating the global object here
              socketUtil.updateGlobalArrayObject(data, 'notebooks');


              main.getWindow((err, window) => {
                if (err) {
                  return console.log('error getting window...');
                }
                console.log('send:: update-rt-synced-notebooks');
                window.webContents.send('update-rt-synced-notebooks', data);
                console.log('send:: sync-event-end');
                window.webContents.send('sync-event-end');
              });


            })
        }
      });
    });


    //remvoes the event listener
    //TODO: !IMPORTANT - test for multiple connections
    //TODO: refractor to get all events dynamically
    function unbind() {
      console.log('unbind triggered...');
      nodeClientSocket.removeAllListeners("begin-handshake");
      nodeClientSocket.removeAllListeners("sync-data");
      nodeClientSocket.removeAllListeners("rt:updates");
      nodeClientSocket.removeAllListeners("connect");
      nodeClientSocket.removeAllListeners("disconnect");
    }

    ////////////////////
    //old socket events//
    ////////////////////

    /*
     “The mark of a mature programmer is willingness to throw out code you spent time on when you realize it’s pointless.” — Bram Cohen
     */


    //
    // //handshake
    // //this event is emitted from servers we are connected to.
    // //we send the servers our own data (return:socket-type)
    // //the servers will then update the list of clients that are connected to them
    // //the servers will then send that list to it's local-client
    // nodeClientSocket.on('request:socket-type', function () {
    //   console.log('--- on:: request:socket-type heard in server as a client');
    //
    //   var socketData = {
    //     name: global.appData.initialState.user.name,
    //     _id: global.appData.initialState.user._id,
    //     type: 'external-client',
    //     socketId: nodeClientSocket.id,
    //     avatar: global.appData.initialState.user.avatar
    //   };
    //
    //
    //   console.log('......This is where we send our data dn should show up in the other device...');
    //   console.log('--- emit:: return:socket-type');
    //   nodeClientSocket.emit('return:socket-type', socketData);
    //
    // });
    //
    //
    // //when user follows
    // //triggered from an external-client (which was triggered by it's local-client) when the user decides to follow the respective client
    // //this client the fetches it's avatar image to send to the server that requested the image
    // //once the server recieves the image, it updates the local-client data in the view
    // nodeClientSocket.on('request:avatar', function () {
    //   console.log('--- on:: request:avatar');
    //   socketUtil.getUser()
    //     .then(function (user) {
    //       socketUtil.encodeBase64(user.avatar)
    //         .then(function (data) {
    //
    //           var persistedData = {
    //             name: user.name,
    //             avatar: user.avatar,
    //             _id: user._id
    //           };
    //
    //           console.log('--- emit:: return:avatar');
    //           nodeClientSocket.emit('return:avatar', {
    //             avatarString: data,
    //             imagePath: user.avatar,
    //             userData: persistedData
    //           });
    //         });
    //     });
    // });
    //
    // //Triggered when an external-server broadcasts to external-clients
    // //^^beofre that, it is emitted from the local-client to the respective server.
    // //The server gets the event makes the changes locally then broadcasts to clients that are following
    // //((currently only used for avatar))
    // //the broadcast this event.
    // nodeClientSocket.on('rt:updates', function (dataChanges) {
    //   console.log('--- on:: rt:updates');
    //   console.log("--- emit:: notify:sync-begin to:: local-client");
    //
    //   socketUtil.emitToLocalClientWithQuery(io, 'notify:sync-begin', {});
    //
    //   var externalUser = dataChanges.user;
    //
    //   socketUtil.getConnection(externalUser._id)
    //     .then(function (connection) {
    //       if (connection.following) {
    //         var mediaPromises = [];
    //
    //         if (dataChanges.update.imageBuffer) {
    //
    //           var imageMediaObject = {
    //             path: dataChanges.update.image.path,
    //             buffer: dataChanges.update.imageBuffer
    //           };
    //
    //           mediaPromises.push(socketUtil.writeMediaFile(imageMediaObject));
    //           delete dataChanges.update.imageBuffer;
    //         }
    //
    //         if (dataChanges.update.audioBuffer) {
    //
    //           var audioMediaObject = {
    //             path: dataChanges.update.audio.path,
    //             buffer: dataChanges.update.audioBuffer
    //           };
    //
    //           mediaPromises.push(socketUtil.writeMediaFile(audioMediaObject));
    //           delete dataChanges.update.audioBuffer;
    //         }
    //
    //         Promise.all(mediaPromises)
    //           .then(function (result) {
    //
    //             var options = {returnUpdatedDocs: true, upsert: true};
    //             var query = {_id: dataChanges.update._id};
    //
    //             Notebooks.update(query, dataChanges.update, options, function (err, updatedCount, updatedDocs) {
    //               if (err) {
    //                 return console.log('Error inserting external Updates');
    //               }
    //
    //               console.log('--- emit:: notify:externalChanges to:: local-client');
    //               socketUtil.emitToLocalClientWithQuery(io, 'notify:externalChanges', {
    //                 connection: connection,
    //                 updatedData: updatedDocs
    //               });
    //
    //               console.log('--- emit:: notify:sync-end to:: local-client');
    //               socketUtil.emitToLocalClientWithQuery(io, 'notify:sync-end', {});
    //
    //               Notebooks.persistence.compactDatafile();
    //             });
    //
    //           });
    //       }
    //     });
    // });
    //
    // //when a server requests updates
    // //after we connect to a server and the handshake is complete
    // //the server will request up-to-date data from each client
    // //first the external server queries the data he already has from each client and sends that list to each respective client
    // //here we immediately notify our local-client that an external-client is syncing data (so we know not to quit or understand why cpu my be strained)
    // //we take the data that the external-server sent us and compare for changes and new data based on timestamps to send back to the external-server
    // //we end this saga by sending an event to the local-client ending the syncing status.
    // nodeClientSocket.on('request:updates', function (data) {
    //   console.log('--- on:: request:updates');
    //   console.log('--- emit:: notify:sync-begin to:: local-client');
    //   socketUtil.emitToLocalClient(io, me.localSocketId, 'notify:sync-begin');
    //
    //   //get me
    //   socketUtil.getUser()
    //     .then(function (user) {
    //       return user._id;
    //     })
    //     .then(function (userId) {
    //       var newNotebookEntries = [];
    //       var mediaPromises = [];
    //
    //       console.log('--- looking for the notebooks i created.... ');
    //       Notebooks.find({"createdBy._id": userId}, function (err, notebooks) {
    //         if (err) {
    //           return console.log('There was an Error', err);
    //         }
    //         //if no data... get all notebooks
    //         if (!data) {
    //           console.log('--- no data sent to compare against');
    //           console.log('--- TODO: need to get all notebooks');
    //           notebooks.forEach(function (notebook) {
    //             if (notebook.image) {
    //               console.log('Notebook has image');
    //               mediaPromises.push(
    //                 socketUtil.encodeBase64(notebook.image.path).then(function (imageString) {
    //                   console.log('Encoded notebook image.');
    //                   notebook.imageBuffer = imageString;
    //                 })
    //               );
    //             }
    //             if (notebook.audio) {
    //               mediaPromises.push(
    //                 socketUtil.encodeBase64(notebook.audio.path).then(function (audioString) {
    //                   console.log('Encoded notebook audio.');
    //                   notebook.audioBuffer = audioString;
    //                 })
    //               )
    //             }
    //             newNotebookEntries.push(notebook);
    //           });
    //         } else {
    //           console.log('--- some data sent to compare against: ', data.length);
    //           //if there is data compare so we can get updates to notebooks...
    //
    //           notebooks.forEach(function (notebook) {
    //             var exists = false;
    //             var updates = false;
    //
    //             data.forEach(function (d) {
    //               if (d._id === notebook._id) {
    //
    //                 exists = true;
    //                 var externalUpdatedAtDateObject = new Date(d.updatedAt);
    //
    //                 //TODO: when manual timestamp is implemented - change this to be more simple
    //                 if (notebook.updatedAt.getTime() !== externalUpdatedAtDateObject.getTime()) {
    //                   if (notebook.updatedAt.getTime() > externalUpdatedAtDateObject.getTime()) {
    //                     updates = true;
    //                   }
    //                 }
    //               }
    //             });
    //
    //             if (!exists || updates) {
    //               if (notebook.image) {
    //                 mediaPromises.push(
    //                   socketUtil.encodeBase64(notebook.image.path)
    //                     .then(function (imageString) {
    //                       notebook.imageBuffer = imageString;
    //                     })
    //                 );
    //               }
    //               if (notebook.audio) {
    //                 mediaPromises.push(
    //                   socketUtil.encodeBase64(notebook.audio.path)
    //                     .then(function (audioString) {
    //                       notebook.audioBuffer = audioString;
    //                     })
    //                 )
    //               }
    //               newNotebookEntries.push(notebook);
    //             }
    //           });
    //         }
    //
    //         //these promises will be media promises
    //         Promise.all(mediaPromises)
    //           .then(function (data) {
    //             console.log('--- emit:: return:updates to:: external-client');
    //             nodeClientSocket.emit('return:updates', {updates: newNotebookEntries});
    //             console.log('--- emit:: notify:sync-end to:: local-client');
    //             socketUtil.emitToLocalClientWithQuery(io, 'notify:sync-end', {});
    //           });
    //       });
    //     });
    // });
    //
    // //when user updates profile data
    // //a server emits event with updated data
    // //we recieve the data and update the data we have stored and normalize notebooks
    // nodeClientSocket.on('rt:profile-updates', function (data) {
    //   console.log('---on:: rt:profile-updates');
    //   //update user in connections db
    //   //normalize notebooks
    //
    //   socketUtil.getConnection(data._id)
    //     .then(function (connection) {
    //       if (connection.name !== data.name) {
    //         connection.name = data.name;
    //       }
    //       socketUtil.updateConnection(connection, io);
    //     })
    //
    // })
  }
};