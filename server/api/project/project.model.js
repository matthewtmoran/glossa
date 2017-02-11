'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    projectDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/project'),
        autoload: true
    });

module.exports = projectDb;