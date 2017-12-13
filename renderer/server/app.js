/**
 * Main application file
 */
'use strict';

import path from 'path';
import fs from 'fs';
import express from 'express';
import config from './config/environment';
import udp from './udp';
import SettingsController from './api/settings/settings.controller';

const ejs = require("ejs").__express;
// Setup server
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const remote = require('electron').remote;

const ipc = require('./ipc');
const socketServer = require('./socket');
const socketClient = require('./socket/socket-client');

app.set("view engine", "ejs");
app.engine('.ejs', ejs);

fsCheck();

require('./config/express')(app); //configuration for express
require('./routes')(app, io); //routes

server.listen(config.port, config.ip, () => {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

  if (config.localDev) {
    console.log('is local dev');
    socketClient.initLocal()
  } else {
    SettingsController.find()
      .then((settings) => {
        if (settings.isSharing) {
          console.log('is sharing');
          udp.init(server, io);
        }
      })
      .catch((reason) => {
        console.log('There was an error finding settings', reason);
      })
  }



  //ipc event for communication between renderer / main process
  ipc.init(server, io);
  socketServer(io);
});


function exitHandler(options, err) {
  if (err) {
    console.log(err.stack);
  }
  if (options.cleanup) {
    // return config.localDev ? false : udp.stop();
  }
  if (options.exit) {
    setTimeout(function () {
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
