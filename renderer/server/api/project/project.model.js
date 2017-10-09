'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  remote = require('electron').remote,
  projectDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-project'),
    autoload: true,
    timestampData: false
  });
module.exports = projectDb;