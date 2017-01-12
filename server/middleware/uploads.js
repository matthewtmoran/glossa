var config = require('../config/environment');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var q = require('q');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'server/data/tmp/')
    },
    filename: function (req, file, cb) {
        var name = file.originalname;
        var date = '-' + Date.now();
        name = name.replace(/(\.[\w\d_-]+)$/i, date + '$1');
        cb(null, name)
    }
});
var upload = multer({ storage: storage });
var type = upload.array('files');

function validateFilename(req, res, next) {
    if (!req.files) {
        next();
    }

    var notebook = JSON.parse(req.body.notebook);
    var files = req.files;
    var promises = [];

    if (notebook.removeItem) {
        notebook.removeItem.forEach(function(media) {
            removeMedia(media);
        });
        delete notebook.removeItem;
    }

    console.log('files that are attemping to be uploaded....', files);

    files.forEach(function(file) {
        file = MediaObject(file);
        if (file.mimetype === 'image/jpeg') {
            var imagePromise = copyAndWrite(file.path, path.join(config.imagePath, file.filename))
                .then(function(response) {
                    file.path = path.join('image',file.filename);
                    notebook.media.image = file;
                    return file;
                });
            promises.push(imagePromise);
        } else if (file.mimetype.indexOf('audio') > -1) {
            file = MediaObject(file);
            var audioPromise = copyAndWrite(file.path, path.join(config.audioPath, file.filename))
                .then(function(response) {
                    file.path = path.join('audio', file.filename);
                    notebook.media.audio = file;
                    return file;
                });
            promises.push(audioPromise);
        } else {
            console.log('Error, file type not supported');
        }
    });

    q.all(promises).then(function(response) {
        req.body.notebook = notebook;
        next()
    });
}

function MediaObject(file) {
    var fileObj = {};
    fileObj.originalname = file.originalname;
    fileObj.mimetype = file.mimetype;
    fileObj.size = file.size;
    fileObj.path = file.path;
    fileObj.filename = file.filename;
    fileObj.createdAt = Date.now();
    return fileObj;
}

function copyAndWrite(from, to){
   return new Promise(function(resolve, reject) {
        fs.createReadStream(from)
            .on('error', function(err) {
                reject(err);
            })
            .pipe(fs.createWriteStream(to)
                .on('close', function() {
                    fs.unlink(from);
                    resolve({data: to});
                })
                .on('error', function(err) {
                    reject(err);
                })
        );

   })
}

function removeMedia(media) {
    var mediaPath;
    if (media.mimetype === 'image/jpeg' ) {
        mediaPath = path.join(config.imagePath, media.filename);
    } else if (media.mimetype.indexOf('audio') > -1) {
        mediaPath = path.join(config.audioPath, media.filename);
    }

    fs.unlink(mediaPath);
}


module.exports = {
    validateFilename: validateFilename,
    type:type
};


