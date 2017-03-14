angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http, socketFactory, $rootScope, $mdToast, Notification, __user) {
    var service = {

        //socket functions
        initListeners: initListeners,
        getOnlineUsersSE: getOnlineUsersSE,
        getUserUpdates: getUserUpdates,
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
        socketFactory.emit('update:userConnection', update);


        // __user.connections.forEach(function(connection, index) {
        //     if (connection._id === update._id) {
        //         __user.connections[index] = update;
        //         socketFactory.emit('update:userConnections', angular.toJson(__user.connections));
        //     }
        // })
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

    function getUserUpdates() {
        var msg = 'Looking for updates from clients....';
        var delay = 4000;

        Notification.show({
            message: msg,
            hideDelay: delay
        });

        socketFactory.emit('get:userUpdates')
    }

    function broadcastUpdates(data) {
        console.log('broadcastUpdates');
        socketFactory.emit('broadcast:Updates', data);
    }

    function initListeners() {

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

        socketFactory.on('notify:server-connection', function(data) {
            console.log("Heard 'notify:server-connection' in appFactory.data:", data);

            var msg = 'connected to local server';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

        });

        socketFactory.on('local-client:send:userData', function(data) {
            console.log('this is external client user data', data);

            var msg = (data.name || data._id) + ' is now connected!';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            $rootScope.$broadcast('update:networkUsers', data);


        });


        socketFactory.on('local-client:send:externalUserList', function(data) {
            console.log('local-client:send:externalUserList', data);

            var msg = 'Users online: ' + data.length;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            checkForUpdates(data);



            $rootScope.$broadcast('update:networkUsers', data)
        });

        socketFactory.on('userDisconnected', function(data) {
            $rootScope.$broadcast('update:networkUsers:disconnect', data)
        });

        socketFactory.on('external-client:notify:buttonPressed', function(data) {
            var msg = 'Button has been pressed by user ' + data.userId;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });
        });

        socketFactory.on('notify:externalChanges', function(data) {
            console.log('notify:externalChanges', data);
            var msg = 'Data synced with ' + data.connection._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            $rootScope.$broadcast('update:connection', data.connection);
            $rootScope.$broadcast('update:externalData', data);

        });

        socketFactory.on('update:external-client', function(data) {

            var msg = 'User ' + data.createdBy._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            $rootScope.$broadcast('update:externalData', {updatedData: data});
        });




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


        function checkForUpdates(data) {
            data.forEach(function(connection) {
                if (connection.following) {
                    socketFactory.emit('')
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