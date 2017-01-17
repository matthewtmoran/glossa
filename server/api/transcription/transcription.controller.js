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
var Transcription = require('./transcription.model');

// Get list of things
exports.index = function(req, res) {
    Transcription.find(function (err, things) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(things);
  });
};

exports.corpusIndex = function(req, res) {
    var corpus = req.params.name;
    console.log('corpus', corpus);
    Transcription.find({corpus: corpus}, function (err, files) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(files);
    });
};

// Get a single thing
exports.show = function(req, res) {
    Transcription.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    console.log('is this happening?', req.mdFile);
    Transcription.insert(req.mdFile, function(err, file) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(file);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
    Transcription.findOne({_id:req.params.id}, function (err, file) {
    if (err) { return handleError(res, err); }
    if(!file) { return res.status(404).send('Not Found'); }
    var options = {returnUpdatedDocs: true};
    var updated = _.merge(file, req.body);
    Transcription.update({_id:req.params.id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Transcription.findById(req.params.id, function (err, thing) {
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
