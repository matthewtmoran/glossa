'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  app = require('electron').app,

  projectDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-project'),
    autoload: true,
    timestampData: true
  });

module.exports = projectDb;