/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
// var init = require('./config/init');



// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }




// Setup server
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// var io = require('socket.io')(server);
// var ioClient = require('socket.io-client');
// var socketUtilities = require('./socket.io');
// var bonjourInit = require('./bonjour');

require('./config/express')(app);
require('./routes')(app);

// var mySession = require('./config/init').checkForSession();
// var glossaUser = require('./config/init').getGlossaUser();
Promise.all([
    require('./config/init').checkForSession(),
    require('./config/init').getGlossaUser()
])
    .then(function(results) {

        var mySession = results[0];
        var glossaUser = results[1][0];


        server.listen(config.port, config.ip, function () {

            console.log('Listening on Port.');
            console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

            require('./socket-bonjour')(glossaUser, mySession, io);

            //just a change to push
            // socketUtilities(io, ioClient, glossaUser);
        });

    });


exports = module.exports = app;