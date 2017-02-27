var path = require('path');
var externalSockets = {};
var allSockets = {};
var globalSockets = {
    client: {},
    external: {}
};

// var bonjourInit = require('./bonjour');

module.exports = function(io, ioClient, glossaUser, service) {
    if (!service) {
        console.log('...establish local socket connection');
    }

    // if (service) {
    //     console.log('...This appears to be an external connection broadcasting on port: ' + service.port);
    //
    //
    //     for (var key in allSockets) {
    //         if (allSockets.hasOwnProperty(key)) {
    //             if (allSockets[key].userid === service.txt.userid || allSockets[key].userid === glossaUser.userId ) {
    //                return console.log('External socket is already established IGNORE')
    //             } else {
    //                 console.log('...external socket not found proceed with connection');
    //             }
    //         }
    //     }
    //
    //     var externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
    //     var externalSocket = ioClient.connect(externalPath);
    //
    //     externalSocket.on('connect', function() {
    //
    //         console.log('... external socket connected');
    //
    //         externalSocket.emit('thisTest');
    //
    //     });
    //
    //     externalSocket.on('connection', function() {
    //         console.log('connection event');
    //     })
    // }

    // ioClient.on('request:SocketType', function(data) {
    //     console.log('.**********************..server side request:SocketType', data)
    // });


    io.sockets.on('connection', function (socket) {
        console.log('***new Socket Connected:', Date.now());

        if (socket.socketType === 'external') {
            console.log("Whoa.... This is an external socket!!!");
        }

        // for (var key in allSockets) {
        //     if (allSockets.hasOwnProperty(key)) {
        //         if (allSockets[key].userid === service.txt.userid || allSockets[key].userid === glossaUser.userId ) {
        //             return console.log('External socket is already established IGNORE')
        //         } else {
        //             console.log('...external socket not found proceed with connection');
        //         }
        //     }
        // }


        // console.log('...add to allSocket object');
        // allSockets[socket.id] = {
        //     socketId: socket.id,
        //     userId: glossaUser._id
        // serverId: service.id || null
        // };


        //emit to socket to get the type either client or external
        //external connection should be any user that has an approved connection
        console.log('...requesting socket type to socket.id:' + socket.id);
        socket.emit('request:SocketType', {socketId: socket.id});

        socket.on('request:SocketType', function(data) {
            console.log('.**********************..server side request:SocketType', data)
        });

        socket.on('return:SocketType', function(data) {
            console.log('...return:SocketType heard');

            globalSockets[data.type][socket.id] = data;
            console.log('... emitting to socket - notify:server-connection');
            io.to(socket.id).emit('notify:server-connection');

            // if (data.type === 'client') {
            //     console.log('...notify local user server is connected');
            //
            //
            //
            //     console.log('this is where we want to publish our service???');
            bonjourInit(glossaUser, io, ioClient, allSockets);
            //     io.to(socket.id).emit('notify:server-connection')
            // }
            //
            // socket.room = data.type;

            // if (socket.room === 'client') {
            //     console.log('...joining ' + data.type + ' room.');
            //     socket.join(socket.room);
            // }

            if (data.type === 'external') {
                console.log('...joining ' + data.type + ' room.');
                socket.join('external');
            }




            // console.log('...Emit to all in '+ socket.room +' room that socket: '+ socket.id +' is connected');

            // var room = io.sockets.adapter.rooms[socket.room];
            // console.log('...socket in room ' + socket.room+ ' = ' + room.length);

            // io.sockets.in(socket.room).emit('notify:server-connection')

        });






        socket.on('echo', function (data) {
            console.log('echo listener: ', data);
            socket.emit('echo', data);
        });

        socket.on('echo-ack', function (data, callback) {
            console.log('echo-ack listener');
            callback(data);
        });

        socket.on('thisTest', function(data) {
            console.log('Heard thisText on server from client', data);
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
            console.log('disconnect listener data:', data);
            io.emit('all:disconnect', data)
        })
    });
};
