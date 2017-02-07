'use strict';

angular.module('glossa')
    .factory('UserService', UserService);

function UserService($http) {

    var service = {
        getUser: getUser
    };
    return service;

    function getUser(userId) {
        return $http.get('/api/user/' + userId)
            .then(function successCallback(response) {
                console.log('response', response);
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

}