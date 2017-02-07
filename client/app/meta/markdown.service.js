'use strict';

angular.module('glossa')
    .factory('markdownSrvc', markdownSrvc);

function markdownSrvc($http, Upload, $stateParams) {

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
    function createFile(name) {

        var session = JSON.parse(localStorage.getItem('session'));

        var file = {
            displayName: name || 'untitled',
            description: '',
            content: '',
            corpus: $stateParams.corpus,
            createdAt: Date.now(),
            createdBy: session.userId,
            projectId: session.projectId
        };

        return $http.post('/api/transcription', file)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //attach notebooks to object and return
    function attachNotebook(file, notebook) {

        file.notebookId = notebook._id;

        return {file: file, notebook: notebook};
    }


    ///////////
    //helpers//
    ///////////


    //ng-upload request
    function uploadReq(dataObj, options) {
        var files = [];

        if (dataObj.image) {
            files.push(dataObj.image);
        }

        if (dataObj.audio) {
            files.push(dataObj.audio);
        }
        //
        // for (var key in dataObj.media) {
        //     if (dataObj.media.hasOwnProperty(key)) {
        //         if (dataObj.media[key]) {
        //             files.push(dataObj.media[key]);
        //             // delete dataObj.media[key];
        //         }
        //     }
        // }

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