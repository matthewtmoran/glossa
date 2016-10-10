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
        getAllFiles: getAllFiles,
        createNewText: createNewText
    };

    return service;
    //////////////

    function createNewText(val) {
        var fileExist = true;
        var fileNumber = 1;
        var fileNumber_str;
        var fileName = 'untitled';
        var current = {};

        while(fileExist) {
            console.log("fileExists");
            fileNumber_str = fileNumber.toString();
            current.name = fileName + fileNumber_str + '.md';
            console.log('cuttent.name', current.name);
            console.log('fileList', fileList);
            if (_.find(fileList,['name', current.name] )) {
                console.log('here it comes:');
                fileNumber++;
            } else {
                var newPath = uploadPath + current.name;
                fs.writeFile(newPath, current.name, function (err) {
                    if (err) {
                        return console.log('There was an error making a new file', err);
                    }
                    console.log('New file created successfully');
                    return dbSrvc.insert(fileCollection, createFileData(current)).then(function(doc) {
                        fileList.push(doc);
                        return doc;
                    })
                });
                break;
            }
        }
    }

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
            path: uploadPath + file.name,
            isLinked: false,
            linked: {}
        };
        if (!file.type && file.name.indexOf('.md') > -1)  {
            fileDoc.type = 'md';
        }
        fileDoc.category = defineCategory(fileDoc.type);
        return fileDoc;
    }
    //adds a file category to the object
    function defineCategory(type) {
        if (type.indexOf('audio') > -1) {
            return 'audio';
        } else if (type.indexOf('text') > 0) {
            return 'text';
        } else if (type === '') {
            return 'text';
        }
        else {
            return 'other';
        }
    }
    //dbSrvc takes the data collection and the query to call
    function getAllFiles() {
        return dbSrvc.find(fileCollection, {}).then(function(docs) {
            fileList = docs;
            return docs;
        })
    }

}