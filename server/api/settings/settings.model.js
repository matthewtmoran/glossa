'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),
  app = require('electron').app,

    settingsDb = new Datastore({
      filename: path.join(app.getPath('userData'), '/storage/glossa-settings'),
      autoload: true,
      timestampData: true
    });

module.exports = settingsDb;