const path = require('path');
const fs = require('fs');
const config = require('./../config/environment/index');
// const main = require('../../../main');
const {app, webContents} = require('electron').remote;

const User = require('./../api/user/user.model.js');
const Connection = require('./../api/connections/connection.model');

const notebookController = require('../api/notebook/notebook.controller')();
const userController = require('../api/user/user.controller');


let connectedClients = {};
let localClient = {};

module.exports = function (io) {
  io.on('connection', (socket) => {

    socket.emit('begin-handshake');
    socket.on('end-handshake', onEndHandshake);
    socket.on('disconnect', disconnect);
    socket.on('return:avatar', onReturnAvatar);
    socket.on('return:notebook-data', onReturnNotebookData);
    socket.on('test:test', onTestTest);

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

    function onTestTest(data) {
      console.log('');
      console.log('on:: test:test', data);
      console.log('');
    }

    //handshake response from connected client
    function onEndHandshake(client) {
      //keep track of connections
      connectedClients[socket.id] = {};
      connectedClients[socket.id].disconnected = false;
      if (client.type === 'external-client') {
        console.log('external-client connected');
        //look for this conneciton in persisted data
        Connection.findOne({_id: client._id}, (err, connection) => {
          if (err) {return console.log('error finding connection');}
          //if connection is not in persistent data
          if (!connection) {
            console.log('STEP 3(c) - new user; we know we are not following at this point');
            //create new object
            const clientData = {
              name: client.name,
              _id: client._id,
              type: 'external-client',
              following: false,
              lastSync: null,
              avatar: client.avatar,
              socketId: client.socketId,
              online: true
            };

            //Add connection to database
            return Connection.insert(clientData, (err, newConnection) => {
              if (err) {
                return console.log('error inserting new connection', err);
              }
              console.log('SEND:: new:connection');
              console.log('TODO: change to socket event');
              //join the external connection room to listen for broadcasts
              socket.join('externalClientsRoom');
              //send local-client new connection
              return io.to(localClient.socketId).emit('new:connection', newConnection)
              // return win.webContents.send('new:connection', newConnection);
            });
          }
          if (connection._id) {
            console.log("Connection exists in database");
            //updates dynamic data
            connection.online = true;
            connection.socketId = client.socketId;
            connection.name = client.name;

            if (connection.following) {
              console.log('STEP 3(a) - we are following this user so get data to sync');

              returnUpdateInfo(connection, client)
                .then((modifiedConnection) => {

                  const options = {returnUpdatedDocs: true};
                  Connection.update({_id: modifiedConnection._id}, modifiedConnection, options, (err, updatedCount, updatedConnection) => {
                    if (err) {return err;}


                    socket.join('externalClientsRoom');
                    //send new connection object to local-client
                    console.log('SEND:: update:connection', updatedConnection);
                    io.to(localClient.socketId).emit('update:connection', updatedConnection)
                    // win.webContents.send('update:connection', updatedConnection);

                    //get notebook data created by user
                    notebookController.getExistingNotebooks(modifiedConnection)
                      .then((notebookSummaries) => {
                        //send notification to local client that we have begun syncing
                        win.webContents.send('sync-event-start');
                        //send notebook summary to connection
                        console.log('emit:: request:notebook-data to:: connected client');
                        console.log('notebookSummaries.length:', notebookSummaries.length);
                        io.to(modifiedConnection.socketId).emit('request:notebook-data', notebookSummaries)
                      })
                      .catch((err) => {
                        console.log('Error getting existing notebooks.', err)
                      });

                    if (updatedCount) {
                      //normalize existing notebooks with new user data
                      notebookController.normalizeNotebooks(updatedConnection)
                        .then((updatedNotebooks) => {
                          console.log('SEND:: update:synced-notebooks');
                          //send local-client updated notebooks
                          console.log('updatedNotebooks.length',updatedNotebooks.length );
                          win.webContents.send('update:synced-notebooks', updatedNotebooks);
                        })
                        .catch((err) => {
                          console.log('there was an issue normalizing notebooks', err);
                        });
                    }
                  });
                })

            //  If we are not following the user
            } else {
              console.log('STEP 3(b) - not following user, but we store it in the db till it disconnects');
              const options = {returnUpdatedDocs: true};
              //update connection
              Connection.update(connection, options, (err, updatedCount, updatedConnection) => {
                if (err) {return err;}
                //join the external client room to listen for broadcasts
                socket.join('externalClientsRoom');
                //send new connection object to local-client
                console.log('SEND:: update:connection', updatedConnection);
                win.webContents.send('update:connection', updatedConnection);
              })
            }
          }
        })
      } else if (client.type === 'local-client') {
        localClient = client;
        localClient.disconnect = false;
      } else {
        console.log('SOMEONE IS SNOOPING');
      }
    }

    //when a socket disconnects
    function disconnect(reason) {
      console.log('on:: disconnect');

      if (socket.id === localClient.socketId) {
        console.log('local-client disconnected... ');

        localClient.disconnect = true;

        setTimeout(() => {
          if (localClient.disconnect) {
            // webContents.fromId(2).send('close:window');
            console.log("localClient has truly disconnected");
            // process.exit();
          }
        }, 4000);

      } else {
        Connection.findOne({socketId: socket.id}, (err, connection) => {
          if (err) {return console.log("could not find client on disconnect");}
          if (!connection) {
            return console.log('This connection does not exist');
          }

          if (!connection.following) {
            Connection.remove({socketId: socket.id}, (err, count) => {
              if (err) {
                return console.log('Error removing connection on disconnect');
              }
              console.log('Send:: remove:connection');
              console.log('TODO: change to socket event');
              win.webContents.send('remove:connection', connection);
            })
          } else {
            connection.online = false;
            connection.socketId = false;
            const options = {returnUpdateDocs: true};
            Connection.update({_id: connection._id}, connection, options, (err, updatedCount, updatedConnection) => {
              if (err) {return console.log('Error updating connection on disconnect');}
              console.log('updatedConnection:', updatedConnection);
              console.log('SEND:: update:connection');
              win.webContents.send('update:connection', updatedConnection || connection);
            })
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
      console.log('');
      console.log('on:: return:notebook-data');
      let win = main.getWindow();

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