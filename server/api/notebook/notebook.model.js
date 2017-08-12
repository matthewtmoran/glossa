'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  app = require('electron').app,

  notebookDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-notebooks'),
    autoload: true,
    timestampData: false
  });

module.exports = notebookDb;