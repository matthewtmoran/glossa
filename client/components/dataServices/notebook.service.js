'use strict';
//node modules
var db = require('../db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    nbCollection = db.notebooks,
    uploadPathStatic = path.join(__dirname,'../uploads/'),
    uploadPathRelative = 'uploads/',
    imagesDir = 'uploads/image/',
    audioDir = 'uploads/image/',
    util = require('../client/components/node/file.utils');

angular.module('glossa')
    .factory('notebookSrvc', notebookSrvc);

function notebookSrvc(dbSrvc, $q, simpleParse) {

    var service = {
        createNotebook2: createNotebook2,
        queryNotebooks: queryNotebooks,
        findNotebook: findNotebook,
        update: update,
        save: save
    };

    return service;
    ///////////////



    function createNotebook2 (notebook) {
        console.log('notebookSrvc: createNotebook2');
        console.log('notebook', notebook);

        notebook.createdBy = 'Moran';
        notebook.createdAt = Date.now();
        notebook.isAttached = false;
        notebook.attachedToId = null;

        // return insertInDb(nbCollection, notebook).then(function(result) {
        //     console.log('notebook to database');
        //     return result;
        // });

    }


    function createMediaObject(mediaObj, type) {
        var newMediaObj = {
            name: mediaObj.name,
            path: uploadPathRelative + type + '/' + mediaObj.name,
            extension: mediaObj.extension,
            description: '',
            type: type
        };
        return newMediaObj;
    }

    function queryNotebooks() {
        return dbSrvc.find(nbCollection, {}).then(function(docs) {
            return docs;
        })
    }

    function insertInDb(nbCollection, notebook) {
        return dbSrvc.insert(nbCollection, notebook).then(function(result) {
            return result;
        });
    }

    function findNotebook(nbId) {
        var query = {
            _id: nbId
        };

        return dbSrvc.find(nbCollection, query).then(function(result) {
            return result;
        })
    }

    function save(notebook) {
        notebook.createdBy = 'Moran';
        notebook.createdAt = Date.now();
        notebook.isAttached = false;
        notebook.attachedToId = null;

       return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {
            return dbSrvc.insert(nbCollection, notebook).then(function(result) {
                return result;
            });
        });
    }


    function update(notebook) {
        return $q.when(simpleParse.parseNotebook(notebook)).then(function(result) {
            return dbSrvc.basicUpdate(nbCollection, notebook).then(function(result) {
                return result;
            }).catch(function(result) {
                console.log('There was an error updating notebook', result);
            });
        });

    }

}

