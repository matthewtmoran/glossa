'use strict';

//node modules
var db = require('../db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    fileCollection = db.uploadedFiles,
    uploadPath = path.join(__dirname,'../uploads/');


angular.module('glossa')
    .factory('fileSrvc', fileSrvc);

function fileSrvc(dbSrvc) {

    var file = {},
        fileList = [];

    var service = {
        uploadFile: uploadFile,
        getAllFiles: getAllFiles
    };

    return service;
    //////////////

    //uploads file and saves data in database
    function uploadFile(files) {
        for (var key in files) {
            if (files.hasOwnProperty(key)) {
                file = files[key];

                //copy the file
                fs.createReadStream(file.path)
                    //write the file
                    .pipe(fs.createWriteStream(uploadPath + file.name)
                        .on('close', function() {
                            console.log("Uploaded file done");

                            //insert data into database
                            fileCollection.insert(createFileData(file), function(err, fileDoc) {
                                if (err) {
                                    console.log('There was an error saving file data to the DB', err);
                                }
                                console.log('File data was saved to the DB', fileDoc);
                                //push new document to fileList array
                                fileList.push(fileDoc);
                            })

                        }
                    )
                );

            }
        }
    }
    //creates and returns the file data
    function createFileData(file) {
        var fileDoc = {
            name: file.name,
            type: file.type,
            path: uploadPath + file.name,
            isLinked: false,
            linked: {}
        };
        fileDoc.category = defineCategory(file.type);
        return fileDoc;
    }
    //adds a file category to the object
    function defineCategory(type) {
        console.log('type', type);
        console.log(type.indexOf('audio'));
        if (type.indexOf('audio') > -1) {
            return 'audio';
        } else if (type.indexOf('text') > 0) {
            return 'text';
        } else {
            return 'other';
        }
    }
    //dbSrvc takes the data collection and the query to call
    function getAllFiles() {
        return dbSrvc.find(fileCollection, {}).then(function(docs) {
            return docs;
        })
    }

}