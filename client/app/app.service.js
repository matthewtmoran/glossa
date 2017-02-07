angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http) {
    var service = {
        getSession: getSession,
        updateSession: updateSession
    };
    return service;

    function getSession() {
        return $http.get('/api/session/')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function updateSession(session) {
        return $http.put('/api/session/' + session._id, session)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }
}