'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  app = require('electron').app,

  userDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-user'),
    autoload: true,
    timestampData: false
  });

module.exports = userDb;