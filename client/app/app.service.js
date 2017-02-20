angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http, socketFactory, $rootScope, $mdToast) {
    var service = {
        getSession: getSession,
        updateSession: updateSession,
        initListeners: initListeners
    };

    // initListeners();
    return service;

    function getSession() {
        return $http.get('/api/session/')
            .then(function successCallback(response) {
                // console.log('Returning Response time:', Date.now());
                // console.log('Session was success.');
                return response.data;
            }, function errorCallback(response) {
                // console.log('Returning Response time:', Date.now());
                console.log('There was an error', response);
                return response.data;
            });
    }

    function updateSession(session) {
        // console.log('Session:', session);
        return $http.put('/api/session/' + session._id, session)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }


    function initListeners() {

        console.log('initListeners triggered');

        socketFactory.on('joined', function(data) {
            console.log("Heard 'joined' in appFactory.data:", data);
            service.data = data;
            // $rootScope.$broadcast('joined');

            var pinTo = getToastPosition();
            var toast = $mdToast.simple()
                .textContent('Socket Heard: joined from corpus.component' + data.socketId)
                .action('Okay')
                .highlightAction(true)
                .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
                .position(pinTo);

            $mdToast.show(toast).then(function(response) {
                if ( response == 'ok' ) {
                    alert('You clicked the \'Okay\' action.');
                }
            });
        });

        socketFactory.on('requestSocketType', function(data) {
            console.log("Heard 'requestSocketType' in appFactory.data:", data);
            var socketData = {
                type: 'client'
            };

            socketFactory.emit('returnSocketType', socketData);

        });

        socketFactory.on('notify:client-server-connection', function(data) {
            console.log("Heard 'notify:client-server-connection' in appFactory.data:", data);


            var pinTo = getToastPosition();
            var toast = $mdToast.simple()
                .textContent('Connection with server complete')
                .action('Okay')
                .highlightAction(true)
                .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
                .position(pinTo);
            $mdToast.show(toast);

            // $rootScope.$broadcast('local:server-connection');

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