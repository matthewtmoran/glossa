const ipcUtil = require('./util');
const socketUtil = require('../socket/socket-util');
const socketServer = require('../socket');
const udp = require('../udp');
const main = require('../../main');
let isRefresh = false;
let win;
module.exports = {
  init: function (server, io) {
    console.log('ipc.init');

    //get the main window object becuase we are certain it exists now


    //called on window load
    ipcUtil.on('window:loaded', windowLoaded);

    ipcUtil.on('broadcast:profile-updates', onBroadcastProfileUpdates);

    //called when sharing is toggled
    ipcUtil.on('toggle:sharing', toggleSharing);
    //called when follow user is toggled
    ipcUtil.on('update:following', onUpdateFollowing);

    ipcUtil.on('broadcast:Updates', onBroadcastUpdates);

    ipcUtil.on('combine:notebooks', onCombineNotebooks);

    ipcUtil.on('update:session', onUpdateSession);

    ipcUtil.on('create:transcription', onCreateTranscription);
    ipcUtil.on('remove:transcription', onRemoveTranscription);


    //when the window is loaded we send an event so we know to start sharing events and ui updates accordingly
    function windowLoaded() {
      console.log('windowLoaded');

      main.getWindow((err, window) => {
        if (err) {
          return console.log('error getting window...', err);
        }
        //initial udp discovery
        console.log('window', window);
        win = window;
      });


      //if we are sharing
      if (global.appData.initialState.settings.isSharing) {
        //if it's not merely a refresh
        if (!isRefresh) {
          isRefresh = true;
          //initial udp discovery
          socketServer(io, win);
          udp.init(server, io, win)
        }
      }
    }

    function onUpdateSession(event, session) {
      console.log("onUpdateSession");
      socketUtil.saveSession(session)
        .then((data) => {
          global.appData.initialState.session = Object.assign({}, data);
          event.sender.send('update-session-data');
        });
    }

    function onCreateTranscription(event, data) {
      socketUtil.createTranscription(data)
        .then((transcription) => {
          global.appData.initialState.transcriptions = [transcription, ...global.appData.initialState.transcriptions];
          event.sender.send('update-transcription-list', {selectedFileId: transcription._id});
        })
        .catch((err) => {
          return console.log(' Error : ', err);
        })
    }

    function onRemoveTranscription(event, data) {
      socketUtil.removeTranscription(data.transcriptionId)
        .then((numRemoved) => {
          global.appData.initialState.transcriptions = global.appData.initialState.transcriptions.filter(trans => trans._id !== data.transcriptionId);
          event.sender.send('update-transcription-list');
        })
        .catch((err) => {
          return console.log(' Error : ', err);
        })

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

    //data is boolean
    function toggleSharing(event, data) {
      console.log('');
      console.log('toggle:sharing ipc');

      if (data.isSharing) {
        udp.init(server, io, win)
      } else {
        udp.stop();
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
