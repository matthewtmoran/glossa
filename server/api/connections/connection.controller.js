/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */


'use strict';

var _ = require('lodash');
var Connection = require('./connection.model');
var path = require('path');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function (req, res) {
  Connection.find({}, function (err, connection) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(connection);
  });
};

// Get a single thing
exports.show = function (req, res) {
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

// Creates a new thing in the DB.
exports.create = function (req, res) {
  var connection = req.body;
  Connection.insert(connection, function (err, c) {
    if (err) {
      return handleError(res, err);
    }
    //even when new connection is created, update our one source of truth...
    global.appData.initialState.connections = [...global.appData.initialState.connections, c];
    return res.status(201).json(c);
  });
};

// Updates an existing connection in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of connection...
exports.update = function (req, res) {
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

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
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

function handleError(res, err) {
  return res.status(500).send(err);
}
