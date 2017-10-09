'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  remote = require('electron').remote,

  userDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-user'),
    autoload: true,
    timestampData: false
  });

module.exports = userDb;