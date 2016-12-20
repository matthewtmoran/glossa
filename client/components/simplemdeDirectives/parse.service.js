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
            console.log('this should be an array of all the hashtag objects', re);

            notebook.hashtags = [];

            re.forEach(function(d) {
                notebook.hashtags.push(d);
            });

            console.log('notebook after tags are inserted', notebook);

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

        //here we have parsed the description text into an array of tags
        //check for these values among hashtags in the db
        //if they do not exist create one and push to array

        console.log('amount of tags:', newMatches.length);

        var hashtagObjects = getHashtagObject(newMatches);
        console.log('hashtagObjects', hashtagObjects);


       return hashtagObjects;

      // return $q.when(getHashtagObject(newMatches).then(function(result) {
      //     return result;
      //   }));

    }

    function getHashtagObject(tags) {
        console.log('getHashtagObject param:', tags);
        var promises = [];

        //for each tag
        tags.forEach(function(tag) {
            //query db for tag
            promises.push(hashtagSrvc.searchHastags(tag).then(function(result) {
                console.log('result from search of hashtag', result);
                //if the tag returns but is undefined it does not exist
                if (!result.data.length) {
                    console.log('this tag does not exist');
                    var createTagVar = hashtagSrvc.createHashtag(tag);
                    console.log('createTagVar', createTagVar);
                    return createTagVar;
                } else {
                    console.log('this tag does exist');
                    //otherwise, there is a result that is defined so just push it to the array
                    return $q.when(result.data[0]);
                  // return result;
                }
            }))
        });

       return $q.all(promises).then(function(result) {
            console.log('result from promise $.all', result);
            return result;
        });

       // $q.all(promises).then(function(result, res2) {
       //      console.log('promise result', result);
       //      console.log('promise result', res2);
       //      return result;
       //  }).then(function(res) {
       //      console.log('res', res);
       //  });
    }

}