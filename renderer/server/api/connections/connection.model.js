'use strict';
const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron').remote;

const connectionsDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-connections'),
    autoload: true,
    timestampData: false
  });

module.exports = connectionsDb;