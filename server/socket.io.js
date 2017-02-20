var externalSockets = {};
var allSockets = {};


module.exports = function(io) {
    io.sockets.on('connection', function (socket) {
        console.log('****New Socket Connected:', socket.id);

        console.log('*{{Adding to allSockets object.}}');
        allSockets[socket.id] = socket.id;
        console.log('allSockets:', allSockets);

        //emit to socket to get the type either client or external
        //external connection should be any user that has an approved connection
        console.log('*{{emit event to ' + socket.id + ' requesting socket type}}');
        socket.emit('requestSocketType');
        socket.on('returnSocketType', function(data) {
            console.log('*{{returnSocketType Heard.  Socket type is \'' + data.type + '\'. Join specific room. }}');
            console.log('Heard returningSocketType on server', data);
            socket.room = data.type;

            if (socket.room === 'client') {
                socket.join(socket.room);
            }

            if (data.type === 'external') {
                socket.join('external');
            }

            console.log('*{{Emit to all in'+ socket.room +' room that socket is connected}}');
            io.sockets.in(socket.room).emit('notify:client-server-connection')

        });






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
            console.log('disconnect listener data:', data);
            io.emit('all:disconnect', data)
        })
    });
};
