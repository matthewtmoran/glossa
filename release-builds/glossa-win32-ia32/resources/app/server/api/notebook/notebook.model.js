'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    notebookDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/notebooks'),
        autoload: true,
        timestampData: true
    });

module.exports = notebookDb;