'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),
    app = require('electron').app,

    connectionsDb = new Datastore({
        filename: path.join(app.getPath('userData'), '/storage/glossa-connections'),
        autoload: true,
        timestampData: true
    });

module.exports = connectionsDb;