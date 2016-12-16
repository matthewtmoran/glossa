'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse(hashtagSrvc) {
    var service = {
        parseTitle: parseTitle,
        parseNotebook: parseNotebook
    };
    return service;


    function parseNotebook(notebook) {
        notebook.name = parseTitle(notebook.description);
        notebook.hashtags = findHashtags(notebook.description);
        return notebook;
    }

    //Parses the title or return first 16 characters of text
    function parseTitle(text) {
       var heading = /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/;

       if (heading.test(text)) {
           return text.match(heading)[0];
       } else {
           return text.slice(0, 16);
       }
    }

    function findHashtags(text) {
        var matches = [];
        var newMatches = [];
        var hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
        if (hashReg.test(text)) {
            matches = text.match(hashReg);
            newMatches = matches.map(function(tag) {
                return tag.trim().substr(1);
            });
        }
        return getHashtagObject(newMatches);
    }

    function getHashtagObject(tags) {
        var hashtagObject = [];
        //for each tag
        tags.forEach(function(tag) {
            //query db for tag
            hashtagSrvc.searchHastags(tag).then(function(result) {
                if (!result.success) {return console.log(result);}
                //if the tag returns but is undefined it does not exist
                if (!result.data.length) {
                    //create new tag
                    hashtagSrvc.createHashtag(tag).then(function(result) {
                        if (!result.success) { return console.log('there was an error creating tag');}
                        //push result of newly created tag to db
                        hashtagObject.push(result.data);
                    });
                } else {
                    //otherwise, there is a result that is defined so just push it to the array
                    hashtagObject.push(result.data[0]);
                }
            })
        });
        return hashtagObject;
    }

}