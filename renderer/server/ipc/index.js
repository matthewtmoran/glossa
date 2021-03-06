const ipcUtil = require('./util');
// const socketUtil = require('../socket-backup/socket-util');
// const udp = require('../udp');
// const main = require('../../../main');
// const config = require('../config/environment');
// const socketClient = require('../socket/socket-client');

const User = require('./../api/user/user.model.js');

let isRefresh = false;
let win;
module.exports = {
  init: function (server, io) {
    ipcUtil.on('export:project', exportProject);

    //called on window load
    // ipcUtil.on('window:loaded', windowLoaded);
    // ipcUtil.on('broadcast:profile-updates', onBroadcastProfileUpdates);
    //called when sharing is toggled
    // ipcUtil.on('toggle:sharing', toggleSharing);
    //called when follow user is toggled
    // ipcUtil.on('update:following', onUpdateFollowing);
    // ipcUtil.on('broadcast:Updates', onBroadcastUpdates);
    // ipcUtil.on('combine:notebooks', onCombineNotebooks);
    // ipcUtil.on('update:session', onUpdateSession);
    // ipcUtil.on('update:hashtags', onUpdateHashtags);
    // ipcUtil.on('update:notebook-hashtags-transcriptions', onUpdateNnHtT);
    // ipcUtil.on('create:transcription', onCreateTranscription);
    // ipcUtil.on('remove:transcription', onRemoveTranscription);


    // ipcUtil.on('new:notebook', onNewNotebook);


    function exportProject(event, data) {
      //@@@Matt I was trying to fix export project
      //from main


      console.log('exportProject in server');
    }

    //when a new notebook is created ipc sends this event
    function onNewNotebook(event, data) {

      //deals with encoding the images and audio files
      parseNotebook(data.notebook)
        .then((notebook) => {

          io.to('all').emit('rt:updates', {user: data.user, notebook: notebook})

        });



      // io.to('externalClientsRoom').emit('new:notebook', data)
    }

    //encodes the files associated and attaches it to the object.
    function parseNotebook(notebook) {
      return new Promise((resolve, reject) => {
        let promises = [];

        //encode image
        if (notebook.image) {
          promises.push(
            socketUtil.encodeBase64(notebook.image.absolutePath)
              .then((imageString) => {
                notebook.imageBuffer = imageString;
              })
          )
        }

        //encode audio
        if (notebook.audio) {
          promises.push(
            socketUtil.encodeBase64(notebook.audio.absolutePath)
              .then((audioString) => {
                notebook.audioBuffer = audioString;
              })
          )
        }

        if (promises.length) {
          Promise.all(promises)
            .then((result) => {
              resolve(notebook);

            // io.to('externalClientsRoom').emit('rt:updates', updateObject)

          });
        } else {

          resolve(notebook);
          // console.log('broadcast:: rt:updates to:: externalClientsRoom');
          // io.to('externalClientsRoom').emit('rt:updates', updateObject)
        }


      })
    }

    function onUpdateNnHtT(event) {
      let promises = [];

      promises.push(

        socketUtil.findHashtags()
          .then((data) =>{
            global.appData.initialState.hashtags = data;
          })
          .catch((err) => {
            console.log('error with finding hashtags', err)
          }),

        socketUtil.findNotebooks()
          .then((data) =>{
            global.appData.initialState.notebooks = data;
          })
          .catch((err) => {
            console.log('error with finding notebooks', err)
          }),

        socketUtil.findTranscriptions()
          .then((data) =>{
            global.appData.initialState.transcriptions = data;
          })
          .catch((err) => {
            console.log('error with finding transcriptions', err)
          })
      );

      Promise.all(promises)
        .then((result) => {
          event.sender.send('update-notebook-hashtags-transcriptions-data');
        })
        .catch((err) => {
            console.log('Error:', err);
        })
    }

    function onUpdateHashtags(event) {
      socketUtil.findHashtags()
        .then((data) => {
          global.appData.initialState.hashtags = data;
          console.log('send:: update-hashtag-data');
          event.sender.send('update-hashtag-data');
        })
        .catch((err) => {
          cosnole.log('There was an error', err);
        })
    }

    //when the window is loaded we send an event so we know to start sharing events and ui updates accordingly
    // function windowLoaded() {
    //   win = main.getWindow();
    //   //if we are sharing
    //   if (global.appData.initialState.settings.isSharing) {
    //     console.log(' We are sharing');
    //     //if it's not merely a refresh
    //     if (!isRefresh) {
    //       isRefresh = true;
    //       //initial udp discovery
    //       // socketServer(io, win);
    //       config.localDev ? socketClient.initLocal(io, win) : udp.init(server, io, win);
    //     }
    //   }
    // }

    function onUpdateSession(event, session) {
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
          console.log("IPC send:: update-transcription-list to:: local-window");
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
          console.log('IPC send:: update-transcription-list to:: local-window');
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
     * TODO: This works locally, need to confirm cross platform
     */
    function onUpdateFollowing(event, data) {
      console.log('');
      console.log('IPC on:: update:following');
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
              socketUtil.syncData(connection, (data) => {
                console.log('emit:: sync-data to:: a client');
                io.to(connection.socketId).emit('sync-data', data)
              });

              if (connection.avatar) {
                //sends to connected socket client
                console.log('emit:: request:avatar; from:: ipc; to:: connection we clicked');
                io.to(connection.socketId).emit('request:avatar');
              }

            }
            connection = Object.assign({}, connection);
            return connection;
          }).filter((con) => {
            //only return connection that are online or that we are following
            return con.online || con.following;
          });
          console.log('IPC send:: update-connection-list to:: local-window');
          event.sender.send('update-connection-list')
        })
        .catch((err) => {
          //TODO: notify user of error....
          console.log('TODO: Notify user of error', err);
        });
    }

    //broadcast updates to all users when basic profile information changes
    //all clients will hear this event and act accordingly depending on if they are following this client or not
    function onBroadcastProfileUpdates() {
      console.log('');
      console.log('IPC on:: broadcast:profile-updates');

      User.findOne({}, (err, user) => {

        const basicProfileData = {
          _id: user._id,
          name:user.name,
          type: 'external-client',
          avatar: user.avatar
        };

        console.log("broadcast:: send-profile-updates to:: externalClientsRoom");
        io.to('all').emit('send-profile-updates', basicProfileData)
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
    function onBroadcastUpdates(event, notebook) {
      console.log('');
      console.log('IPC on:: broadcast:Updates');

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

          console.log('broadcast:: rt:updates to:: externalClientsRoom');
          io.to('all').emit('rt:updates', updateObject)

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
        io.to('all').emit('rt:updates', updateObject)
      }

      // //once image and audio has been encoded...


    }

    //data is boolean
    function toggleSharing(event, data) {
      console.log('');
      console.log('IPC on:: toggle:sharing');

      if (data.isSharing) {
        config.localDev ? socketClient.initLocal(io, win) : udp.init(server, io, win);
      } else {
        config.localDev ? console.log('Local dev') : udp.stop();
      }
    }


    function onCombineNotebooks(event, data) {
      console.log('');
      console.log('IPC on:: combine:notebooks');

      console.log('IPC send:: update-synced-notebooks to:: local-window');
      event.sender.send('update-synced-notebooks');
      console.log('IPC send:: update-rt-synced-notebooks to:: local-window');
      event.sender.send('update-rt-synced-notebooks', []);

    }
  }

};