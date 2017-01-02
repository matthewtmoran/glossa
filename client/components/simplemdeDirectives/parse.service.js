'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse(hashtagSrvc, $q) {
    var service = {
        parseNotebook: parseNotebook,
        findHashtags: findHashtags
    };
    return service;


    function parseNotebook(notebook) {
        var textArea;

        if (notebook.postType === 'normal') {
            textArea = notebook.description;
            notebook.name = parseTitle(notebook.description);
        } else if (notebook.postType === 'image') {
            textArea = notebook.media.image.caption || '';
            notebook.name = notebook.media.image.name;
        } else if (notebook.postType === 'audio') {
            textArea = notebook.media.audio.caption || '';
            notebook.name = notebook.media.audio.name;
        }

        return $q.when(findHashtags(textArea)).then(function(re) {

            notebook.hashtags = [];

            re.forEach(function(d) {
                notebook.hashtags.push(d);
            });

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

        return getHashtagObject(newMatches);

    }

    function getHashtagObject(tags) {
        var promises = [];

        //for each tag
        tags.forEach(function(tag) {
            //query db for tag
            promises.push(hashtagSrvc.termQuery(tag).then(function(result) {
                //if the tag returns but is undefined it does not exist
                if (!result.data.length) {
                    return hashtagSrvc.save(tag);
                } else {
                    //otherwise, there is a result that is defined so just push it to the array
                    return $q.when(result.data[0]);
                  // return result;
                }
            }))
        });

       return $q.all(promises).then(function(result) {
            return result;
        });
    }

}