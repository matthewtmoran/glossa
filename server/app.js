/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');

module.exports = function (bonjour, appData) {
  // Populate DB with sample data
  if (config.seedDB) {
    require('./config/seed');
  }
  // Setup server
  var app = express();
  var server = require('http').createServer(app);

  var io = require('socket.io')(server);

  var localService;
  var bonjourSocket;
  var browser = null;
  var glossaUser = appData[0];
  var mySession = appData[0].session;

  var externalSocketClient = require('./socket/socket-client');

  require('./config/express')(app); //configuration for express
  require('./routes')(app); //routes

  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

    bonjourSocket = require('./socket')(glossaUser, mySession, io, browser, bonjour);

    browser = bonjour.find({type: 'http'});
    console.log('Bonjour is listening...');

    localService = bonjour.publish({
      name: 'glossaApp-' + glossaUser._id,
      type: 'http',
      port: config.port,
      txt: {
        userid: glossaUser._id
      }
    });


    browser.on('error', function (service) {
      console.log('browser - Here is an error', service);
    });

    browser.on('down', function (service) {
      console.log('');
      console.log('Service went down.......', service.name);
      console.log('Service on network:', browser.services.length);
      console.log('');
    });

    browser.on('up', function (service) {
      console.log('');
      console.log('Service went/is live........', service.name);
      if (service.name !== 'glossaApp-' + glossaUser._id) {
        console.log('((not our service))');
      }
      if (service.name === 'glossaApp-' + glossaUser._id) {
        console.log('((is our service))');
      }

      console.log('Services on network:', browser.services.length);
      console.log('');

      // make sure network service is a glossa instance....
      if (service.name.indexOf('glossaApp') > -1) {
        console.log('A glossa Application is online');
        if (service.name === 'glossaApp-' + glossaUser._id) {
          console.log('...Local service found IGNORE');

        } else if (service.name !== 'glossaApp-' + glossaUser._id) {
          console.log('...External service found CONNECT');

          //this is where we connect to a serve as a client.
          //On other devices, we will show up as a client
          //they will see our data through this
          //this is how we send out data
          externalSocketClient.initAsClient(service, glossaUser, io)

        }
      }
      console.log('');
    });
  });

  function exitHandler(options, err) {
    console.log('exit handler from: ', options.from);

    if (options.cleanup) {
      console.log('cleaning...');
      console.log('browser.services.length', browser.services.length);

      if (localService) {
        console.log('bonjour', bonjour);
        console.log('Bonjour process exists');
        console.log('localService.name', localService.name);

        localService.stop(function () {
          console.log('Service Stop Success! called from app.js');
          process.exit();
        });
      }

      bonjour.destroy();

      console.log('browser.services.length', browser.services.length);
      console.log('cleaning done...');
    }
    if (err) {
      console.log(err.stack);
    }
    if (options.exit) {

      console.log('Exit is true');
      console.log('....3 seconds delay start');

      setTimeout(function () {
        console.log('Delay over.  Exiting.');
        // process.exit();
      }, 3000);
    }

  }

  //do something when app is closing
  process.on('exit', exitHandler.bind(null, {cleanup: true, exit: true, from: 'exit'}));

  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {cleanup: false, exit: true, from: 'SIGINT'}));

};
