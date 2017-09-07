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
var Transcriptions = require('../transcription/transcription.model');
var path = require('path');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function (req, res) {
  Notebook.find({}, function (err, notebooks) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(notebooks);
  });
};

// Get a single thing
exports.show = function (req, res) {
  Notebook.findOne({_id: req.params.id}, function (err, notebook) {
    if (err) {
      return handleError(res, err);
    }
    if (!notebook) {
      return res.status(404).send('Not Found');
    }
    return res.json(notebook);
  });
};

// Creates a new thing in the DB.
exports.create = function (req, res) {
  let newNotebook = req.body.dataObj;
  newNotebook.createdAt = Date.now();
  newNotebook.updatedAt = Date.now();
  Notebook.insert(req.body.dataObj, function (err, notebook) {
    if (err) {
      return handleError(res, err);
    }
    global.appData.initialState.notebooks = [...global.appData.initialState.notebooks, notebook];
    return res.status(201).json(notebook);
  });
};

// Updates an existing notebooks in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of notebooks...
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Notebook.findOne({_id: req.params.id}, function (err, notebook) {
    if (err) {
      return handleError(res, err);
    }
    if (!notebook) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};
    var updated = _.merge(notebook, req.body.dataObj);
    updated.updatedAt = Date.now();
    // hashtags will either be array of tags or an empty array
    updated.hashtags = req.body.dataObj.hashtags || [];
    Notebook.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }

      global.appData.initialState.notebooks = global.appData.initialState.notebooks.map((notebook) => notebook._id === updatedDoc._id ? updatedDoc : notebook);
      Notebook.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
  Notebook.findOne({_id: req.params.id}, (err, notebook) => {
    if (err) {
      return handleError(res, err);
    }
    let transcriptionPromises = [];
    Transcriptions.find({notebookId: req.params.id}, (err, transcriptions) => {
      if (err) {
        return handleError(res, err);
      }
      if (transcriptions.length > 0) {
        transcriptions.forEach((file) => {
          //make notebooks images independent media files
          if (notebook.image) {
            file.image = notebook.image;
          }
          if (notebook.audio) {
            file.audio = notebook.audio;
          }
          //remove the notebook connection
          delete file.notebookId;
          transcriptionPromises.push(updateTranscription(file))
        })
      }
    });
    Notebook.remove({_id: req.params.id}, (err, numRemoved) => {
      if (err) {
        return handleError(res, err);
      }
      if (transcriptionPromises.length) {
        Promise.all(transcriptionPromises)
          .then((results) => {
            return res.status(204).send({notebookId: req.params.id, transcriptions: results});
          })
          .catch((err) => {
            return console.log('error normalizeing transcriptiosn: ', err);
          })
      }
      return res.status(204).send({notebookId: req.params.id});
    });
  });
};

function updateTranscription(transcription) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
    Transcriptions.update({_id: transcription._id}, transcription, options, (err, updatedCount, updatedDoc) => {
      if (err) {
        reject(err);
      }
      resolve(updatedDoc);
    })
  })
}

function handleError(res, err) {
  return res.status(500).send(err);
}
