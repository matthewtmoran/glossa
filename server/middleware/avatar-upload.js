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
    console.log("req.files:  ", req.files);
    console.log("req.body:  ", req.body);
    if (!req.files) {
        next();
    }

    // var dataObj = JSON.parse(req.body.dataObj);
    var files = req.files;
    var promises = [];
    var dataObj = {};

    console.log('files that are attemping to be uploaded....', files);

    files.forEach(function(file) {
        file = MediaObject(file);
        var imagePromise = copyAndWrite(file.path, path.join(config.imagePath, file.filename))
            .then(function(response) {
                file.path = path.join('image',file.filename);
                dataObj.image = file;
                return file;
            });
        promises.push(imagePromise);
    });

    q.all(promises).then(function(response) {
        console.log('Promises resolved.... proceed to data update....');
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


