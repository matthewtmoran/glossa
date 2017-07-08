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
var User = require('./user.model');
var Notebooks = require('./../notebook/notebook.model');
var path = require('path');
var config = require('../../config/environment');
var fs = require('fs');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function (req, res) {
  console.log('get user called....');
  User.findOne({}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(user);
  });
};

// Get a single thing
exports.show = function (req, res) {
  User.findOne({_id: req.params.id}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    return res.json(user);
  });
};

// Creates a new thing in the DB.
exports.create = function (req, res) {
  var user = req.body;
  User.insert(user, function (err, c) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(c);
  });
};

// Updates an existing user in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of user...
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  User.findOne({_id: req.params.id}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};
    var updated = _.merge(user, req.body);
    User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }

      global.appData.initialState.user = Object.assign({}, updatedDoc);
      normalizeNotebooks(updatedDoc);
      User.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

exports.updateSession = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  User.findOne({_id: req.params.id}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};

    var updated = user;
    updated.session = req.body;

    User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }
      global.appData.initialState.user = Object.assign({}, updatedDoc);
      User.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

exports.updateSettings = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  User.findOne({_id: req.params.id}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};

    var updated = user;
    updated.settings = req.body;

    User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }
      global.appData.initialState.user = Object.assign({}, updatedDoc);
      User.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

exports.removeAvatar = function (req, res) {
  User.find({}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};

    var updated = user[0];
    delete updated.avatar;

    User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }
      console.log('Updated User');
      normalizeNotebooks(updatedDoc);
      global.appData.initialState.user = Object.assign({}, updatedDoc);
      User.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });


};

exports.avatar = function (req, res) {
  console.log('Adding Avatar');
  User.find({}, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var options = {returnUpdatedDocs: true};

    var updated = user[0];
    updated.avatar = req.body.dataObj.image.path;

    console.log('updated', updated);

    User.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }

      normalizeNotebooks(updatedDoc);
      global.appData.initialState.user = Object.assign({}, updatedDoc);
      User.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
  User.findById(req.params.id, function (err, thing) {
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

function normalizeNotebooks(updateDetails) {
  console.log("...normalizing notebooks.  Triggered by http request");

  //query specific notebooks
  const query = {
    "createdBy._id": updateDetails._id
  };
  //the update we are making
  const update = {
    $set: {
      "createdBy.name": updateDetails.name,
      "createdBy.avatar": updateDetails.avatar
    }
  };
  //options for nedb
  const options = {
    returnUpdatedDocs: true, multi: true
  };

  Notebooks.update(query, update, options, (err, updatedCount, updatedDocs) => {
    if (err) {
      return console.log('Error normalizing notebook data', err);
    }
    Notebooks.persistence.compactDatafile();

    if (!!updatedDocs) {
      updatedDocs.forEach((updatedDoc) => {
        global.appData.initialState.notebooks = global.appData.initialState.notebooks.map(notebook => notebook._id === updatedDoc._id ? updatedDoc : notebook )
      });
    }

  });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
