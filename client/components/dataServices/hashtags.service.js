'use strict';
//node modules
var db = require('../db/database'),
    _ = require('lodash'),
    hashtagsCol = db.hashtags,
    fileCollection = db.transMarkdown,
    nbCollection = db.notebooks,
    util = require('../client/components/node/file.utils');

angular.module('glossa')
    .factory('hashtagSrvc', hashtagSrvc);


function hashtagSrvc(dbSrvc, $q) {
    var service = {
        query: query,
        termQuery: termQuery,
        update: update,
        save: save,
        normalizeHashtag: normalizeHashtag,
        removeHashtag: removeHashtag
    };

    return service;
    ///////////////

    /**
     * Queries all hashtags
     */
    function query() {
        return dbSrvc.termQuery(hashtagsCol, {}).then(function(docs) {
            return docs;
        })
    }

    /**
     * Searches by term
     * @param term
     */
    function termQuery(term) {
        var query = {
            tag:  new RegExp('^' + term + '$', 'i')
        };
        return dbSrvc.find(hashtagsCol, query).then(function(result) {
            return result;
        })
    }

    /**
     * Update Existing tag
     * @param objectToUpdate
     * @returns {*}
     */
    function update(objectToUpdate) {
        return dbSrvc.basicUpdate(hashtagsCol, objectToUpdate)
    }

    /**
     * Save new term as hashtag
     * @param term
     */
    function save(term) {
        var hashtag = {
            tag: term
        };

        hashtag.tagColor = '#4285f4';
        hashtag.realTitle = hashtag.tag;
        hashtag.canEdit = true;
        hashtag.createdAt = Date.now();

        return dbSrvc.insert(hashtagsCol, hashtag).then(function(res) {
            return res.data;
        });
    }

    /**
     * Normalizes hashtags accross application
     * @param tag
     */
    function normalizeHashtag(tag) {
        //store pormises
        var promises = [];

        //Save transcription file promise
        var filePromise = dbSrvc.find(fileCollection, {"hashtags._id": tag._id}).then(function(result) {

            result.data.forEach(function(file, i) {
                //Modify the data
                file.hashtags.forEach(function(t, index) {
                    if (t._id === tag._id) {
                        file.hashtags[index] = tag;
                    }
                });
               return dbSrvc.basicUpdate(fileCollection, file);
            });
        });

       var notebookPromise = dbSrvc.find(nbCollection, {"hashtags._id": tag._id}).then(function(result) {

            result.data.forEach(function(nb, i) {

                //Modify the data
                nb.hashtags.forEach(function(t, index) {
                    if (t._id === tag._id) {
                        nb.hashtags[index] = tag;
                    }
                });
                return dbSrvc.basicUpdate(nbCollection, nb);
            });
        });

        //push promises to promise array
        promises.push(filePromise);
        promises.push(notebookPromise);

        return $q.all(promises).then(function(result) {
            return result;
        });
    }

    /**
     * Removes hashtag
     * Should normalize across application
     * @param tag
     * @returns {*}
     */
    function removeHashtag(tag) {
        var promises = [];

        promises.push(dbSrvc.remove(hashtagsCol, tag._id));

        var notebookPromise = dbSrvc.find(nbCollection, {"hashtags._id": tag._id}).then(function(result) {
            var re = new RegExp('#'+ tag.tag, "gi");
            result.data.forEach(function(nb, i) {
                //remove the # character from instances
                nb.description = nb.description.replace(re, tag.tag);
                //Modify the data
                nb.hashtags.forEach(function(t, index) {
                    if (t._id === tag._id) {
                        delete nb.hashtags[index];
                        if (!nb.hashtags.length || !nb.hashtags) {
                            delete nb.hashtags;
                        }
                    }
                });
                return dbSrvc.basicUpdate(nbCollection, nb);
            });
        });

        var filePromise = dbSrvc.find(fileCollection, {"hashtags._id": tag._id}).then(function(result) {
            var re = new RegExp('#'+ tag.tag, "gi");
            result.data.forEach(function(file, i) {
                //remove hash characters from instances
                file.description = file.description.replace(re, tag.tag);
                //Modify the data
                file.hashtags.forEach(function(t, index) {
                    if (t._id === tag._id) {
                        delete file.hashtags[index];
                        if (!file.hashtags.length || !file.hashtags) {
                            delete file.hashtags;
                        }
                    }
                });
                return dbSrvc.basicUpdate(fileCollection, file);
            });
        });

        promises.push(filePromise);
        promises.push(notebookPromise);

        return $q.all(promises).then(function(result) {
            return result;
        }).catch(function(err) {
            console.log('Error removing tags', err);
        });
    }
}