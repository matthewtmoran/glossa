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
var Project = require('./project.model');
var path = require('path');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Project.find({}, function (err, project) {
        if(err) { return handleError(res, err); }
        return res.status(200).json(project);
    });
};

// Get a single thing
exports.show = function(req, res) {
    Project.findOne({_id:req.params.id}, function (err, project) {
        if(err) { return handleError(res, err); }
        if(!project) { return res.status(404).send('Not Found'); }
        return res.json(project);
    });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    var project = req.body;
    Project.insert(project, function(err, c) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(c);
    });
};

// Updates an existing project in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of project...
exports.update = function(req, res) {
    if(req.body._id) { delete req.body._id; }
    Project.findOne({_id:req.params.id}, function (err, project) {
        if (err) { return handleError(res, err); }
        if(!project) { return res.status(404).send('Not Found'); }
        var options = {returnUpdatedDocs: true};
        var updated = _.merge(project, req.body.dataObj);
        Project.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
            if (err) { return handleError(res, err); }
            Project.persistence.stopAutocompaction(); // concat db
            return res.status(200).json(updatedDoc);
        });
    });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Project.findById(req.params.id, function (err, thing) {
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
