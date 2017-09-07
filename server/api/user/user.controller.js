/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const User = require('./user.model');
const Notebooks = require('./../notebook/notebook.model');

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
  user.createdAt = Date.now();
  user.updatedAt = Date.now();
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
  User.findOne({_id: req.params.id}, (err, user) => {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    const options = {returnUpdatedDocs: true};
    let updated = _.merge(user, req.body);
    let returnObject = {};
    updated.updatedAt = Date.now();
    User.update({_id: updated._id}, updated, options, (err, updatedNum, updatedDoc) => {
      if (err) {
        return handleError(res, err);
      }

      returnObject.user = updatedDoc;

      normalizeNotebooks(updatedDoc)
        .then((notebooks) => {
            returnObject.notebooks = notebooks;
            User.persistence.compactDatafile(); // concat db
            return res.status(200).json(returnObject);
        })
        .catch((err) => {
          return handleError(res, err);
        })
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
    const options = {returnUpdatedDocs: true};
    let updated = user[0];
    let returnObject = {};
    delete updated.avatar;

    User.update({_id: updated._id}, updated, options, (err, updatedNum, updatedDoc) => {
      if (err) {
        return handleError(res, err);
      }

      returnObject.user = updatedDoc;

      normalizeNotebooks(updatedDoc)
        .then((notebooks) => {
          returnObject.notebooks = notebooks;
          User.persistence.compactDatafile(); // concat db
          return res.status(200).json(returnObject);
        })
        .catch((err) => {
          return handleError(res, err);
        })
    });
  });
};

exports.avatar = function (req, res) {
  User.find({}, (err, user) => {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    const options = {returnUpdatedDocs: true};
    let returnObject = {};

    let updated = user[0];
    updated.avatar = req.body.dataObj.image;

    User.update({_id: updated._id}, updated, options, (err, updatedNum, updatedDoc) => {
      if (err) {
        return handleError(res, err);
      }
      returnObject.user = updatedDoc;
      normalizeNotebooks(updatedDoc)
        .then((notebooks) => {
          returnObject.notebooks = notebooks;
          User.persistence.compactDatafile(); // concat db
          return res.status(200).json(returnObject);
        })
        .catch((err) => {
          return handleError(res, err);
        });
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
  return new Promise((resolve, reject) => {
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
        console.log('Error normalizing notebook data', err);
        reject(err);
      }
      Notebooks.persistence.compactDatafile();
      resolve(updatedDocs);
    });
  });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
