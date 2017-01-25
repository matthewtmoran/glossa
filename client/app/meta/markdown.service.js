'use strict';

angular.module('glossa')
    .factory('markdownSrvc', markdownSrvc);

function markdownSrvc($http, Upload) {

    var service = {
        getFiles: getFiles,
        updateFile: updateFile,
        removeFile: removeFile,
        createFile: createFile,
        attachNotebook: attachNotebook
    };
    return service;

    //get all md files
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

    //update md file
    function updateFile(file) {
        var options = {
            url:'/api/transcription/' + file._id,
            method: 'PUT'
        };

        return uploadReq(file, options).then(function(data) {
            return data;
        });
    }

    //remove md file
    function removeFile(file) {
        return $http.delete('/api/transcription/' + file._id)
            .then(function successCallback(response) {
                console.log('response', response);
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //create new md file
    function createFile(file) {
        return $http.post('/api/transcription', file)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //attach notebook to object and return
    function attachNotebook(file, notebook) {
        if (!file.attachment) {
            file.attachment = {};
        }
        file.attachment.notebookId = notebook._id;
        file.attachment.type = 'notebook';
        return {file: file, notebook: notebook};
    }


    ///////////
    //helpers//
    ///////////


    //ng-upload request
    function uploadReq(dataObj, options) {
        var files = [];
        for (var key in dataObj.media) {
            if (dataObj.media.hasOwnProperty(key)) {
                if (dataObj.media[key]) {
                    files.push(dataObj.media[key]);
                    // delete dataObj.media[key];
                }
            }
        }

        return Upload.upload({
            method: options.method,
            url: options.url,
            data: {
                files: files,
                dataObj: angular.toJson(dataObj)
            },
            arrayKey: '',
            headers: { 'Content-Type': undefined }
        }).then(function successCallback(response) {
            return response.data;

        }, function errorCallback(response){
            console.log('Error with upload', response);
            return response.data;
        });
    }
}