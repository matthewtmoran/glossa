angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http, $rootScope, $mdToast, spacebroFactory) {
    var service = {
        getSession: getSession,
        updateSession: updateSession,
        initListeners: initListeners,
        getUserList: getUserList
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

    function getUserList() {
        socketFactory.emit('get:networkUsers')
    }


    function initListeners() {

        spacebroFactory.on('hello', function (data) {
            console.log('received hello', data)
        });

        setTimeout(function() { spacebroFactory.emit('hello', 'world') }, 3000);
        setTimeout(function() { spacebroFactory.emit('hello', {world: 'hello'}) }, 5000);
        setTimeout(function() { spacebroFactory.off('hello') }, 6000);
        setTimeout(function() { spacebroFactory.emit('hello') }, 7000);

        spacebroFactory.on('new-member', function(data){
            console.log(data.member + ' has joined.');
        });

        // socketFactory.on('joined', function(data) {
        //     console.log("Heard 'joined' in appFactory.data:", data);
        //     service.data = data;
        //     // $rootScope.$broadcast('joined');
        //
        //     var msg = 'Socket Heard: joined from corpus.component' + data.socketId;
        //     var delay = 8;
        //
        //     Notification.show({
        //         message: msg,
        //         hideDelay: delay
        //     });
        //
        //     // var pinTo = getToastPosition();
        //     // var toast = $mdToast.simple()
        //     //     .textContent('Socket Heard: joined from corpus.component' + data.socketId)
        //     //     .action('Okay')
        //     //     .highlightAction(true)
        //     //     .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
        //     //     .position(pinTo);
        //     //
        //     // $mdToast.show(toast).then(function(response) {
        //     //     if ( response == 'ok' ) {
        //     //         alert('You clicked the \'Okay\' action.');
        //     //     }
        //     // });
        // });
        //
        // socketFactory.on('request:SocketType', function(data) {
        //     console.log("Heard 'request:SocketType' in appService.data:", data);
        //
        //     var msg = 'server requesting socket type... ';
        //     var delay = 3000;
        //
        //     Notification.show({
        //         message: msg,
        //         hideDelay: delay
        //     });
        //
        //     var socketData = {
        //         type: 'local-client',
        //         socketId: data.socketId
        //     };
        //
        //     socketFactory.emit('return:SocketType', socketData);
        //
        // });
        //
        // socketFactory.on('notify:server-connection', function(data) {
        //     console.log("Heard 'notify:server-connection' in appFactory.data:", data);
        //
        //     var msg = 'connected to local server';
        //     var delay = 3000;
        //
        //     Notification.show({
        //         message: msg,
        //         hideDelay: delay
        //     });
        //
        //
        //     // $rootScope.$broadcast('local:server-connection');
        //
        // });
        //
        // socketFactory.on('local-client:send:userData', function(data) {
        //     console.log('this is external client user data', data);
        //
        //     var msg = (data.name || data._id) + ' is now connected!';
        //     var delay = 3000;
        //
        //     Notification.show({
        //         message: msg,
        //         hideDelay: delay
        //     });
        //
        //     $rootScope.$broadcast('update:networkUsers', data);
        //
        //
        // });
        //
        //
        // socketFactory.on('local-client:send:externalUserList', function(data) {
        //     console.log('local-client:send:externalUserList', data);
        //     $rootScope.$broadcast('update:networkUsers', data)
        // });
        //
        // socketFactory.on('userDisconnected', function(data) {
        //     $rootScope.$broadcast('update:networkUsers:disconnect', data)
        // });


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