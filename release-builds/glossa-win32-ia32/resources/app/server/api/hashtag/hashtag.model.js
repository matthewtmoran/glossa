'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    hashtagDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/hashtags'),
        autoload: true
    });

module.exports = hashtagDb;