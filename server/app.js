/**
 * Main application file
 */

'use strict';

module.exports = function () {


  var express = require('express');
  var config = require('./config/environment');
  var path = require('path');

  // Populate DB with sample data
  if (config.seedDB) {
    require('./config/seed');
  }

  // Setup server
  var app = express();
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);
  var bonjour = require('bonjour')();

  var browser = null;
  var myBonjourService = null;
  var bonjourService = require('./socket/bonjour-service');
  var externalSocketClient = require('./socket/socket-client');

  require('./config/express')(app);
  require('./routes')(app);


  Promise.all([require('./config/init').checkForApplicationData()])
    .then(function (appData) {

      var bonjourSocket;
      var glossaUser = appData[0];
      console.log('glossaUser', glossaUser)
      var mySession = appData[0].session;

      var localService;

      server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

        bonjourSocket = require('./socket')(glossaUser, mySession, io, browser, bonjour);

        localService = bonjour.publish({
            name:'glossaApp-' + glossaUser._id,
            type: 'http',
            port: config.port,
            txt: {
              userid: glossaUser._id
            }
        });

        browser = bonjour.find({type: 'http'});
        console.log('Bonjour is listening...');

        // localService.on('error', function(service) {
        //   console.log('localService - error publishing local serv ice');
        // });


        browser.on('error', function(service) {
          console.log('browser - Here is an error', service);
        });


        browser.on('down', function (service)   {
          console.log('');
          console.log('Service went down.......', service.name);
          console.log('Service on network:', browser.services.length);
          console.log('');
        });

        browser.on('up', function (service) {
          console.log('');
          console.log('Service went/is live........', service.name);
          console.log('Services on network:', browser.services.length);
          console.log('');

          // make sure network service is a glossa instance....
          if (service.name.indexOf('glossaApp') > -1) {
            console.log('A glossa Application is online');
            if (service.name === 'glossaApp-' + glossaUser._id) {
              console.log('...Local service found IGNORE');
            } else if (service.name !== 'glossaApp-' + glossaUser._id) {
              console.log('...External service found CONNECT');

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

          // myBonjourService = bonjourService.getMyBonjourService();

          if (localService) {
            console.log('Bonjour process exists');

            // bonjour.destroy();

            localService.stop(function () {
              console.log('Service Stop Success! called from app.js');
            });
          }

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
            process.exit();
          }, 3000);
        }

      }

      //do something when app is closing
      process.on('exit', exitHandler.bind(null, {cleanup: true, exit: true, from: 'exit'}));

      //catches ctrl+c event
      process.on('SIGINT', exitHandler.bind(null, {cleanup: false, exit: true, from: 'SIGINT'}));

      // process.stdin.resume();


      //catches uncaught exceptions
      // process.on('uncaughtException', exitHandler.bind(null, {exit:true, from: 'uncaughtException'}));

    });
};
