/**
 * Main application file
 */
'use strict';

module.exports = (appData) => {
  const path = require('path');
  const express = require('express');
  const config = require(path.join(__dirname, './config/environment'));
  // Setup server
  const app = express();
  const server = require('http').createServer(app);
  const io = require('socket.io')(server);
  // io.set('transports', ['websocket']);
  const ipc = require('./ipc');
  const udp = require('./udp');
  const socketServer = require('./socket');

  require(path.join(__dirname, './config/express'))(app); //configuration for express
  require(path.join(__dirname, './routes'))(app, io); //routes

  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    config.secondInstance ? console.log("Glossa running as secondary dev instance") : console.log('Glossa Running as main dev instance');
    config.localDev ?  console.log('Bypassing udp discovery') : console.log('Using udp discovery for external applications') ;
    // require ipc event...
    ipc.init(server, io); //ipc event for communication between renderer / main process
    socketServer(io);
  });


  function exitHandler(options, err) {
    console.log('exit handler from: ', options.from);

    if (err) {
      console.log(err.stack);
    }
    if (options.cleanup) {
      console.log('cleaning...');
      return config.localDev ? false : udp.stop();
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
