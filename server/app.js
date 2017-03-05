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

// process.stdin.resume();
// process.on('exit', function() {
//   console.log('exit event');
//     process.exit();
// });


// var mySession = require('./config/init').checkForSession();
// var glossaUser = require('./config/init').getGlossaUser();
Promise.all([require('./config/init').checkForApplicationData()])
    .then(function(appData) {

        console.log('results', appData);

        console.log('debug1');

        var bonjourSocket;
        var glossaUser = appData[0];
        var mySession = appData[0].session;


        server.listen(config.port, config.ip, function () {

            console.log('Listening on Port.');
            console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

            bonjourSocket = require('./socket-bonjour')(glossaUser, mySession, io);

        });

        process.stdin.resume();


        function exitHandler(options, err) {
            console.log('Node killing local service immediately.... delaying 5 seconds then killing process....');
            bonjourSocket.stopService();

            setTimeout(function() {
                console.log('.... 5 seconds delay over... process being killed now!');
                if (options.cleanup) {
                    console.log('clean...');
                    console.log(options.from);
                }
                if (err) {
                    console.log(err.stack);
                }
                if (options.exit) {
                    console.log('exit?', options.exit);
                    process.exit();
                }
            }, 5000);

        }

        //do something when app is closing
        process.on('exit', exitHandler.bind(null,{cleanup:true, from: 'exit'}));

        //catches ctrl+c event
        process.on('SIGINT', exitHandler.bind(null, {exit:true, from: 'SIGINT'}));

        //catches uncaught exceptions
        process.on('uncaughtException', exitHandler.bind(null, {exit:true, from: 'uncaughtException'}));

    });


exports = module.exports = app;