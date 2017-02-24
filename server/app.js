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
var ioClient = require('socket.io-client');
var socketUtilities = require('./socket.io');
var bonjourInit = require('./bonjour');

require('./config/express')(app);
require('./routes')(app);

// var mySession = require('./config/init').checkForSession();
// var glossaUser = require('./config/init').getGlossaUser();

Promise.all([require('./config/init').checkForSession(), require('./config/init').getGlossaUser()]).then(function(results) {

    var glossaUser = results[0];
    var mySession = results[1];


    server.listen(config.port, config.ip, function () {

        console.log('Listening on Port.');
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));

        socketUtilities(io, ioClient, glossaUser);
    });

});


function handleSockeConnection(io, ioClient, glossaUser, service) {
    socketUtilities(io, ioClient, glossaUser, service);
}

function createExternalSocketConnection(localUser, callback) {
    console.log('createSocketConnection');

    var serverPath = 'http://' + service.referer.address +':'+ service.port;

    var clientSocket = ioClient.connect(serverPath);



    //this listens for a request for the socket type
    //This is where the data is defined and stored locally
    clientSocket.on('external:get-socket-type', function(data) {
        var newSocket = {
            socketId: data.socketId,
            socketType: 'external'
        };
        allSockets[data.id] = newSocket ;
        externalSockets[data.id] = newSocket ;

        //emit back to where the request was made the created socket data object
        clientSocket.emit('return:socket-type', externalSockets[data.id])
    });

    //On connection, an external server will request the last time they were synced
    //TODO: store the last time users were synced somewhere.
    clientSocket.on('external:last-session-time', function() {
        console.log('request:last-session-time listener');
        console.log('TODO: get hte last time this user was online and return to other server');

        //we send the last time this user was connected to the other user. That way that user can query data since that time and send it back.
        clientSocket.emit('return:last-session-time', {socketId: clientSocket.id, lastSync:Date.now()})
    });

    //Where we recieve updates from other servers.
    //We need to update database with new info.  Once that is complete we emit event to local client to update in real time.
    clientSocket.on('external:updates', function(data) {
        console.log('external:updates listener', data);
        console.log('IMPORT DATA into db as non-editable but viewable/deletable and notify user');

        clientSocket.emit('internal:updates', data);
    });


    clientSocket.on('all:disconnect', function(data) {
        console.log('all:disconnect listener', data);
    });


    clientSocket.on('news', function(data) {
        console.log('News Event Listener:', data);

    });

    clientSocket.on('external:new-changes', function(data) {
        console.log("external:new-changes listener", data);

        clientSocket.emit('local:display-changes', data);

    })

}


exports = module.exports = app;