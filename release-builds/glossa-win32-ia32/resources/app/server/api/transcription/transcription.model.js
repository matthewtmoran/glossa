'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    transcriptionDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/transcription'),
        autoload: true,
        timestampData: true
    });

module.exports = transcriptionDb;