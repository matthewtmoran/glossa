'use strict';

angular.module('glossa')
    .factory('SettingsService', SettingsService);

function SettingsService($http) {
    var service = {
        getSettings: getSettings,
        saveSettings: saveSettings,
        getProject: getProject,
        updateProject: updateProject
    };
    return service;


    function getSettings() {
        return $http.get('/api/settings/')
            .then(function successCallback(response) {
                return response.data[0];
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function saveSettings(settings) {
        return $http.put('/api/settings/' + settings._id, settings)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function getProject() {
        return $http.get('/api/project/')
            .then(function successCallback(response) {
                return response.data[0];
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function updateProject(project) {
        return $http.put('/api/project/' + project._id, project)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }



}