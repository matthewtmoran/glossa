'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  remote = require('electron').remote,

  sessionDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-session'),
    autoload: true,
    timestampData: false
  });

module.exports = sessionDb;