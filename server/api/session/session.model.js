'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),
  app = require('electron').app,

    sessionDb = new Datastore({
      filename: path.join(app.getPath('userData'), '/storage/glossa-session'),
      autoload: true,
      timestampData: true
    });

module.exports = sessionDb;