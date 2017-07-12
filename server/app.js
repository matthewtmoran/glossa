/**
 * Main application file
 */
'use strict';

module.exports = (bonjour, appData, win) => {
  const path = require('path');
  const express = require('express');
  const config = require(path.join(__dirname, './config/environment'));
  // Setup server
  const app = express();

  const server = require('http').createServer(app);
  const io = require('socket.io')(server);

  require(path.join(__dirname, './config/express'))(app); //configuration for express
  require(path.join(__dirname, './routes'))(app); //routes

  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    // require ipc event...
    require(path.join(__dirname, './ipc')).init(server, bonjour, io, win); //ipc event for communication between renderer / main process
  });

  function exitHandler(options, err) {
    console.log('exit handler from: ', options.from);

    if (err) {
      console.log(err.stack);
    }


    if (options.cleanup) {
      console.log('cleaning...');

      bonjour.unpublishAll(() => {
        console.log('bonjour unpublished all success...');
        bonjour.destroy();
        console.log('bonjour destroyed called..... ')
      });

      console.log('cleaning done...');
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

};
