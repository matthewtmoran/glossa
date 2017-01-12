'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse(hashtagSrvc, $q) {
    var service = {
        title: title,
        hashtags: hashtags
    };
    return service;

    function title(notebook) {
        if (notebook.postType === 'normal') {
            notebook.name = extractTitle(notebook.description);
        } else if (notebook.postType === 'image') {
            notebook.name = notebook.media.image.originalname;
        } else if (notebook.postType === 'audio') {
            notebook.name = notebook.media.audio.originalname;
        }
        return notebook.name;
    }
    //Parses the title or return first 16 characters of text
    function extractTitle(text) {
       var heading = /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/;

       if (heading.test(text)) {
           return text.match(heading)[0];
       } else {
           return text.slice(0, 16);
       }
    }

    function extractHashtagText(text) {
        var hashtags = [];
        var hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
        if (hashReg.test(text)) {
            hashtags = text.match(hashReg).map(function (tag) {
                return tag.trim().substr(1);
            });
            return hashtags
        }
    }

    function hashtags(notebook) {
        var tagsInText = extractHashtagText(notebook.description) || [];
        var removedTags = [];
        if (!notebook.hashtags) {
            notebook.hashtags = [];
        }

        //verify old tags exist in text still...
        notebook.hashtags.forEach(function(tag, index) {

            if (tagsInText.indexOf(tag.tag) < 0) {
                //add to removed tags
                removedTags.push(tag);
                //remove from hashtags array
                notebook.hashtags.splice(index, 1);
            }
            tagsInText.splice(tagsInText.indexOf(tag.tag), 1)
        });


        removedTags.forEach(function(tag) {
            hashtagSrvc.decreaseTagCount(tag);
        });

        return queryForNewTags(tagsInText).then(function(data) {
            data.forEach(function(tag) {
                notebook.hashtags.push(tag);
            });
            return notebook.hashtags;
        });
    }

    function queryForNewTags(newtags) {
        var promises = [];
        newtags.forEach(function(tag, index) {
            //push this query to promises array
            promises.push(hashtagSrvc.termQuery(tag).then(function(data) {
                //update the notebook model property
                newtags[index] = data;
                return data;
            }))
        });
        return $q.all(promises).then(function(data) {
            return data;
        });
    }
}