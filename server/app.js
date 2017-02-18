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
// bonjour.find({ type: 'http' }, function (service) {
//     console.log('Found an HTTP server:', service)
// });

// io.listen(server).sockets.on('connection', function(socket) {
//     console.log('Connection1:', socket);
//     socket.on('my other event', function(data) {
//         console.log('data', data);
//     })
// });
//
// io.sockets.on('connection', function(socket) {
//     console.log('Connection2', socket)
// });

var socketConnection;

var socketData = {};
var externalSockets = {};
var allSockets = {};
var internalSockets = {};


io.sockets.on('connection', function (socket) {
    console.log('Socket Connected time', Date.now());
    console.log('Socket Connected (id)', socket.id);


    socket.on('echo', function (data) {
        console.log('echo listener: ', data);
        socket.emit('echo', data);
    });

    socket.on('echo-ack', function (data, callback) {
        console.log('echo-ack listener');
        callback(data);
    });


    //emit to new connection a request to get socket type
    //the client will listen for this event as well as external servers.
    socket.emit('request:get-socket-type', {socketId: socket.id});

    //differentiate between local sockets and external sockets
    //if an external socket connects
    //    emit to the local socket (notify user of connection)
    //    query data based on last connection
    //    emit to external socket of potential new changes
    //

    socket.emit('external:socket-data', {id: socket.id});

    socket.emit('external:new-changes', {user: 'a glossa user', changes: 5});

    socket.on('return:socket-type', function(data) {
        if (!data.socketType) {
            console.log('socket does not ahve type...');
            return;
        }

        if (data.socketType === 'external') {
            externalSockets[data.socketId] = data;
            allSockets[data.socketId] = data;
            socket.emit('external:last-session-time')
        }
        if (data.socketType === 'internal') {
            allSockets[data.socketId] = data;
            externalSockets[data.socketId] = data;
        }
    });

    socket.on('external:last-session-time', function(data) {
        console.log('return:last-session-time listener', data);
        console.log('TODO: get updates since the data.lastSync');
        socket.emit('external:updates', {notebook: 'will be object of notebook updates'})
    });


    socket.on('disconnect', function(data) {
        console.log('disconnect listener', data);
        io.emit('all:disconnect', data)
    })
});

exports = module.exports = app;