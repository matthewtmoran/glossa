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
        return $http.get('/api/notebook')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Finds specific notebook
     * @param nbId
     * @returns {*}
     */
    function findNotebook(nbId) {
        return $http.get('/api/notebook/' + nbId)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Saves a new notebook
     * @param notebook
     * @returns {*}
     */
    function createNotebook(notebook) {
        notebook.createdBy = 'Moran';
        notebook.createdAt = Date.now();
        notebook.isAttached = false;
        notebook.attachedToId = null;
        notebook.name = simpleParse.title(notebook);
       return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                     url:'/api/notebook/',
                     method: 'POST'
                 };
                return uploadReq(notebook, options).then(function(data) {
                    return data;
                })
            });
    }

    /**
     * Updates an existing notebook
     * @param notebook
     * @returns {*}
     */
    function updateNotebook(notebook) {
        //parse name of notebook in case it was changed...
        notebook.name = simpleParse.title(notebook);

        //parse hashtags in description
        return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                    url:'/api/notebook/' + notebook._id,
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
        for (var key in dataObj.media) {
            if (dataObj.media.hasOwnProperty(key)) {
                if (dataObj.media[key]) {
                    files.push(dataObj.media[key])
                    delete dataObj.media[key];
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

