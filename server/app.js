/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
// var init = require('./config/init');

var bonjour = require('bonjour')();

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }




// Setup server
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

require('./config/express')(app);
require('./routes')(app);

require('./config/init').checkForSession().then(function(data) {


    var glossaSession = data;

    server.listen(config.port, config.ip, function () {
        console.log('Listening on Port.');
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });

    bonjour.find({type: 'http'}, function(service) {
        console.log('Found an HTTP server:', service.name);
        if (service.name.indexOf('glossaApp') > -1) {
            console.log('This is a glossa application on the network...');
            //for some reason camel case was not working on service.txt.userId
            if (service.txt.userid != glossaSession.userId) {

            //    here we connect to an external socket
                console.log('CONNECT TO EXTERNAL SOCKET');
                // TODO: need to figure out how to manage the connection so events are not permitted twice.
/*

               events need to broadcast to connected users when:
               a connection is established
               a connection is 'requested'
               a connection is 'accepted'
               update to notebook
               update to transfile
               user is not longer available


               On initial open
               when connection is established
               Look for changes since last time user was connected....



               NOTES: maybe we manually scan so we cna keep track of which user upon a connection is the 'host' user
 *
 */


            }
            if (service.txt.userid === glossaSession.userId) {
                console.log('This is my own service so dont connect to it');
            }
        }
    });

    bonjour.publish({
        name:'glossaApp-' + glossaSession.userId,
        type: 'http',
        port: config.port,
        txt: {
            userid: glossaSession.userId
        }
    });


    require('./socket.io')(io);


});




exports = module.exports = app;