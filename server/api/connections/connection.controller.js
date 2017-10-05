/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */


'use strict';

const _ = require('lodash');
const path = require('path');
const Connection = require('./connection.model');
const socketUtil = require('../../socket-backup/socket-util');
module.exports = (io) => {
  let index = (req, res) => {
    Connection.find({}, function (err, connection) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(connection);
    });
  };

  let show = function (req, res) {
    Connection.findOne({_id: req.params.id}, function (err, connection) {
      if (err) {
        return handleError(res, err);
      }
      if (!connection) {
        return res.status(404).send('Not Found');
      }
      return res.json(connection);
    });
  };

  //this is called when we follow a new user....
  let create = function (req, res) {
    let connection = req.body;
    // let connection = JSON.parse(req.body);

    //if we are nto following the connection and the connection is offline
    if (!connection.following && !connection.online) {
      return Connection.remove({_id: connection._id}, ((err, count) => {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json({remove: true, _id: connection._id});
      }));
    }
    connection.createdAt = Date.now();
    connection.updatedAt = Date.now();
    const options = {returnUpdatedDocs: true};
    Connection.update({_id: connection._id}, connection, options, (err, updatedCount, updatedConnection) => {
      if (err) {
        return handleError(res, err);
      }
      //even when new connection is created, update our one source of truth...
      if (updatedConnection.following) {

        //request avatar from newly followed connection
        console.log('emit:: request:avatar to:: connection we followed');
        io.to(updatedConnection.socketId).emit('request:avatar');

        //get our synced data (if any)
        socketUtil.syncData(updatedConnection, (data) => {
          //ask for new data and send old data list to connection
          console.log('emit:: request:new-data to:: ', updatedConnection.socketId);
          io.to(updatedConnection.socketId).emit('request:notebook-data', data.notebooks)
        });
      }
      return res.status(201).json(updatedConnection);
    });
  };


  function test() {

    //update the connection
    //return connection to client

    //if we are following
    //sync data
    //  if there is avatar
    //  request avatar
    //  receive avatar

    //  request notebooks
    //  receive notebooks
    //  send notebooks to client

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


  let update = function (req, res) {
    if (req.body._id) {
      delete req.body._id;
    }
    Connection.findOne({_id: req.params.id}, function (err, connection) {
      if (err) {
        return handleError(res, err);
      }
      if (!connection) {
        return res.status(404).send('Not Found');
      }
      var options = {returnUpdatedDocs: true};
      var updated = _.merge(connection, req.body);
      updated.updatedAt = Date.now();
      Connection.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
        if (err) {
          return handleError(res, err);
        }

        global.appData.initialState.connections = global.appData.initialState.connections.map(connection => connection._id === updatedDoc._id ? updatedDoc : connection);

        Connection.persistence.compactDatafile(); // concat db
        return res.status(200).json(updatedDoc);
      });
    });
  };

  let destroy = function (req, res) {
    Connection.findById(req.params.id, function (err, thing) {
      if (err) {
        return handleError(res, err);
      }
      if (!thing) {
        return res.status(404).send('Not Found');
      }
      thing.remove(function (err) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(204).send('No Content');
      });
    });
  };

  let updateConnection = function (connection) {
    console.log('updateConnection calledc');
    return new Promise((resolve, reject) => {
      const options = {returnUpdatedDocs: true};
      const updated = connection;
      updated.updatedAt = Date.now();
      Connection.update({_id: updated._id}, updated, options, (err, updatedNum, updatedDoc) => {
        if (err) {
          console.log('error updating connection', err);
          reject(err);
        }
        Connection.persistence.compactDatafile(); // concat db
        resolve(updatedDoc);
      });
    });
  };

  return {
    index: index,
    show: show,
    create: create,
    update: update,
    destroy: destroy,
    updateConnection: updateConnection
  }

};
//
// // var globalPaths = require('electron').remote.getGlobal('userPaths');
//
// // Get list of things
// exports.index = function (req, res) {
//   Connection.find({}, function (err, connection) {
//     if (err) {
//       return handleError(res, err);
//     }
//     return res.status(200).json(connection);
//   });
// };
//
// // Get a single thing
// exports.show = function (req, res) {
//   Connection.findOne({_id: req.params.id}, function (err, connection) {
//     if (err) {
//       return handleError(res, err);
//     }
//     if (!connection) {
//       return res.status(404).send('Not Found');
//     }
//     return res.json(connection);
//   });
// };
//
//
// //@Matt - refractoring the toggle follow functionality
//
// // Creates a new thing in the DB.
// exports.create = function (req, res) {
//   let connection = req.body;
//   connection.createdAt = Date.now();
//   connection.updatedAt = Date.now();
//   const options = {returnUpdatedDocs: true};
//   Connection.update({_id: connection._id}, connection, options, (err, updatedCount, updatedConnection) => {
//     if (err) {
//       return handleError(res, err);
//     }
//     //even when new connection is created, update our one source of truth...
//     return res.status(201).json(updatedConnection);
//   });
// };
//
//
//
//
//
//
// // Updates an existing connection in the DB.
// //becuase this could potentially have uploaded files, the body object is, dataObj instead of connection...
// exports.update = function (req, res) {
//   if (req.body._id) {
//     delete req.body._id;
//   }
//   Connection.findOne({_id: req.params.id}, function (err, connection) {
//     if (err) {
//       return handleError(res, err);
//     }
//     if (!connection) {
//       return res.status(404).send('Not Found');
//     }
//     var options = {returnUpdatedDocs: true};
//     var updated = _.merge(connection, req.body);
//     updated.updatedAt = Date.now();
//     Connection.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
//       if (err) {
//         return handleError(res, err);
//       }
//
//       global.appData.initialState.connections = global.appData.initialState.connections.map(connection => connection._id === updatedDoc._id ? updatedDoc : connection);
//
//       Connection.persistence.compactDatafile(); // concat db
//       return res.status(200).json(updatedDoc);
//     });
//   });
// };
//
// // Deletes a thing from the DB.
// exports.destroy = function (req, res) {
//   Connection.findById(req.params.id, function (err, thing) {
//     if (err) {
//       return handleError(res, err);
//     }
//     if (!thing) {
//       return res.status(404).send('Not Found');
//     }
//     thing.remove(function (err) {
//       if (err) {
//         return handleError(res, err);
//       }
//       return res.status(204).send('No Content');
//     });
//   });
// };
//
// function handleError(res, err) {
//   return res.status(500).send(err);
// }
