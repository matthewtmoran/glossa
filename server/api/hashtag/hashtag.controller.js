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
var Hashtag = require('./hashtag.model');
var path = require('path');
// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Hashtag.find({}, function (err, notebooks) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(notebooks);
  });
};

// Get a single thing
exports.show = function(req, res) {
    Hashtag.findOne(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    Hashtag.create(req.body, function(err, thing) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(thing);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
    Hashtag.findById(req.params.id, function (err, thing) {
    if (err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    var updated = _.merge(thing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(thing);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Hashtag.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

// Get a single hashtag by term
exports.showTerm = function(req, res) {
    var tagName = req.params.term;
    Hashtag.findOne({"tag": tagName}, function (err, tag) {
        if(err) { return handleError(res, err); }
        if(!tag) {

            var newTag = {
                tag: tagName,
                tagColor: '#4285f4',
                realTitle: tagName,
                canEdit: true,
                createdAt: Date.now()
            };

            return Hashtag.insert(newTag, function(err, createdTag) {
                if(err) { return handleError(res, err); }
                return res.json(createdTag);
            });

            // return res.status(404).send('Not Found');
        }
        return res.json(tag);
    });

};

function handleError(res, err) {
  return res.status(500).send(err);
}
