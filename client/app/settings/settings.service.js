'use strict';
//TODO: refractor into project service or maybe jsut move to AppService
angular.module('glossa')
    .factory('SettingsService', SettingsService);

function SettingsService($http, __user) {
    var service = {
        getProject: getProject,
        updateProject: updateProject,
        exportProject: exportProject
    };
    return service;

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

    function exportProject(project) {
        return $http.get('/api/project/'+ project.createdBy +'/' + project._id + '/export')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

}