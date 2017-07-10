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

    // var dataObj = JSON.parse(req.body.dataObj);
    var files = req.files;
    var promises = [];
    var dataObj = {};


    files.forEach(function(file) {
        file = MediaObject(file);
        var imagePromise = copyAndWrite(file.path, path.join(app.getPath('userData'), 'image', file.filename))
            .then(function(response) {
                file.name = file.filename;
                file.absolutePath = path.join(app.getPath('userData'), 'image', file.filename);
                file.path = path.join('image', file.filename);
                dataObj.image = Object.assign({}, file);
                return file;
            });
        promises.push(imagePromise);
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


function removeAvatar(req, res, next) {
    // var mediaPath;
    // mediaPath = path.join(app.getPath('userData'), req.body.filePath);
    fs.unlink(req.body.filePath);
    next();
}


module.exports = {
    validateFilename: validateFilename,
    removeAvatar: removeAvatar,
    type: type
};


