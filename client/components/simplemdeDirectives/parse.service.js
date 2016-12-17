'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse(hashtagSrvc, $q) {
    var service = {
        parseNotebook: parseNotebook
    };
    return service;


    function parseNotebook(notebook) {
        notebook.name = parseTitle(notebook.description);

        return $q.when(findHashtags(notebook.description)).then(function(re) {
            notebook.hashtags = re;
            return notebook;
        });
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

      return $q.when(getHashtagObject(newMatches).then(function(result) {
          return result;
        }));

    }

    function getHashtagObject(tags) {
        var deferred = $q.defer();
        var hashtagObject = [];
        //for each tag
        tags.forEach(function(tag) {
            //query db for tag
            hashtagSrvc.searchHastags(tag).then(function(result) {
                if (!result.success) {
                    deferred.reject(result)
                ;}
                //if the tag returns but is undefined it does not exist
                if (!result.data.length) {
                    //create new tag
                   return hashtagSrvc.createHashtag(tag).then(function(result) {
                        //push result of newly created tag to db
                        // hashtagObject.push(result.data[0]);
                       return result;
                    })
                } else {
                    //otherwise, there is a result that is defined so just push it to the array
                  return result;
                  // hashtagObject.push(result.data[0]);
                }
            }).then(function(res) {
                hashtagObject.push(res.data[0]);
                deferred.resolve(hashtagObject);
            }).catch(function(err) {
                console.log('there is an error', err);
            })
        });
        return deferred.promise;
        // return hashtagObject;
    }

}