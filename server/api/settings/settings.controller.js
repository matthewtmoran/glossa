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
var Settings = require('./settings.model');
var path = require('path');

// Get list of things
exports.index = function(req, res) {
    Settings.find({}, function (err, settings) {
        if(err) { return handleError(res, err); }
        return res.status(200).json(settings);
    });
};

// Get a single thing
exports.show = function(req, res) {
    Settings.findOne({_id:req.params.id}, function (err, settings) {
        if(err) { return handleError(res, err); }
        if(!settings) { return res.status(404).send('Not Found'); }
        return res.json(settings);
    });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    var settings = req.body;
    Settings.insert(settings, function(err, c) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(c);
    });
};

// Updates an existing settings in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of settings...
exports.update = function(req, res) {
    if(req.body._id) { delete req.body._id; }
    Settings.findOne({}, function (err, settings) {
        if (err) { return handleError(res, err); }
        if(!settings) { return res.status(404).send('Not Found'); }
        var options = {returnUpdatedDocs: true};
        var updated = _.merge(settings, req.body);
        Settings.update({_id: settings._id}, updated, options, function (err, updatedNum, updatedDoc) {
            if (err) { return handleError(res, err); }
            global.appData.initialState.settings = updatedDoc;
            Settings.persistence.compactDatafile(); // concat db
            return res.status(200).json(updatedDoc);
        });
    });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Settings.findById(req.params.id, function (err, thing) {
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
