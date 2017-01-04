'use strict';

angular.module('glossa')
    .factory('notebookSrvc', notebookSrvc);

function notebookSrvc($http, $q, simpleParse) {

    var service = {
        getNotebooks: getNotebooks,
        findNoteBook: findNoteBook,
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
     * TODO: refractor to take an query as argument
     */
    function findNoteBook(nbId) {
        // var query = {
        //     _id: nbId
        // };
        //
        // return dbSrvc.find(nbCollection, query).then(function(result) {
        //     return result;
        // }).catch(function(err) {
        //     console.log('there was en error finding notebook', err);
        // })

        return $http.get('/api/notebook/' + nbId)
            .success(function(response) {
                return response.data;
            })
            .error(function(response) {
                console.log('There was an error ', response);
                return response.data;
            });
    }

    function findAny(query) {
        // return dbSrvc.find(nbCollection, query).then(function(result) {
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

       return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {

           return $http.post('/api/notebook', notebook)
               .then(function successCallback(response) {
                   return response.data;
               }, function errorCallback(response) {
                   console.log('There was an error', response);
                   return response.data;
               });

        });
    }

    /**
     * Updates an existing notebook
     * @param notebook
     * @returns {*}
     */
    function updateNotebook(notebook) {

        return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {

            return $http.put('/api/notebook/' + notebook._id, notebook)
                .then(function successCallback(response) {
                    return response.data;
                }, function errorCallback(response) {
                    console.log('There was an error', response);
                    return response.data;
                });

        });
    }
}

