var Datastore = require('nedb'),
    fs = require('fs');

var uploadedFiles = new Datastore({filename: './db/data/files', autoload: true});
var notebooks = new Datastore({filename: './db/data/notebooks', autoload: true});

// guitars.ensureIndex({fieldName: 'id', unique: true});

/*
 uploadedFiles:
{
    category: String,
    name: String,
    path: String,
    type: String,
    media: {
       image: {
            name: String,
            extension: String,
            path: String,
            description,

       },
       audio: {
            name: String,
            extension: String,
            path: String,
            description,
       },
    }
    mediaType: String(notebook,
    notebookId: String || null,
}

 */

/*
 notebooks

    {
        name: String,
        description: String,
        image: {
            name: String,
            path: String,
            description: String,
        },
        audio: {
            name: String,
            path: String,
            description: String,
        },
        createdBy: String,
        createdAt: Date,
        isAttached: Boolean,
        attachedToId: String
    }




 */

module.exports = {
    notebooks: notebooks,
    uploadedFiles: uploadedFiles
};