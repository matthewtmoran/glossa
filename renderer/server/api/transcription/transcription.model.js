'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  remote = require('electron').remote,

  transcriptionDb = new Datastore({
    filename: path.join(remote.app.getPath('userData'), '/storage/glossa-transcription'),
    autoload: true,
    timestampData: false
  });

module.exports = transcriptionDb;