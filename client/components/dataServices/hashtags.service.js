'use strict';
//node modules
var db = require('../db/database'),
    _ = require('lodash'),
    hashtagsCol = db.hashtags,
    util = require('../client/components/node/file.utils');

angular.module('glossa')
    .factory('hashtagSrvc', hashtagSrvc);


function hashtagSrvc(dbSrvc) {
    var service = {
        searchHastags: searchHastags,
        findHashtag: findHashtag,
        createHashtag: createHashtag,
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
        return dbSrvc.find(hashtagsCol, query).then(function(docs) {
            return docs;
        })
    }

    function findHashtag() {

    }

    function createHashtag() {

    }

}