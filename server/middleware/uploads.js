var config = require('../config/environment');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var q = require('q');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var tempPath = path.join(config.root, 'server/data/tmp/');
        console.log('tempPath', tempPath);
        cb(null, tempPath)
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

    console.log('files that are attemping to be uploaded....', files);

    files.forEach(function(file) {
        file = MediaObject(file);
        if (file.mimetype === 'image/jpeg') {
            console.log('file.filename', file.filename);
            var imagePromise = copyAndWrite(file.path, path.join(config.root, config.imagePath, file.filename))
                .then(function(response) {
                    file.path = path.join('image',file.filename);
                    dataObj.image = file;
                    return file;
                });
            promises.push(imagePromise);
        } else if (file.mimetype.indexOf('audio') > -1) {
            file = MediaObject(file);
            var audioPromise = copyAndWrite(file.path, path.join(config.root, config.audioPath, file.filename))
                .then(function(response) {
                    file.path = path.join('audio', file.filename);
                    dataObj.audio = file;
                    return file;
                });
            promises.push(audioPromise);
        } else {
            console.log('Error, file type not supported');
        }
    });

    q.all(promises).then(function(response) {
        req.body.dataObj = dataObj;
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
        mediaPath = path.join(config.root, config.imagePath, media.filename);
    } else if (media.mimetype.indexOf('audio') > -1) {
        mediaPath = path.join(config.root, config.audioPath, media.filename);
    }
    fs.unlink(mediaPath);
}


module.exports = {
    validateFilename: validateFilename,
    type:type
};


