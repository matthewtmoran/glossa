/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
var myBonjour = require('./bonjour');


module.exports = function (bonjour, appData, win) {
  console.log('!!bonjour in app', !!bonjour);

  console.log('win', win)

  // Populate DB with sample data
  if (config.seedDB) {
    require('./config/seed');
  }
  // Setup server
  var app = express();
  var server = require('http').createServer(app);
  // var bonjour = require('bonjour')();
  // var io = require('socket.io')(server);

  require('./config/express')(app); //configuration for express
  require('./routes')(app); //routes

  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

    // require ipc event...
    require('../ipc')(server, bonjour, win);

    if (appData.settings.isSharing) {

      // myBonjour.init(server);

    } else {
      console.log('we are not sharing so no broadcasting service or initiating socket server')
    }

  });


  function exitHandler(options, err) {
    console.log('exit handler from: ', options.from);

    if (options.cleanup) {
      console.log('cleaning...');

      // if (localService) {
      //   console.log('Bonjour process exists');
      //
      //   localService.stop(function () {
      //     console.log('Service Stop Success! called from app.js');
      //     process.exit();
      //   });
      // }

      myBonjour.disconnect();

      bonjour.unpublishAll(() => {
        console.log('all bonjour services unpublished')
      });


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
