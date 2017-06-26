'use strict';
var Datastore = require('nedb'),
  path = require('path'),
  config = require('../../config/environment'),
  app = require('electron').app,

  userDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-user'),
    autoload: true,
    timestampData: true
  });
// userDb = new Datastore({
//         filename: path.join(config.root, config.dbPath, '/user'),
//         autoload: true,
//         timestampData: true
//     });

module.exports = userDb;