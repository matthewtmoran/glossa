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


        // $q(function(resolve, reject) {
        //     $window.location.assign('/api/project/'+ project.createdBy +'/' + project._id + '/export');
        // });

        // $http.post(url, requestData, {
        //     params: {
        //         queryParam: 'queryParamValue'
        //     },
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Accept': expectedMediaType
        //     }
        // }).then(function (response) {
        //     var filename = (...)
        //     openSaveAsDialog(filename, response.data, expectedMediaType);
        // });

        return $http.post('/api/project/'+ project.createdBy +'/' + project._id + '/export', {}, {
            responseType: "arraybuffer",
            cache: false,
            headers: {
                'Content-Type': 'application/zip; charset=utf-8',
                'Accept': 'application/zip'
            },
            // transformResponse: function (data, headers) {
            //     //The data argument over here is arraybuffer but $http returns response
            //     // as object, thus returning the response as an object with a property holding the
            //     // binary file arraybuffer data
            //     var response = {};
            //     response.data = data;
            //     return response;
            // }
        }).then(function successCallback(response) {
                console.log('response', response);


                var blob = new Blob([response.data], {type: 'application/zip'});
                console.log('blob', blob);
                var fileName = getFileNameFromHttpResponse(response);
                var url = $window.URL.createObjectURL(blob);

                var downloadLink = angular.element('<a></a>');
                downloadLink.attr('href', url);
                downloadLink.attr('download', fileName);
                downloadLink[0].click();

                // var blob = b64toBlob(data, 'application/zip');
                // var fileName = "download.zip";


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