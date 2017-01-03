'use strict';
//node modules
// var db = require('./db/database'),
//     nbCollection = db.notebooks;

angular.module('glossa')
    .factory('notebookSrvc', notebookSrvc);

function notebookSrvc(dbSrvc, $q, simpleParse) {

    var service = {
        query: query,
        find: find,
        update: update,
        save: save,
        findAny: findAny
    };

    return service;
    ///////////////

    /**
     * Queries all the notebooks and returns results
     */
    function query() {
        // return dbSrvc.find(nbCollection, {}).then(function(docs) {
        //     return docs;
        // }).catch(function(err) {
        //     console.log('There was an error querying notebooks', err);
        // })
    }

    /**
     * Finds specific notebook
     * @param nbId
     * @returns {*}
     * TODO: refractor to take an query as argument
     */
    function find(nbId) {
        // var query = {
        //     _id: nbId
        // };
        //
        // return dbSrvc.find(nbCollection, query).then(function(result) {
        //     return result;
        // }).catch(function(err) {
        //     console.log('there was en error finding notebook', err);
        // })
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
    function save(notebook) {
       //  notebook.createdBy = 'Moran';
       //  notebook.createdAt = Date.now();
       //  notebook.isAttached = false;
       //  notebook.attachedToId = null;
       //
       // return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {
       //      return dbSrvc.insert(nbCollection, notebook).then(function(result) {
       //          return result;
       //      }).catch(function(err) {
       //          console.log('Error saving notebook', err);
       //      })
       //  });
    }

    /**
     * Updates an existing notebook
     * @param notebook
     * @returns {*}
     */
    function update(notebook) {
        // return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {
        //     return dbSrvc.basicUpdate(nbCollection, notebook).then(function(result) {
        //         return result;
        //     }).catch(function(err) {
        //         console.log('Error updating notebook', err);
        //     });
        // });

    }
}

