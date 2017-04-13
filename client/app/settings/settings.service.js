'use strict';
//TODO: refractor into project service or maybe jsut move to AppService
angular.module('glossa')
    .factory('SettingsService', SettingsService);

function SettingsService($http, $window, $q) {
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

        return $http.post('/api/project/'+ project.createdBy +'/' + project._id + '/export', {}, {
            responseType: "arraybuffer",
            cache: false,
            headers: {
                'Content-Type': 'application/zip; charset=utf-8',
                'Accept': 'application/zip'
            }
        }).then(function successCallback(response) {

                var blob = new Blob([response.data], {type: 'application/zip'});
                var fileName = getFileNameFromHttpResponse(response);
                var url = $window.URL.createObjectURL(blob);

                var downloadLink = angular.element('<a></a>');
                downloadLink.attr('href', url);
                downloadLink.attr('download', fileName);
                downloadLink[0].click();

                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    function getFileNameFromHttpResponse(httpResponse) {
        var contentDispositionHeader = httpResponse.headers('Content-Disposition');
        var result = contentDispositionHeader.split(';')[1].trim().split('=')[1];
        return result.replace(/"/g, '');
    }

}