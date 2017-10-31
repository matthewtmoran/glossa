/**
 * Main application file
 */
'use strict';

import path from 'path';
import fs from 'fs';
import express from 'express';
import config from './config/environment';

const ejs = require("ejs").__express;
// Setup server
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const remote = require('electron').remote;

const ipc = require('./ipc');
// const udp = require('./udp');
const socketServer = require('./socket');

app.set("view engine", "ejs");
app.engine('.ejs', ejs);

fsCheck();

require('./config/express')(app); //configuration for express
require('./routes')(app, io); //routes

server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  config.secondInstance ? console.log("Glossa running as secondary dev instance") : console.log('Glossa Running as main dev instance');
  config.localDev ? console.log('Bypassing udp discovery') : console.log('Using udp discovery for external applications');
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

function fsCheck() {

  const dataPaths = [
    'Glossa',
    'Glossa/storage',
    'Glossa/image',
    'Glossa/audio',
    'Glossa/temp',
  ];

  dataPaths.forEach((p) => {
    let storagePath = path.join(remote.app.getPath('appData'), p);

    if (!fs.statSyncNoException(storagePath)) {
      fs.mkdirSync(storagePath);
    }
  });
}
