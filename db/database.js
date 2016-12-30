var Datastore = require('nedb'),
    fs = require('fs'),
    path = require('path'),
    remote = require('electron').remote;

const databasePath = remote.getGlobal('userPaths').static.database;

var transMarkdown = new Datastore({filename: databasePath + '/transMarkdown', autoload: true}),
    notebooks = new Datastore({filename: databasePath + '/notebooks', autoload: true}),
    hashtags = new Datastore({filename: databasePath + '/hashtags', autoload: true}),
    corporaMenu = new Datastore({filename: databasePath + '/corporaMenu', autoload: true});



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
    transMarkdown: transMarkdown,
    hashtags: hashtags,
    corporaMenu: corporaMenu
};