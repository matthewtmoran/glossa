'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  app = require('electron').app,

  connectionsDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-connections'),
    autoload: true,
    timestampData: false
  });

module.exports = connectionsDb;