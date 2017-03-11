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

require('./config/express')(app);
require('./routes')(app);


Promise.all([require('./config/init').checkForApplicationData()])
    .then(function(appData) {

        console.log('Application has created data and is ready to go...', appData);

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
            console.log('Node killing local service immediately.... delaying 3 seconds then killing process....');
            console.log(options.from);

                if (options.cleanup) {
                    console.log('cleaning...');

                    if (bonjourSocket && bonjourSocket.getService()) {
                        console.log('stopping service');
                        bonjourSocket.stopService();
                    }
                    console.log('cleaning done...');
                }
                if (err) {
                    console.log(err.stack);
                }
                if (options.exit) {
                    // setTimeout(function() {
                    //     console.log('.... 3 seconds delay over... process being killed now!');
                    //     console.log('exit?', options.exit);
                    // }, 3000);
                        process.exit();
                }

        }

        //do something when app is closing
        process.on('exit', exitHandler.bind(null,{cleanup:true, from: 'exit'}));

        //catches ctrl+c event
        process.on('SIGINT', exitHandler.bind(null, {cleanup:false, exit:true, from: 'SIGINT'}));

        //catches uncaught exceptions
        // process.on('uncaughtException', exitHandler.bind(null, {exit:true, from: 'uncaughtException'}));

    });


exports = module.exports = app;