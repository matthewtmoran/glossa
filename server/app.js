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
var io = require('socket.io')(server);
var ioClient = require('socket.io-client');

require('./config/express')(app);
require('./routes')(app);

require('./config/init').checkForSession().then(function(data) {

    var glossaUser = require('./config/init').getGlossaUser();
    var glossaSession = data;

    server.listen(config.port, config.ip, function () {
        console.log('Listening on Port.');
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });

    bonjour.find({type: 'http'}, function(service) {
        console.log('Found an HTTP server:', service.name);
        if (service.name.indexOf('glossaApp') > -1) {
            console.log('This is a glossa application on the network...');
            //for some reason camel case was not working on service.txt.userId
            if (service.txt.userid != glossaSession.userId) {



                handleSockeConnection(io, ioClient, glossaUser, service);

                // createExternalSocketConnection(glossaUser, function(data) {
                //     console.log('createExternalSocketConnection callback', data);
                //
                //
                //
                //
                // });



            //    here we connect to an external socket
                console.log('CONNECT TO EXTERNAL SOCKET');
                // TODO: need to figure out how to manage the connection so events are not permitted twice.
/*

               events need to broadcast to connected users when:
               a connection is established
               a connection is 'requested'
               a connection is 'accepted'
               update to notebook
               update to transfile
               user is not longer available


               On initial open
               when connection is established
               Look for changes since last time user was connected....



               NOTES: maybe we manually scan so we cna keep track of which user upon a connection is the 'host' user
 *
 */


            }
            if (service.txt.userid === glossaSession.userId) {
                console.log('This is my own service so dont connect to it');
            }
        }
    });

    bonjour.publish({
        name:'glossaApp-' + glossaSession.userId,
        type: 'http',
        port: config.port,
        txt: {
            userid: glossaSession.userId
        }
    });


    require('./socket.io')(io, ioClient);


});

function handleSockeConnection(io, ioClient, glossaUser) {
    require('./socket.io')(io, ioClient, glossaUser);
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