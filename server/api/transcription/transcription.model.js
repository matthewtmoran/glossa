'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  app = require('electron').app,

  transcriptionDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-transcription'),
    autoload: true,
    timestampData: false
  });

module.exports = transcriptionDb;