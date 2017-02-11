'use strict';

angular.module('glossa')
    .factory('manageCorpusSrvc', manageCorpusSrvc);

function manageCorpusSrvc($http) {
    var service = {
        getCorporia: getCorporia,
        createCorpus: createCorpus
    };

    return service;

    function createCorpus(corpus) {
        return $http.post('/api/corporia', corpus)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }


    function getCorporia() {
        return $http.get('/api/corporia')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

}