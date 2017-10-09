/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

import _ from 'lodash';
import path from 'path';
import Connection from './connection.model';
console.log('TODO: remove socketUtil');
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
