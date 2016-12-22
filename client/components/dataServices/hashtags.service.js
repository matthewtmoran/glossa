'use strict';
//node modules
var db = require('../db/database'),
    _ = require('lodash'),
    hashtagsCol = db.hashtags,
    fileCollection = db.uploadedFiles,
    nbCollection = db.notebooks,
    util = require('../client/components/node/file.utils');

angular.module('glossa')
    .factory('hashtagSrvc', hashtagSrvc);


function hashtagSrvc(dbSrvc, $q) {
    var service = {
        searchHastags: searchHastags,
        updateTag: updateTag,
        createHashtag: createHashtag,
        normalizeHashtag: normalizeHashtag,
        get: get,
        removeHashtag: removeHashtag
    };

    return service;
    ///////////////

    function get() {
        return dbSrvc.find(hashtagsCol, {}).then(function(docs) {
            return docs;
        })
    }

    function searchHastags(term) {
        var query = {
            tag:  new RegExp('^' + term + '$', 'i')
        };
        return dbSrvc.find(hashtagsCol, query).then(function(result) {
            return result;
        })
    }

    function updateTag(objectToUpdate) {
        return dbSrvc.basicUpdate(hashtagsCol, objectToUpdate)
    }

    function createHashtag(term) {
        var hashtag = {
            tag: term,
        };

        hashtag.tagColor = '#4285f4';
        hashtag.realTitle = hashtag.tag;
        hashtag.canEdit = true;
        hashtag.createdAt = Date.now();

        return dbSrvc.insert(hashtagsCol, hashtag).then(function(res) {
            return res.data;
        });
    }

    function normalizeHashtag(tag) {

        var promises = [];

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

        promises.push(filePromise);
        promises.push(notebookPromise);

        return $q.all(promises).then(function(result) {
            return result;
        });

    }

    function removeHashtag(tag) {
        var promises = [];

        promises.push(dbSrvc.remove(hashtagsCol, tag._id));

        return dbSrvc.find(nbCollection, {"hashtags._id": tag._id}).then(function(result) {

            var re = new RegExp('#'+ tag.tag, "gi");
            result.data.forEach(function(nb, i) {

                var test = re.test(nb.description);
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

                promises.push(dbSrvc.basicUpdate(nbCollection, nb));

            });


            return $q.all(promises).then(function(result) {
                return result;
            });

        })
    }
}