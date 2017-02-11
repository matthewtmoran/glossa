'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    corpusDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/corpus'),
        autoload: true
    });

module.exports = corpusDb;