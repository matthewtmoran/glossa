'use strict';
//
// var fs = require('fs'),
//     path = require('path'),
//     _ = require('lodash'),
//     MDRootPath = remote.getGlobal('userPaths').static.markdown;

angular.module('glossa')
    .factory('baselineSrvc', baselineSrvc);

function baselineSrvc($http) {

    var service = {
        updateContent: updateContent
    };
    return service;


    function updateContent(currentFile) {
    //    write to file system new changes
        return $http.put('/api/transcription/corpus/' + currentFile._id, currentFile)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });

    }
}