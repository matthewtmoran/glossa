/**
 * Main application file
 */

'use strict';

// process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
// var init = require('./config/init');

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

require('./config/init');

// init.findUser()
//     .then(function success(response) {
//         console.log('findUser success response', response);
//     }, function failure(response) {
//         console.log('findUser response failure', response);
//
//         init.createUser().then(function success(response) {
//             console.log('createUser success response', response);
//         }, function failure(response) {
//             console.log('createUser failure response', response);
//         })
//
//     }
// );
//
// init.findProject()
//     .then(function success(response) {
//         console.log('findProject success response', response);
//     }, function failure(response) {
//         console.log('findProject response failure', response);
//
//         init.createProject().then(function success(response) {
//             console.log('findProject success response', response);
//         }, function failure(response) {
//             console.log('findProject failure response', response);
//         })
// });

// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

var images = path.join(__dirname,'data/image');


// Start server
server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

exports = module.exports = app;