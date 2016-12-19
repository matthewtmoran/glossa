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
        get: get
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
            tag:  new RegExp(term, 'i')
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

        return dbSrvc.insert(hashtagsCol, hashtag).then(function(doc) {
            return doc;
        })
    }

    //trying to normalize hashtags accross notebookes right now


    function normalizeHashtag(tag) {
        console.log('normalizeHashtag tag:', tag)
        $q.when(dbSrvc.find(nbCollection, {"hashtags._id": tag._id}, function(err, result) {
           if (err) {return console.log('There was an error')}

           console.log('result 1', result);
        })).then(function(result) {
            console.log('result2', result);

            result.data.forEach(function(nb, i) {

                nb.hashtags.forEach(function(t, index) {
                    if (t._id === tag._id) {
                        nb.hashtags[index] = tag;
                    }
                });

                $q.when(dbSrvc.basicUpdate(nbCollection, nb, function(err, result) {
                    console.log('result3', result);

                })).then(function(res) {
                    console.log('result 4', res);
                    result.data[i] = res;
                });
            });

            console.log('returning result', result);
           return result;
        });
            // nbCollection
    }

    function saveNoramlized(db, item) {

    }

}