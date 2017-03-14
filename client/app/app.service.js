angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http, socketFactory, $rootScope, $mdToast, Notification, __user) {
    var service = {

        //socket functions
        initListeners: initListeners,
        getOnlineUsersSE: getOnlineUsersSE,
        getAllUserUpdates: getAllUserUpdates,
        broadcastUpdates: broadcastUpdates,

        //dealing with __user constant
        getUser: getUser,
        isSharing: isSharing,
        getSettings: getSettings,
        getConnections: getConnections,

        //updating __user constant
        updateSession: updateSession,
        saveSettings: saveSettings,
        updateConnection: updateConnection
    };

    // initListeners();
    return service;

    function getUser() {
        return __user;
    }

    function isSharing() {
        return __user.isSharing;
    }

    function getSettings() {
        return __user.settings;
    }

    function getConnections() {
        return __user.connections;
    }

    function updateConnection(update) {
        console.log('updateConnection', update);
        var updateString = angular.toJson(update);
        console.log('updateString', updateString);
        socketFactory.emit('update:userConnection', updateString);
    }


    function saveSettings(settings) {
        __user.settings = settings;
        return $http.put('/api/user/' + __user._id, __user)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //should only be called on stateChange
    function updateSession(user) {
        return $http.put('/api/user/' + user._id, user)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function getOnlineUsersSE() {
        socketFactory.emit('get:networkUsers')
    }

    //look for all updates from users that are being followed
    function getAllUserUpdates() {
        var msg = 'Looking for updates from all users...';
        var delay = 4000;

        Notification.show({
            message: msg,
            hideDelay: delay
        });

        socketFactory.emit('request:AllUserUpdates')
    }

    function getSingleUserUpdates(user) {
        var msg = 'Looking for updates from ' + user.name;
        var delay = 4000;

        Notification.show({
            message: msg,
            hideDelay: delay
        });

        socketFactory.emit('request:SingleUserUpdates', user);
    }



    // function get

    //broad cast updates to users that follow
    function broadcastUpdates(data) {
        console.log('broadcastUpdates');
        console.log('Emiting : broadcast:Updates');
        socketFactory.emit('broadcast:Updates', data);
    }

    function initListeners() {

        //hand shake
        socketFactory.on('request:SocketType', function(data) {
            console.log("Heard 'request:SocketType' in appService.data:", data);

            var msg = 'server requesting socket type... ';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            var socketData = {
                type: 'local-client',
                socketId: data.socketId
            };

            socketFactory.emit('return:SocketType', socketData);

        });

        //handshake success
        socketFactory.on('notify:server-connection', function(data) {
            console.log("Heard 'notify:server-connection' in appFactory.data:", data);

            var msg = 'connected to local server';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

        });

        //any time external client this should be heard
        socketFactory.on('send:updatedUserList', function(data) {
            console.log('Heard : send:updatedUserList in app.service', data.connections);

            var msg = 'Users online: ' + data.connections.length;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            console.log('$broadcast : update:networkUsers');

            checkForUpdates(data.connections);

            $rootScope.$broadcast('update:networkUsers', {connections: data.connections})

        });

        //When external-client connects to network
        // socketFactory.on('local-client:send:externalUserList', function(data) {
        //     console.log('Heard : local-client:send:externalUserList in app.service', data);
        //
        //     var msg = 'Users online: ' + data.length;
        //     var delay = 3000;
        //
        //     Notification.show({
        //         message: msg,
        //         hideDelay: delay
        //     });
        //
        //     console.log('$broadcast : update:networkUsers');
        //     $rootScope.$broadcast('update:networkUsers', data)
        // });

        //when external-client disconnects
        socketFactory.on('userDisconnected', function(data) {
            console.log('$broadcast : update:networkUsers:disconnect');
            $rootScope.$broadcast('update:networkUsers:disconnect', data)
        });


        //when external-client makes changes
        socketFactory.on('notify:externalChanges', function(data) {
            console.log('Heard : notify:externalChanges in app.service', data);
            var msg = 'Data synced with ' + data.connection._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            console.log('$broadCast event update:connection');
            $rootScope.$broadcast('update:connection', data.connection);
            console.log('$broadCast event update:externalData');
            $rootScope.$broadcast('update:externalData', data);
        });


        socketFactory.on('update:external-client', function(data) {
            console.log("Heard : update:external-client in app.service");

            var msg = 'User ' + data.createdBy._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            console.log('$broadCast event update:externalData');
            $rootScope.$broadcast('update:externalData', {updatedData: data});
        });


        //Get all following user updates
        //Get single user updates





        // socketFactory.on('newParticipant', function(userObj) {
        //     console.log("Heard 'newParticipant' in appFactory:", userObj);
        //     services.data.users.push(userObj);
        // });
        //
        // socketFactory.on('dishAdded', function(dish) {
        //     console.log("Heard 'dishAdded' in appFactory.data:", dish);
        //     addDish(dish);
        // });
        //
        // socketFactory.on('dishShared', function(data) {
        //     console.log("Heard 'dishShared' in appFactory.data:", data);
        //     shareDish(data.dish_id, data.user_id, data.firstShare);
        // });
        //
        // socketFactory.on('dishUnshared', function(data) {
        //     console.log("Heard 'dishUnshared' in appFactory.data:", data);
        //     unshareDish(data.dish_id, data.user_id);
        // });
        //
        // socketFactory.on('billsSentToGuests', function(data) {
        //     console.log("Heard 'billsSentToGuests' in appFactory.data:", data);
        //     services.data.billData = data;
        //     $rootScope.$broadcast('billsSentToGuests');
        // });


        function checkForUpdates(connections) {
            connections.forEach(function(connection) {
                if (connection.online && connection.following) {
                    socketFactory.emit('get:singleUserUpdates')
                }
            })
        }

        var last = {
            bottom: false,
            top: true,
            left: false,
            right: true
        };

        var toastPosition = angular.extend({},last);

        function sanitizePosition() {
            var current = toastPosition;

            if ( current.bottom && last.top ) current.top = false;
            if ( current.top && last.bottom ) current.bottom = false;
            if ( current.right && last.left ) current.left = false;
            if ( current.left && last.right ) current.right = false;

            last = angular.extend({},current);
        }
        var getToastPosition = function() {
            sanitizePosition();

            return Object.keys(toastPosition)
                .filter(function(pos) { return toastPosition[pos]; })
                .join(' ');
        };

    }
}