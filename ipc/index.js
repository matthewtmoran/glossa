var ipcUtil = require('./util');

var socketUtil = require('../server/socket/socket-util');

var myBonjour = require('../server/bonjour');
let isRefresh = false;


module.exports = {
  init: function(server, bonjour, io, win) {
    ipcUtil.on('broadcast:profile-updates', onBroadcastProfileUpdates);
    ipcUtil.on('broadcast:Updates', onBroadcastUpdates);

    //called on window load
    ipcUtil.on('window:loaded', windowLoaded);
    //called when sharing is toggled
    ipcUtil.on('toggle:sharing', toggleSharing);
    //called when follow user is toggled
    ipcUtil.on('update:following', onUpdateFollowing);

    function windowLoaded() {
      console.log('window:loaded ipc from local-client');
      if (global.appData.initialState.settings.isSharing) {
        if (!isRefresh) {
          isRefresh = true;

          myBonjour.init(server, bonjour, io, win);
        }
      }
    }

    function onBroadcastProfileUpdates() {
      console.log('');
      console.log('broadcast:profile-updates ipc');


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
            //update connection object with following status
            connection.following = toggled.following;
            if (connection.following) {
              console.log('TODO: sync data');
              socketUtil.syncData(connection, (data) => {
                console.log('emit:: sync-data to:: a client');
                io.to(connection.socketId).emit('sync-data', data)
              });
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

    /**
     *
     * Listen from local-client
     * should happen whenever new posts are made by local-client
     * encodes media to base64
     * Emit rt:updates to all external-clients (in room)
     * @param data
     */
    function onBroadcastUpdates(data) {
      console.log('');
      console.log('broadcast:Updates ipc');
      // let mediaPromises = [];
      // //encode image
      // if (data.image) {
      //   mediaPromises.push(
      //     socketUtil.encodeBase64(data.image.path)
      //       .then(function (imageString) {
      //         data.imageBuffer = imageString;
      //       })
      //   )
      // }
      // //encode audio
      // if (data.audio) {
      //   mediaPromises.push(
      //     socketUtil.encodeBase64(data.audio.path)
      //       .then(function (audioString) {
      //         data.audioBuffer = audioString;
      //       })
      //   )
      // }
      //
      // //once image and audio has been encoded...
      // Promise.all(mediaPromises).then(function (result) {
      //
      //
      //   socketUtil.getUser()
      //     .then(function(user) {
      //       let updateObject = {
      //         update: data,
      //         user: {
      //           _id: user._id,
      //           name: user.name
      //         }
      //       };
      //
      //       //send to clients
      //       console.log('emit:: rt:updates to:: all external clients');
      //       socketUtil.broadcastToExternalClients(io, 'rt:updates', updateObject);
      //
      //     });
      //
      //
      // });
    }


    //come from client
    //is ipc event
    //data is boolean
    function toggleSharing(event, data) {
      console.log('');
      console.log('toggle:sharing ipc');

      if (data.isSharing) {
        myBonjour.init();
      } else {
        myBonjour.disconnect();
      }

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