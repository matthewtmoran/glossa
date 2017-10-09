'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  remote = require('electron').remote,

  settingsDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-settings'),
    autoload: true,
    timestampData: false
  });

module.exports = settingsDb;