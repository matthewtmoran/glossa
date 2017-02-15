/**
 * Main application file
 */

'use strict';

var express = require('express');
var config = require('./config/environment');
var path = require('path');
// var init = require('./config/init');

var bonjour = require('bonjour')();

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }




// Setup server
var app = express();
var server = require('http').createServer(app);

require('./config/express')(app);
require('./routes')(app);
require('./config/init').checkForSession();

var io = require('socket.io')(server);

// var images = path.join(__dirname,'data/image');

console.log('debug1');

// Start server
server.listen(config.port, config.ip, function () {
    console.log('Listening on Port.');
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

bonjour.publish({ name: 'glossaApp', type: 'http', port: config.port });
bonjour.find({ type: 'http' }, function (service) {
    console.log('Found an HTTP server:', service)
});

io.on('connection', function (socket) {
    console.log('socket connected', socket);
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

exports = module.exports = app;