'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  remote = require('electron').remote,

  notebookDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-notebooks'),
    autoload: true,
    timestampData: false
  });

module.exports = notebookDb;