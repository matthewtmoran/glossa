var db = require('./db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    hashtags = db.hashtags,
    jsonData = require('./db/data/OCM.json');


console.log(typeof jsonData);

console.log('hashtags', jsonData.hashtags);
var inc = 0;

jsonData.hashtags.forEach(function(dat) {
        dat.tag = dat.tag.substr(1);
        console.log('dat.tag', dat.tag);
        dat.canEdit = false;




    hashtags.insert(dat, function(err, doc) {
        if (err) {
            console.log('There was an error saving file data to the DB', err);
        } else {
            inc++;
            console.log('File data was saved to the DB', doc);
            console.log('Number: ', inc);
        }
    });
});


