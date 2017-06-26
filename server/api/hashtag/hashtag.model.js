'use strict';
var Datastore = require('nedb'),
    path = require('path'),
    config = require('../../config/environment'),

    hashtagDb = new Datastore({
        filename: path.join(config.root, config.dbPath, '/hashtags'),
        autoload: true
    });


/*
 'use strict';
 var Datastore = require('nedb'),
 path = require('path'),
 config = require('../../config/environment'),
 app = require('electron').app,

 hashtagDb = new Datastore({
 filename: path.join(app.getPath('userData'), '/storage/glossa-hashtags'),
 autoload: true
 });

 module.exports = hashtagDb;
 */

module.exports = hashtagDb;

