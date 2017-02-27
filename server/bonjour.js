var config = require('./config/environment');
var bonjour = require('bonjour')();

var externalSockets = {};

module.exports = function(glossaUser, io, ioClient, allSockets) {
    console.log('...bonjour module');
    var browser = bonjour.find({type: 'http'});

    bonjour.publish({
        name:'glossaApp-' + glossaUser.userId,
        type: 'http',
        port: config.port,
        txt: {
            userid: glossaUser.userId
        }
    });
    console.log('....local service published...');

    browser.on('up', function(service) {
        console.log('...found published http service', service.name, Date.now());
        if (service.name.indexOf('glossaApp') > -1) {
            console.log('...This is a glossa application');
            //for some reason camel case was not working on service.txt.userId
            if (service.txt.userid != glossaUser.userId) {

                console.log('... external service found');
                // console.log('... verify in connected user list');



                initExternalSocket(service, io, ioClient);






                //check user object to see if it is in connected users list.
                //if it is not in connected users list...
                //



                // handleSockeConnection(io, ioClient, glossaUser, service);

                // createExternalSocketConnection(glossaUser, function(data) {
                //     console.log('createExternalSocketConnection callback', data);
                //
                //
                //
                //
                // });



                //    here we connect to an external socket

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

            // if (!service.published && service.txt.userid === results[0].userId) {
            //     console.log('...if service is not published and its my local service');
            //      socketUtilities(io, ioClient, results[1][0]);
            // }


            if (service.txt.userid == glossaUser.userId) {
                console.log('... service is published and it is local its a local service so IGNORE');
            }
        }
    });

    //connect to other user as client
    function initExternalSocket(service, io, ioClient) {
        console.log('initExternalSocket');
        for (var key in externalSockets) {
            if (externalSockets.hasOwnProperty(key)) {
                if (externalSockets[key].userid === service.txt.userid || externalSockets[key].userid === glossaUser.userId ) {
                    return console.log('External socket is already established IGNORE')
                } else {
                    console.log('...external socket not found proceed with connection');
                }
            }
        }

        var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        var externalSocket = ioClient.connect(externalPath);

        // externalSocket.socketType = 'external';
        //
        externalSocket.on('connect', function() {
            console.log('... external socket connected as a client');
            externalSocket.emit('thisTest', glossaUser.userid);
        });

        externalSocket.on('request:SocketType', function(data) {
            console.log('.**********************..server side request:SocketType', data)

        });
        //
        // externalSocket.on('connection', function() {
        //     console.log('connection event');
        // })
    }
};
