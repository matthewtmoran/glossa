var ipcUtil = require('./util');
var socketUtil = require('../socket/socket-util');
var myBonjour = require('../bonjour/index');
let isRefresh = false;


module.exports = {
  init: function (server, bonjour, io, win) {
    ipcUtil.on('broadcast:profile-updates', onBroadcastProfileUpdates);

    //called on window load
    ipcUtil.on('window:loaded', windowLoaded);
    //called when sharing is toggled
    ipcUtil.on('toggle:sharing', toggleSharing);
    //called when follow user is toggled
    ipcUtil.on('update:following', onUpdateFollowing);

    ipcUtil.on('broadcast:Updates', onBroadcastUpdates);

    ipcUtil.on('combine:notebooks', onCombineNotebooks);




    function windowLoaded() {
      console.log('window:loaded ipc from local-client');
      if (global.appData.initialState.settings.isSharing) {
        if (!isRefresh) {
          isRefresh = true;
          myBonjour.init(server, bonjour, io, win);
        }
      }
    }


    /**
     * when user toggles follow on an external client
     * @param event
     * @param data
     * TODO: refractor
     */
    function onUpdateFollowing(event, data) {
      console.log('');
      console.log('on:: update:following ipc');
      let user = JSON.parse(data.user);
      //the returned object will not have socketId or online status
      socketUtil.updateFollow(user)
        .then((toggled) => {
          global.appData.initialState.connections = global.appData.initialState.connections.map((connection) => {
            if (connection._id !== toggled._id) {
              return connection;
            }
            console.log('the connection being toggled: ', connection);
            //update connection object with following status
            connection.following = toggled.following;

            if (connection.following) {
              socketUtil.syncData(connection, (data) => {
                console.log('emit:: sync-data to:: a client');
                io.to(connection.socketId).emit('sync-data', data)
              });

              if (connection.avatar) {
                console.log('There is an avatar?', connection.avatar);
                //sends to connected socket client
                io.to(connection.socketId).emit('request:avatar');
              }

            }
            connection = Object.assign({}, connection);
            return connection;
          }).filter((con) => {
            //only return connection that are online or that we are following
            return con.online || con.following;
          });

          event.sender.send('update-connection-list')
        })
        .catch((err) => {
          //TODO: notify user of error....
          console.log('TODO: Notify user of error')
        });
    }

    function onBroadcastProfileUpdates() {
      console.log('');
      console.log('broadcast:profile-updates ipc');



      const basicProfileData = {
        _id: global.appData.initialState.user._id,
        name: global.appData.initialState.user.name,
        type: 'external-client',
        avatar: global.appData.initialState.user.avatar
      };

      console.log('basicProfileData', basicProfileData);

      io.to('externalClientsRoom').emit('send-profile-updates', basicProfileData)



      //
      // console.log('');
      // console.log('on:: broadcast:profile-updates ipc');
      // console.log('TODO: update to include phone numbers');
      // console.log('TODO: update to include avatar');
      //
      // socketUtil.getUser()
      //   .then(function(user) {
      //     let limitedUser = {};
      //     limitedUser._id = user._id;
      //     limitedUser.name = user.name;
      //     limitedUser.socketId = user.socketId;
      //     socketUtil.broadcastToExternalClients(io, 'rt:profile-updates', limitedUser);
      //   });

    }


    /**
     *
     * Listen from local-client
     * should happen whenever new posts are made by local-client
     * encodes media to base64
     * Emit rt:updates to all external-clients (in room)
     * @param data
     */
    function onBroadcastUpdates(event, notebook) {
      console.log('');
      console.log('broadcast:Updates ipc');

      let mediaPromises = [];
      //encode image
      if (notebook.image) {
        mediaPromises.push(
          socketUtil.encodeBase64(notebook.image.absolutePath)
            .then(function (imageString) {
              notebook.imageBuffer = imageString;
            })
        )
      }
      //encode audio
      if (notebook.audio) {
        mediaPromises.push(
          socketUtil.encodeBase64(notebook.audio.absolutePath)
            .then(function (audioString) {
              notebook.audioBuffer = audioString;
            })
        )
      }

      if (mediaPromises.length) {
        Promise.all(mediaPromises).then((result) => {

          let updateObject = {
            user: {
              _id: global.appData.initialState.user._id,
              name: global.appData.initialState.user.name,
            }
          };

          updateObject.notebooks = [];
          updateObject.notebooks.push(notebook);

          io.to('externalClientsRoom').emit('rt:updates', updateObject)

          // global.appData.initialState.connections.forEach((connection) => {
          //   console.log('emit:: rt:updates');
          //   console.log('connection.socketId', connection.socketId);
          //   io.to(connection.socketId).emit('rt:updates', updateObject);
          // });


        });
      } else {
        let updateObject = {
          user: {
            _id: global.appData.initialState.user._id,
            name: global.appData.initialState.user.name,
          }
        };
        updateObject.notebooks = [];
        updateObject.notebooks.push(notebook);

        console.log('broadcast:: rt:updates to:: externalClientsRoom');
        io.to('externalClientsRoom').emit('rt:updates', updateObject)
      }

      // //once image and audio has been encoded...


    }

    //come from client
    //is ipc event
    //data is boolean
    function toggleSharing(event, data) {
      console.log('');
      console.log('toggle:sharing ipc');

      if (data.isSharing) {
        myBonjour.init(server, bonjour, io, win);
      } else {
        myBonjour.disconnect(bonjour);
      }

    }


    function onCombineNotebooks(event, data) {
      console.log('');
      console.log('combine:notebooks ipc');

      // global.appData.initialState.notebooks = [...global.appData.initialState.notebooks, ...global.appData.initialState.notebooks];


      event.sender.send('update-synced-notebooks');
      event.sender.send('update-rt-synced-notebooks', []);

    }
  }

};

