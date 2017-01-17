'use strict';

angular.module('glossa')
    .factory('markdownSrvc', markdownSrvc);

function markdownSrvc($stateParams, $q, $http) {

    var service = {
        getFiles: getFiles,
        updateFile: updateFile,
        removeFile: removeFile,
        createFile: createFile
    };
    return service;

    function getFiles(corpus) {
        return $http.get('/api/transcription/corpus/' + corpus)
            .then(function successCallback(response) {
                console.log('response', response);
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function updateFile(file) {
        return $http.put('/api/transcription/' + file._id, file)
            .then(function successCallback(response) {
                console.log('response', response);
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function removeFile() {

    }

    function createFile(file) {
        console.log('createFile');
        return $http.post('/api/transcription', file)
            .then(function successCallback(response) {
                console.log('response', response);
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

}