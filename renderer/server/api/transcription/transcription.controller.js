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
const Transcription = require('./transcription.model');

// Get list of things
exports.index = function (req, res) {
  Transcription.find({}, (err, things) =>{
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(things);
  });
};

exports.corpusIndex = function (req, res) {
  let corpus = req.params.name;
  Transcription.find({corpus: corpus}, function (err, files) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(files);
  });
};

// Get a single thing
exports.show = function (req, res) {
  Transcription.findById(req.params.id, function (err, thing) {
    if (err) {
      return handleError(res, err);
    }
    if (!thing) {
      return res.status(404).send('Not Found');
    }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function (req, res) {
  let transcription = req.body;
  transcription.createdAt = Date.now();
  transcription.updatedAt = Date.now();
  Transcription.insert(req.body, function (err, file) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(file);
  });
};

// Updates an existing thing in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Transcription.findOne({_id: req.params.id}, function (err, file) {
    if (err) {
      return handleError(res, err);
    }
    if (!file) {
      return res.status(404).send('Not Found');
    }
    let options = {returnUpdatedDocs: true};
    let updated = _.merge(file, req.body.dataObj);
    updated.updatedAt = Date.now();

    if (!req.body.dataObj.notebookId) {
      delete updated.notebookId
    }

    if (!req.body.dataObj.image) {
      delete updated.image;
    }

    if (!req.body.dataObj.audio) {
      delete updated.audio;
    }

    Transcription.update({_id: req.params.id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }
      Transcription.persistence.compactDatafile();
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
  Transcription.findOne({_id: req.params.id}, (err, file) => {
    if (err) {
      return handleError(res, err);
    }
    if (!file) {
      return res.status(404).send('Not Found');
    }

    Transcription.remove({_id: file._id}, {}, (err, removedCount) => {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send({id:file._id});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
