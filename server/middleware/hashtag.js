'use strict';

var Hashtag = require('../api/hashtag/hashtag.model');


module.exports = {
    parse: function (req, res, next) {
        var tags = req.body.hashtags;
        tags.forEach(function(tag) {


            // Hashtag.


            console.log('tag', tag);
        });
        next();
    }
};
