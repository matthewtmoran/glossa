'use strict';

angular.module('glossa')
    .factory('notebookSrvc', notebookSrvc);

function notebookSrvc($http, $q, simpleParse, hashtagSrvc, Upload) {

    var service = {
        getNotebooks: getNotebooks,
        findNoteBook: findNotebook,
        updateNotebook: updateNotebook,
        createNotebook: createNotebook,
        findAny: findAny
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
     * TODO: refracter to take query/parameters as argument
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

    function findAny(query) {
        // return d` bS rvc.find(nbCollection, query).then(function(result) {
        //     return result;
        // }).catch(function(err) {
        //     console.log('there was en error finding notebook', err);
        // })
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
        notebook = simpleParse.parseNotebook(notebook);

        //store promises
        var promises = [];
        notebook.hashtags.forEach(function(tag, index) {
            //push this query to promises array
            promises.push(hashtagSrvc.termQuery(tag).then(function(data) {
                //update the notebook model property
                notebook.hashtags[index] = data;
                return data;
            }))
        });

       // once all promises have resolved save notebook
        return $q.all(promises)
            .then(function(response) {
                var options = {
                    url:'/api/notebook/',
                    method: 'POST'
                }
                return uploadReq(notebook, options)
                    .then(function successCallback(data) {
                        console.log('successCallback data:', data);
                        return data;
                    }, function errorCallback(data) {
                        console.log('There was an error', data);
                        return data;
                    });

            })
            .catch(function(response) {
                console.log('There was an error with the promises', response);
                return response.data;
            });
    }

    /**
     * Updates an existing notebook
     * @param notebook
     * @returns {*}
     */
    function updateNotebook(notebook) {
        notebook = simpleParse.parseNotebook(notebook);
        //store promises
        var promises = [];

        notebook.hashtags.forEach(function(tag, index) {
            //push this query to promises array
            promises.push(hashtagSrvc.termQuery(tag).then(function(data) {
                //update the notebook model property
                notebook.hashtags[index] = data;
                return data;
            }))
        });

        // once all promises have resolved save notebook
        return $q.all(promises)
            .then(function(response) {
                var options = {
                    url:'/api/notebook/' + notebook._id,
                    method: 'PUT'
                };
                return uploadReq(notebook, options)
                    .then(function successCallback(data) {
                            console.log('successCallback data:', data);
                            return data;
                        }, function errorCallback(data) {
                            console.log('There was an error', data);
                            return data;
                        });
            })
            .catch(function(response) {
                console.log('There was an error with the promises', response);
                return response.data;
            });
    }

    function uploadReq(notebook, options) {
        var files = [];
        for (var key in notebook.media) {
            if (notebook.media.hasOwnProperty(key)) {
                if (notebook.media[key]) {
                    files.push(notebook.media[key])
                    delete notebook.media[key];
                }
            }
        }

        return Upload.upload({
            method: options.method,
            url: options.url,
            data: {
                files: files,
                notebook: angular.toJson(notebook)
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

