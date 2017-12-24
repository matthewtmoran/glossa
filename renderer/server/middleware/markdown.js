'use strict';

var config = require('../config/environment'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    Transcription = require('../api/transcription/transcription.model');

module.exports = {
    createFile: function(req, res, next) {
        console.log('createFile');
        var mdfile = {
            displayName: req.body.name || 'untitled',
            actualName: 'markdown-' + req.body.corpus + '-' + Date.now() + '.md', //markdown-{corpus}-{timestamp}??
            description: '',
            createdAt: Date.now(),
            corpus: req.body.corpus,
            media: {}
        };

        mdfile.path = path.join(config.markdownPath, mdfile.actualName);

        var stream = fs.createWriteStream(mdfile.path);

        stream.end(function() {
            console.log('end event');
            req.mdFile = mdfile;
            next();
        });
    },

    removeMedia: function(req, res, next) {
        if (!req.body.removeMedia) {
            next();
        }

        req.body.removeMedia.forEach(function(media) {
            fs.unlink(req.body.media[media].path);
        });
        next();



    }


};

//
// var findUntitledNum = function(corpus) {
//     var fileExist = true;
//     var fileNumber = 1;
//     var fileNumber_str;
//     var displayName;
//     var exists;
//
//     while(fileExist) {
//         fileNumber_str = fileNumber.toString();
//         displayName = 'untitled(' + fileNumber_str + ')';
//
//         if ({{doesitexist}}) {
//             console.log('usedDisplayName(displayName, corpus) --- is true');
//             fileNumber++;
//         } else {
//             console.log('return displayName');
//             return displayName;
//         }
//
//         console.log('end of loop');
//     }
// };
//
// var usedDisplayName = function(name, corpus) {
//
//     var query = {
//         corpus: corpus,
//         displayName: name
//     };
//
//     Transcription.find(query, function(err, count) {
//         if (err) {
//             return console.log("There was an error", err);
//         }
//         console.log('count', count);
//         if (count > 0) {
//            console.log("this name already exists...");
//
//         }
//
//     })
//
//
//
//
// };