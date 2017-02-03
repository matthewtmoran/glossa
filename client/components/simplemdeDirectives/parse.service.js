'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse(hashtagSrvc, $q) {
    var service = {
        title: title,
        hashtags: hashtags
    };
    return service;

    //get title
    function title(notebook) {
        if (notebook.postType === 'normal') {
            notebook.name = extractTitle(notebook.description);
        } else if (notebook.postType === 'image') {
            notebook.name = notebook.image.originalname;
        } else if (notebook.postType === 'audio') {
            notebook.name = notebook.audio.originalname;
        }
        return notebook.name;
    }

    //get hashtags
    function hashtags(notebook) {
        //gets the hashtags existing in text
        var tagsInText = extractHashtagText(notebook.description) || [];
        var removedTags = [];
        //if no hashtags exist..
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
            //splice tags in text if it already exists....
            tagsInText.splice(tagsInText.indexOf(tag.tag), 1)
        });

        // removedTags.forEach(function(tag) {
        //     hashtagSrvc.decreaseTagCount(tag);
        // });

        //the rest of the tags here should be tags new to this notebooks...
        return queryForNewTags(tagsInText).then(function(data) {
            data.forEach(function(tag) {
                notebook.hashtags.push(tag);
            });
            return notebook.hashtags;
        });
    }


    ///////////
    //helpers//
    ///////////


    //new tags is an array of tags new to this notebooks;
    function queryForNewTags(tagsInText) {
        var promises = [];
        tagsInText.forEach(function(tag, index) {
            //push this query to promises array
            promises.push(hashtagSrvc.termQuery(tag).then(function(data) {
                //update the notebooks model property
                tagsInText[index] = data;
                return data;
            }))
        });
        return $q.all(promises).then(function(data) {
            return data;
        });
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

    //gets all hashtags in text
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
}