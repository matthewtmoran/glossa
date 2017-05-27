'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    connectionsDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/connections'),
        autoload: true,
        timestampData: true
    });

module.exports = connectionsDb;