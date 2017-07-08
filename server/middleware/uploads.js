var config = require('../config/environment');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var q = require('q');
var app = require('electron').app;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(app.getPath('userData'), 'temp'))
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

    var dataObj = JSON.parse(req.body.dataObj);
    var files = req.files;
    var promises = [];

    if (dataObj.removeItem) {
        dataObj.removeItem.forEach(function(media) {
            removeMedia(media);
        });
        delete dataObj.removeItem;
    }


    files.forEach(function(file) {
        file = MediaObject(file);
        if (file.mimetype.indexOf('image') > -1) {
            var imagePromise = copyAndWrite(file.path, path.join(app.getPath('userData'), 'image', file.filename))
                .then(function(response) {
                    file.absolutePath = path.join(app.getPath('userData'), 'image', file.filename);
                    file.path = path.join('image', file.filename);
                    file.name = file.filename;
                    dataObj.image = Object.assign({}, file);
                    return file;
                });
            promises.push(imagePromise);
        } else if (file.mimetype.indexOf('audio') > -1) {
            file = MediaObject(file);
            var audioPromise = copyAndWrite(file.path, path.join(app.getPath('userData'), 'audio', file.filename))
                .then(function(response) {
                    file.absolutePath = path.join(app.getPath('userData'), 'audio', file.filename);
                    file.path = path.join('audio', file.filename);
                    file.name = file.filename;
                    dataObj.audio = Object.assign({}, file);
                    return file;
                });
            promises.push(audioPromise);
        } else {
            console.log('Error, file type not supported');
        }
    });

    q.all(promises).then(function(response) {
        req.body.dataObj = Object.assign({}, dataObj);
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
    if (media.mimetype.indexOf('image')> -1) {
        mediaPath = path.join(app.getPath('userData'), 'image', media.filename);
    } else if (media.mimetype.indexOf('audio') > -1) {
        mediaPath = path.join(app.getPath('userData'), 'audio', media.filename);
    }
    fs.unlink(mediaPath);
}


module.exports = {
    validateFilename: validateFilename,
    type:type
};


