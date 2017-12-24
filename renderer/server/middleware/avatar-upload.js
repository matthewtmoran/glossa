const fs = require('fs');
const path = require('path');
const multer = require('multer');
const q = require('q');
const {app} = require('electron').remote;
const config = require('../config/environment');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(app.getPath('userData'), 'temp'))
  },
  filename: (req, file, cb) => {
    let name = file.originalname;
    let date = '-' + Date.now();
    name = name.replace(/(\.[\w\d_-]+)$/i, date + '$1');
    cb(null, name)
  }
});
let upload = multer({storage: storage});
let type = upload.array('files');

function validateFilename(req, res, next) {
  if (!req.files) {
    next();
  }

  let files = req.files;
  let mediaPromises = [];

  files.forEach((file) => {
    mediaPromises.push(
      copyAndWrite(file.path, path.join(app.getPath('userData'), 'image', file.filename))
        .then((response) => {
          this.imageData = Object.assign({}, MediaObject(file));
        })
    );
  });

  Promise.all(mediaPromises)
    .then((response) => {
      this.dataObject = {};
      this.dataObject.image = this.imageData;
      req.body.dataObj = Object.assign({}, this.dataObject);
      next()
    })

}

function MediaObject(file) {
  let fileObj = {};
  fileObj.absolutePath = path.join(app.getPath('userData'), 'image', file.filename);
  fileObj.originalname = file.originalname;
  fileObj.mimetype = file.mimetype;
  fileObj.size = file.size;
  fileObj.path = path.join('image', file.filename);
  fileObj.name = file.filename;
  fileObj.createdAt = Date.now();
  return fileObj;
}

function copyAndWrite(from, to) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(from)
      .on('error', function (err) {
        reject(err);
      })
      .pipe(fs.createWriteStream(to)
        .on('close', function () {
          fs.unlink(from);
          resolve({data: to});
        })
        .on('error', function (err) {
          reject(err);
        })
      );

  })
}


function removeAvatar(req, res, next) {
  fs.unlink(req.body.filePath);
  next();
}


module.exports = {
  validateFilename: validateFilename,
  removeAvatar: removeAvatar,
  type: type
};


