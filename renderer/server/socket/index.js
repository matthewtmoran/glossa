const path = require('path');
const fs = require('fs');
const config = require('./../config/environment/index');
// const main = require('../../../main');
const {app, webContents} = require('electron').remote;

const User = require('./../api/user/user.model.js');
const Connection = require('./../api/connections/connection.model');

const notebookController = require('../api/notebook/notebook.controller')();
const userController = require('../api/user/user.controller');
const connectionController = require('../api/connections/connection.controller')();

let connectedClients = {};
let localClient = {};

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('on: connection');

    socket.emit('begin-handshake');
    socket.on('end-handshake', onEndHandshake);
    socket.on('disconnect', disconnect);
    socket.on('return:avatar', onReturnAvatar);
    socket.on('return:notebook-data', onReturnNotebookData);

    //occurs when profile updates are broad cast and connection responds with request for avatar
    socket.on('request:avatar', onRequestAvatar);

    function onRequestAvatar() {
      User.findOne({}, (err, user) => {
        if (!user.avatar || !user.avatar.absolutePath) {
          return;
        }
        userController.encodeAvatar(user.avatar.absolutePath)
          .then((bufferString) => {

            let avatarData = user.avatar;
            avatarData.bufferString = bufferString;
            avatarData.userId = user._id;

            console.log('--- emit:: return:avatar to:: server that is connected (that made request)');
            socket.emit('return:avatar', avatarData);
          })
          .catch((err) => {
            console.log('There was an error', err);
            console.log('TODO: handle error')
          })
      });
    }

    //handshake response from connected client
    function onEndHandshake(newOnlineUser) {
      //keep track of connections
      connectedClients[socket.id] = {};
      connectedClients[socket.id].disconnected = false;
      if (newOnlineUser.type === 'external-client') {

        //creates new connection or update existing
        connectionController.getNewOrExistingConnection(newOnlineUser)
          .then((connection) => {
            // TODO: consider adding additional room:
            // TODO: one for all users (for basic profile updates)
            // TODO: on for followed users(notbook updates)
            //join the socket room so we can broadcast updates
            // socket.join('externalClientsRoom');
            socket.join('all');
            io.to(localClient.socketId).emit('update:connection', connection);
            if (connection.following) {
              if (connection.avatar !== newOnlineUser.avatar) {
                console.log('TODO: need to get new avatar information');
              }

              // should we tell the user that we are following it?
              // that way they could add us to a list and send broadcasts to their list rather than all

              //get notebooks that we currently have from that user
              notebookController.getExistingNotebooks(connection)
                .then((notebookSummaries) => {
                  //send notebook summary to connection we are floowing
                  io.to(connection.socketId).emit('request:notebook-data', notebookSummaries)
                })
                .catch((err) => {
                  console.log('Error getting existing notebooks.', err)
                });
            }
            // io.to(localClient.socketId).emit('new:connection', connection)
          })
          .catch((reason) => {

          });

      } else if (newOnlineUser.type === 'local-client') {
        localClient = newOnlineUser;
        localClient.disconnect = false;
      } else {
        console.log('SOMEONE IS SNOOPING');
      }
    }

    //when a socket disconnects
    function disconnect(reason) {
      if (socket.id === localClient.socketId) {
        console.log('local-client disconnected... This is probably an issue');

        localClient.disconnect = true;

        setTimeout(() => {
          if (localClient.disconnect) {
            // webContents.fromId(2).send('close:window');
            console.log("localClient has truly disconnected");
            // process.exit();
          }
        }, 4000);

      } else {
      //  find connection by socket id that disconnected
      connectionController.findBySocketId(socket.id)
        .then((connection) => {
          //if we are not follwoing the connection remove it all
          if (!connection.following) {
            connectionController.removeConnection(socket.id)
              .then((msg) => {
                //tell client to remove connection
                io.to(localClient.socketId).emit('remove:connection', connection);
              })
              .catch((reason) => {
                console.log('There was an error removing connection', reason);
              });
          } else {
            //we are following connection so update the connection offline
            connection.online = false;
            connection.socketId = false;

            //update connection in persisted data
            connectionController.updateConnection(connection)
              .then((con) => {
                //tell client to update connection
                io.to(localClient.socketId).emit('update:connection', con || connection);
              })
              .catch((con) => {
                console.log('There was an error updating connection', reason);
              })
          }
        })
        .catch((reason) => {
          if (reason === 'no connection') {
            return console.log('no connection with that socket.id');
          }
        });
      }
    }

    //when a client returns avatar data after we have requested it
    function onReturnAvatar(avatarData) {
      console.log('');
      console.log('on:: return:avatar ');
      //writes the avatar data to the file system
      //the text data should already be updated by this point
      userController.writeAvatar(avatarData)
        .then((avatarDataNoBuffer) => {
          console.log('The avatar should be updated and written to FS successfully');
          main.getWindow().webContents.send('avatar-returned', avatarDataNoBuffer.userId);
        })
        .catch((err) => {
          console.log('there was an issue writing avatar image to fs', err)
        })
    }

    //when a client returns notebook data after we have requested it
    function onReturnNotebookData(data) {
      notebookController.newDataReturned(data.notebook)
        .then((notebook) => {
          console.log('IPC send:: update:synced-notebook');
          win.webContents.send('update:synced-notebook', notebook);
        })
        .catch((err) => {
          console.log('Error updating new data', err);
          console.log('IPC send:: sync-event-end to:: local-window');
          win.webContents.send('sync-event-end');
        });
    }
  });


  //compares old connection data with new data that has is from client
  function returnUpdateInfo(connection, client) {
    console.log('');
    console.log('returnUpdateInfo');
    return new Promise((resolve, reject) => {

      //update name if it is not the same
      if (connection.name !== client.name) {
        console.log('.. name change');
        connection.name = client.name;
      }
      //if client has avatar object exist and client avatar name exists as a field
      //and
      //connection.avatar does not exist or if the connection.avatar.name field does not exist
      if ((client.avatar && client.avatar.name) && (!connection.avatar || !connection.avatar.name)) {
        console.log('..avatar data changing');
        //request avatar, which will is async but modifies connection object with new avatar data
        connection = getNewAvatarData(connection, client);
        console.log('resolving connection');
        resolve(connection);
        //  if client.avatar does not exist or if client.avatar.name field does not exist
        //  and
        //  connection.avatar exists and connection.avatar.name field exists,
        //  remove the file and remove the avatar data on the connection object
      } else if ((!client.avatar || !client.avatar.name) && (connection.avatar && connection.avatar.name)) {
        console.log('..avatar data changing');
        //this means client is null but connection is not null
        //client has removed his avatar image
        console.log('TODO: get rid of the stored avatar data we hold');
        console.log('unlinking file');
        fs.unlink(connection.avatar.absolutePath, (err) => {
          if (err) {
            return console.log("There was an error trying to remove avatar file", err);
          }
        });
        console.log('removing avatar data');
        delete connection.avatar;
        console.log('resolving connection');
        resolve(connection);
        //  if client avatar exists and client avatar.name exists and connection.avatar exists and connection.avatar.name eixsts and client .avatar.name is not the same as connection.avatar.name
      } else if (client.avatar && client.avatar.name && connection.avatar && connection.avatar.name && client.avatar.name !== connection.avatar.name) {
        console.log('..avatar data changing');
        //this means client has changed his avatar image to a new avatar
        //remove the image attached to the connection object and get new data
        console.log('unlinking file');
        fs.unlink(connection.avatar.absolutePath);

        connection = getNewAvatarData(connection, client);
        console.log('resolving connection');
        resolve(connection);
      } else {
        resolve(connection);
      }
    })
  }

  //modifies object with new avatar data
  function getNewAvatarData(connection, client) {
    //  copy data object, resolve absolute paths, save data, request avatar, normalize notebooks
    console.log('emit:: request:avatar to:: server that sent us basic changes');
    io.to(client.socketId).emit('request:avatar');

    //resolve path
    //resolve absolutePath
    connection.avatar = client.avatar;
    connection.avatar.absolutePath = path.join(app.getPath('userData'), 'image', client.avatar.name);
    connection.avatar.path = path.normalize(client.avatar.path);
    connection.avatar = Object.assign({}, connection.avatar);
    return connection;
  }


};