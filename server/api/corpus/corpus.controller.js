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
var Corpus = require('./corpus.model');
var path = require('path');

// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Corpus.find({}, function (err, corpus) {
        if(err) { return handleError(res, err); }
        return res.status(200).json(corpus);
    });
};

// Get a single thing
exports.show = function(req, res) {
    Corpus.findOne({_id:req.params.id}, function (err, corpus) {
        if(err) { return handleError(res, err); }
        if(!corpus) { return res.status(404).send('Not Found'); }
        return res.json(corpus);
    });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    var defaultCorporaSettings = [
        {
            name: 'Duplicate',
            type: ''
        },
        {
            name: 'Bulk-Edit Word Forms',
            type: '',
            disabled: true
        },
        {
            name: 'Phonology Assistant',
            type: '',
            disabled: true
        },
        {
            name: 'Primer Assistant',
            type: '',
            disabled: true
        },
        {
            name: 'Export',
            type: ''
        },
        {
            name: 'Delete',
            type: '',
            action: 'deleteCorpus'
        }
    ];
    var corpus = req.body;


    corpus.params = {
        corpus:''
    };
    corpus.params.corpus = corpus.name.replace(/\s/g,'').toLowerCase();
    corpus.type = 'link';
    corpus.state = 'corpus';
    corpus.settings = defaultCorporaSettings;

    Corpus.insert(corpus, function(err, c) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(c);
    });
};

// Updates an existing corpus in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of corpus...
exports.update = function(req, res) {
    if(req.body._id) { delete req.body._id; }
    Corpus.findOne({_id:req.params.id}, function (err, corpus) {
        if (err) { return handleError(res, err); }
        if(!corpus) { return res.status(404).send('Not Found'); }
        var options = {returnUpdatedDocs: true};
        var updated = _.merge(corpus, req.body.dataObj);
        Corpus.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
            if (err) { return handleError(res, err); }
            Corpus.persistence.stopAutocompaction(); // concat db
            return res.status(200).json(updatedDoc);
        });
    });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Corpus.findById(req.params.id, function (err, thing) {
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
