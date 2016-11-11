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

function notebookSrvc(dbSrvc) {

    var service = {
        createNotebook: createNotebook,
        queryNotebooks: queryNotebooks,
        findNotebook: findNotebook
    };

    return service;
    ///////////////


    function createNotebook(notebook, callback) {
        notebook.createdBy = 'Moran';
        notebook.createdAt = Date.now();
        notebook.isAttached = false;
        notebook.attachedToId = null;

        //get length of media properties
        var maxLoops = Object.keys(notebook.media).length;
        //iterate through properties
        for(var key in notebook.media) {

            if (notebook.media.hasOwnProperty(key)) {

                //closure to make current key always accessible
                (function(key){
                    //write to this path
                    var writePath = path.join(uploadPathStatic, key, notebook.media[key].name);

                    //call copy and write function; pass in file location, new location, notebook data, and callback
                    util.copyAndWrite(notebook.media[key].absolutePath, writePath, notebook, function(err, to) {
                        if (err) {
                            return console.log('There was an error copying and writing file', err);
                        }
                        //Modify loop length
                        maxLoops--;

                        //create object for database
                        notebook.media[key] = createMediaObject(notebook.media[key], key);

                        //delete absolute path
                        delete notebook.media[key].absolutePath;

                        // if we are are done looping
                        if (!maxLoops) {
                           //save the notebook in the database and call callback
                           return insertInDb(nbCollection, notebook).then(function(result) {
                                return callback(result);
                            });
                        }
                    });
                //    pass the key to make accessible
                })(key);
            }
        }
        if (!maxLoops) {
            // save the notebook in the database and call callback
            return insertInDb(nbCollection, notebook).then(function (result) {
                return callback(result);
            });
        }
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
}

