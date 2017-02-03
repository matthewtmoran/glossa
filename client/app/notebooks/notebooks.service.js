'use strict';

angular.module('glossa')
    .factory('notebookSrvc', notebookSrvc);

function notebookSrvc($http, $q, simpleParse, Upload) {

    var service = {
        getNotebooks: getNotebooks,
        findNotebook: findNotebook,
        createNotebook: createNotebook,
        updateNotebook: updateNotebook
    };

    return service;
    ///////////////

    /**
     * Queries all the notebooks and returns results
     */
    function getNotebooks() {
        return $http.get('/api/notebooks')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Finds specific notebooks
     * @param nbId
     * @returns {*}
     */
    function findNotebook(nbId) {
        return $http.get('/api/notebooks/' + nbId)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Saves a new notebooks
     * @param notebook
     * @returns {*}
     */
    function createNotebook(notebook) {

        console.log('notebooks parameter in createNotebook ', notebook);

        notebook.name = simpleParse.title(notebook);
        notebook.createdAt = Date.now();
        notebook.createdBy = 111;
        notebook.projectId = 1;

       return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                     url:'/api/notebooks/',
                     method: 'POST'
                 };
                return uploadReq(notebook, options).then(function(data) {
                    return data;
                })
            });
    }

    /**
     * Updates an existing notebooks
     * @param notebook
     * @returns {*}
     */
    function updateNotebook(notebook) {
        //parse name of notebooks in case it was changed...
        notebook.name = simpleParse.title(notebook);

        //parse hashtags in description
        return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                    url:'/api/notebooks/' + notebook._id,
                    method: 'PUT'
                };
                return uploadReq(notebook, options).then(function(data) {
                    return data;
                })
            });
    }


    //////////
    //helper//
    //////////


    //ng-upload request
    function uploadReq(dataObj, options) {
        var files = [];



        // for (var key in dataObj.media) {
        //     if (dataObj.media.hasOwnProperty(key)) {
        //         if (dataObj.media[key]) {
        //             files.push(dataObj.media[key])
        //             delete dataObj.media[key];
        //         }
        //     }
        // }

        if (dataObj.image) {
            files.push(dataObj.image);
        }

        if (dataObj.audio) {
            files.push(dataObj.audio);
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

