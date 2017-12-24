'use strict';
const Datastore = require('nedb');

const path = require('path');
const fs = require('fs');
const {app} = require('electron').remote;

const hashtagDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/storage/glossa-hashtags'),
    autoload: true
  });

module.exports = hashtagDb;


