'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    userDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/user'),
        autoload: true,
        timestampData: true
    });

module.exports = userDb;