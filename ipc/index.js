var ipcUtil = require('./util');

var socketUtil = require('../server/socket/socket-util');

var User = require('../server/api/user/user.model');

module.exports = function() {

  ipcUtil.on('test:event', (event, data) => {
    console.log('');
    console.log('ipc event: test:event');
  });

  ipcUtil.on('window:loaded', (event, data) => {
    console.log('');
    console.log('ipc event: window:loaded');
    console.log('data', data);
    ipcUtil.initBrowserWindow( () => {
      event.sender.send('application:data', {test: 'test app data'});
    });
  });

  ipcUtil.on('get:user', (event, data) => {
    console.log('');
    console.log('ipc event: get:user');
    socketUtil.getUser()
      .then((user) => {
      console.log('!!user', !!user);
        event.sender.send('return:user', user);
      })
  });


  ipcUtil.on('broadcast:profile-updates', onBroadcastProfileUpdates);
  ipcUtil.on('update:following', onUpdateFollowing);
  ipcUtil.on('broadcast:Updates', onBroadcastUpdates);


  function onBroadcastProfileUpdates() {
    console.log('');
    console.log('on:: broadcast:profile-updates ipc');
    console.log('TODO: update to include phone numbers');
    console.log('TODO: update to include avatar');

    socketUtil.getUser()
      .then(function(user) {
        let limitedUser = {};
        limitedUser._id = user._id;
        limitedUser.name = user.name;
        limitedUser.socketId = user.socketId;
        socketUtil.broadcastToExternalClients(io, 'rt:profile-updates', limitedUser);
      });

  }

  /**
   * when user toggles follow on an external client
   * @param data
   * TODO: refractor
   */
  function onUpdateFollowing(data) {
    console.log('');
    console.log('on:: update:following ipc');
    console.log('data', data);
    let client = JSON.parse(data.connection);
    //qeury client
    socketUtil.getConnection(client._id)
      .then(function (clientPersistedData) {
        //toggle follow
        clientPersistedData.following = !client.following;
        if (!clientPersistedData.following) {
          console.log('we are NOT following connection');
          //if we are no longer following client
          unfollowConnection(clientPersistedData)
        } else {
          console.log('we are following connection');
          //if we are following client
          followConnection(clientPersistedData);
        }
      })
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
    console.log('on:: broadcast:Updates');
    let mediaPromises = [];
    //encode image
    if (data.image) {
      mediaPromises.push(
        socketUtil.encodeBase64(data.image.path)
          .then(function (imageString) {
            data.imageBuffer = imageString;
          })
      )
    }
    //encode audio
    if (data.audio) {
      mediaPromises.push(
        socketUtil.encodeBase64(data.audio.path)
          .then(function (audioString) {
            data.audioBuffer = audioString;
          })
      )
    }

    //once image and audio has been encoded...
    Promise.all(mediaPromises).then(function (result) {


      socketUtil.getUser()
        .then(function(user) {
          let updateObject = {
            update: data,
            user: {
              _id: user._id,
              name: user.name
            }
          };

          //send to clients
          console.log('emit:: rt:updates to:: all external clients');
          socketUtil.broadcastToExternalClients(io, 'rt:updates', updateObject);

        });


    });
  }











  //TODO: refractor....
  /**
   * removes avatar from file system
   * deletes avatar data;
   * normalizes notebooks
   * @param client
   */
  function unfollowConnection(client) {
    //if there is an avatar, remove avatar
    if (client.avatar) {
      socketUtil.removeAvatarImage(client.avatar)
        .then(function () {
          console.log('avatar removed from file system');
          // client.avatar = null;
          delete client.avatar;
          socketUtil.updateConnection(client, io);
        })
        .catch(function(err) {
          console.log('Error removing avatar from file system', err);
          delete client.avatar;
          socketUtil.updateConnection(client, io)
        })
    } else {
      socketUtil.updateConnection(client, io)
    }
  }

  /**
   * called when user follows client
   * get data we may already have for user
   * emits to to external client request:updates with limited data objects
   * emits to external client request:avatar
   * updates client data
   * @param client
   */
  function followConnection(client) {
    socketUtil.getUserSyncedData(client)
      .then(function (data) {
        console.log('emit:: request:updates  to:: external-client');
        socketUtil.emitToExternalClient(io, client.socketId, 'request:updates', data);
        console.log('emit:: request:avatar  to:: external-client');
        console.log('TODO: I dont believe this adequately updates avatar data.......');
        socketUtil.emitToExternalClient(io, client.socketId, 'request:avatar', {});
      });
    console.log('TODO: consider if this overwrites data we need... or if it has the data we need...');
    console.log('TODO: verify no avatar descrepencies here... Im assuming there are issues.');
    socketUtil.updateConnection(client, io)
  }

};