// var ipcMain = electron.ipcMain;
//
// module.exports = function (server, bonjour, win) {
//
//
//   console.log('!!bonjour in ipc', !!bonjour);
//
//
//
//
//
//
//
//
//   //TODO: refractor....
//   /**
//    * removes avatar from file system
//    * deletes avatar data;
//    * normalizes notebooks
//    * @param client
//    */
//   function unfollowConnection(client) {
//     //if there is an avatar, remove avatar
//     if (client.avatar) {
//       socketUtil.removeAvatarImage(client.avatar)
//         .then(function () {
//           console.log('avatar removed from file system');
//           // client.avatar = null;
//           delete client.avatar;
//           socketUtil.updateConnection(client, io);
//         })
//         .catch(function (err) {
//           console.log('Error removing avatar from file system', err);
//           delete client.avatar;
//           socketUtil.updateConnection(client, io)
//         })
//     } else {
//       socketUtil.updateConnection(client, io)
//     }
//   }
//
//   /**
//    * called when user follows client
//    * get data we may already have for user
//    * emits to to external client request:updates with limited data objects
//    * emits to external client request:avatar
//    * updates client data
//    * @param client
//    */
//   function followConnection(client) {
//     socketUtil.getUserSyncedData(client)
//       .then(function (data) {
//         console.log('emit:: request:updates  to:: external-client');
//         socketUtil.emitToExternalClient(io, client.socketId, 'request:updates', data);
//         console.log('emit:: request:avatar  to:: external-client');
//         console.log('TODO: I dont believe this adequately updates avatar data.......');
//         socketUtil.emitToExternalClient(io, client.socketId, 'request:avatar', {});
//       });
//     console.log('TODO: consider if this overwrites data we need... or if it has the data we need...');
//     console.log('TODO: verify no avatar descrepencies here... Im assuming there are issues.');
//     socketUtil.updateConnection(client, io)
//   }
//
// };