'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  app = require('electron').app,

  notebookDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-notebooks'),
    autoload: true,
    timestampData: true
  });

module.exports = notebookDb;