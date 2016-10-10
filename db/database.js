var Datastore = require('nedb'),
    fs = require('fs');

var uploadedFiles = new Datastore({filename: './db/data/files', autoload: true});

// guitars.ensureIndex({fieldName: 'id', unique: true});

/*
    category: String,
    isLinked: Boolean,
    name: String,
    path: String,
    type: String,
    link: {
        category: String,
        name: String,
        path: String,
        type: String,
    }



 */

module.exports = {
    uploadedFiles: uploadedFiles
};