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
var bonjourService = require('./socket/bonjour-service');
var bonjour = require('bonjour')();
var browser = null;
var externalSocketClient = require('./socket/socket-client');

require('./config/express')(app);
require('./routes')(app);


Promise.all([require('./config/init').checkForApplicationData()])
    .then(function(appData) {

        console.log('Application has created data and is ready to go...');

        var bonjourSocket;
        var glossaUser = appData[0];
        var mySession = appData[0].session;


        server.listen(config.port, config.ip, function () {

            console.log('Listening on Port.');
            console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

            browser = bonjour.find({type: 'http'});

            browser.on('down', function(service) {
                console.log('');
                console.log('Service went down.......', service.name);
                console.log('Service on network:', browser.services.length);
            });

            browser.on('up', function(service) {
                console.log('');
                console.log('Service went/is live........', service.name);
                console.log('Services on network:', browser.services.length);

                //make sure network service is a glossa instance....
                if (service.name.indexOf('glossaApp') > -1) {
                    console.log('A glossa Application is online');
                    if (service.name === 'glossaApp-' + glossaUser._id) {
                        console.log('...Local service found IGNORE');
                    } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                        console.log('...External service found CONNECT');

                        externalSocketClient.initNodeClient(service, glossaUser, io)

                    }
                }
            });

            bonjourSocket = require('./socket')(glossaUser, mySession, io, browser, bonjour);


        });

        process.stdin.resume();

        //TODO: figure this out....
        function exitHandler(options, err) {
            console.log('Node killing local service immediately.... delaying 3 seconds then killing process....');
            var myBonjourService = bonjourService.getMyBonjourService();
            console.log('myBonjourService', myBonjourService);

            myBonjourService.stop(function() {
                console.log('stopping my bonjour service....');
            });
            if (options.cleanup) {
                console.log('cleaning...');

                // bonjour.destroy();



                // bonjourService.destroy();

                // browser.services.forEach(function(service) {
                //     if (service.name === 'glossaApp-' + glossaUser._id) {
                //         service.stop(function() {
                //             console.log('stoping service...');
                //         })
                //     }
                // });
                // bonjourService.destroy();
                // if (bonjourSocket && bonjourSocket.getService()) {
                //     console.log('stopping service');
                //     bonjourSocket.stopService();
                // }
                console.log('cleaning done...');
                console.log('browser.services.length',browser.services.length);
            }
            if (err) {
                console.log(err.stack);
            }
            if (options.exit) {
                // setTimeout(function() {
                //     console.log('.... 3 seconds delay over... process being killed now!');
                //     console.log('exit?', options.exit);
                // }, 3000);
                setTimeout(function() {
                    process.exit();
                }, 4000)
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