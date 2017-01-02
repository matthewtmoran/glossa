var Datastore = require('nedb'),
    fs = require('fs'),
    path = require('path'),
    remote = require('electron').remote,
    hashtagJson = require('./data/hashtags.json');

const databasePath = remote.getGlobal('userPaths').static.database;

var transMarkdown = new Datastore({filename: path.join(databasePath, '/transMarkdown'), autoload: true}),
    notebooks = new Datastore({filename: path.join(databasePath, '/notebooks'), autoload: true}),
    corporaMenu = new Datastore({filename: path.join(databasePath, '/corporaMenu'), autoload: true}),
    hashtags = new Datastore({filename: path.join(databasePath, '/hashtags')});

//script to load hashtag db and prepopulate data if it doesn't already exist
hashtags.loadDatabase(function (err) {
    if (err) {
        return console.log('There was an error loading hashtag db', err);
    }
    hashtags.count({} , function (err, count) {
        if (err) {
            return console.log('There was an error counting hashtag db', err);
        } else {
            if (count == 0) {
                hashtags.insert(hashtagJson.hashtags, function(err) {
                    if (err) {
                        return console.log('There was an issue prepopulating hashtag db', err);
                    } else {
                        console.log('hashtag db prepopulated successful');
                    }
                })
            } else {
                console.log('Records already exist in hashtag db');
            }
        }
    });
});






// if (!fs.existsSync(globalPaths.static[key])){
//     console.log('making directory');
//     fs.mkdirSync(globalPaths.static[key]);
// }

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