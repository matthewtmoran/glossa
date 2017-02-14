/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
// var init = require('./config/init');

// var bonjour = require('bonjour')()

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }




// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);
require('./config/init').checkForSession();

// var images = path.join(__dirname,'data/image');


// Start server
server.listen(config.port, config.ip, function () {
    // bonjour.publish({ name: 'Glossa App', type: 'http', port: config.port });
    console.log('Listening on Port.');
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

    // bonjour.find({ type: 'http' }, function (service) {
    //     console.log('Found an HTTP server:', service)
    // })
});

exports = module.exports = app;