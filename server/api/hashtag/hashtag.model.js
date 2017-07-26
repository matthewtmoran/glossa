'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  fs = require('fs'),
  app = require('electron').app,

  hashtagDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-hashtags'),
    autoload: true
  });

module.exports = hashtagDb;


