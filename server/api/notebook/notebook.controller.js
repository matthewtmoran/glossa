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
var Notebook = require('./notebook.model');
var path = require('path');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Notebook.find({}, function (err, notebooks) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(notebooks);
  });
};

// Get a single thing
exports.show = function(req, res) {
    Notebook.findOne({_id:req.params.id}, function (err, notebook) {
    if(err) { return handleError(res, err); }
    if(!notebook) { return res.status(404).send('Not Found'); }
    return res.json(notebook);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    Notebook.insert(req.body.notebook, function(err, notebook) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(notebook);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
    Notebook.findOne({_id:req.params.id}, function (err, notebook) {
    if (err) { return handleError(res, err); }
    if(!notebook) { return res.status(404).send('Not Found'); }
    var options = {returnUpdatedDocs: true};
    var removed = _.difference()
    var updated = _.merge(notebook, req.body.notebook);
        updated.hashtags = req.body.hashtags;
        Notebook.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Notebook.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
