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
        createNewText: createNewText,
        updateFileData: updateFileData
    };

    return service;
    //////////////

    /**
     * Update to file data.
     * Name update is only triggered on blur event (due to async file to write functionality)
     * The rest is called immediately.
     * TODO: Need to compact DB at some point.
     * TODO: Should refractor the data that's being passed.
     * @param data
     */
    function updateFileData(data) {
        if (data.field === 'name') {
            data.newObj.path = uploadPath + data.newObj.name + data.file.extension;
            dbSrvc.update(fileCollection, data);
            renameFileToSystem(data.file.path, data.newObj.path);
        } else {
            dbSrvc.update(fileCollection, data);
        }
    }

    /**
     * Helper function to call the proper file either named or an untitled file
     * @param searchInput
     */
    function createNewText(searchInput) {
        //if there is not text input on search submit
        if (!searchInput) {
            return startBlankFile();
        } else {
            return startNamedFile(searchInput);
        }
    }


    /**
     * Renames the file.
     * @param oldPath - the old file path (name)
     * @param newPath - the new file path (name)
     */
    function renameFileToSystem(oldPath, newPath) {
        fs.rename(oldPath, newPath, function() {
            console.log('File should be updated in file system.')
        })
    }

    /**
     * Creates a file with the name of the user's search
     */
    function startNamedFile(searchInput) {
        var file = {};
        file.name = searchInput;
        file.extension = ".md";
        var newPath = uploadPath + file.name + file.extension;
        return createAndSaveFile(file, newPath);
    }

    /**
     * Creates a new untitled file
     */
    function startBlankFile() {
        var fileExist = true;
        var fileNumber = 1;
        var fileNumber_str;
        var fileName = 'untitled';
        var file = {};

        //if a file with the same name exists
        while(fileExist) {
            //change the integer to a string
            fileNumber_str = fileNumber.toString();
            //create the name of the file using the generic name and dynamic incremental number
            file.name = fileName + fileNumber_str;
            file.extension = '.md';
            // file.extenstion = '.md';
            // file.fullName = file.name + file.extension;
            //if a file exists with the same name...
            if (_.find(fileList,['name', file.name] )) {
                //increment the number
                fileNumber++;
                //    if a file with the same name does not exists...
            } else {
                //define the path
                var newPath = uploadPath + file.name + file.extension;
                //write the file to that path
                //second argument will be the default text in the document
                return createAndSaveFile(file, newPath);
            }
        }
    }

    /**
     * Writes file to directory and saves the data in the database
     * @param file - the file object
     * @param path - the path of where the file will be stored
     *
     * I wanted to write the file to the system first but do to the async nature of the file writing and the promise, I was haivng trouble getting the promise value out when I needed it.
     */
    function createAndSaveFile (file, path) {
        //insert the file in to the fileCollection
        return dbSrvc.insert(fileCollection, createFileData(file))
            .then(function(doc) {
                //when promise returns, push the document to the fileList
                fileList.push(doc);
                //when the promise resolves write the file to the file system
                fs.createWriteStream(path)
                    .on('close', function() {
                        console.log("file written to system")
                    });
                return doc;
            })
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
            extension: file.extension,
            isLinked: false,
            linked: {},
            description: ''
        };

        fileDoc.path = uploadPath + fileDoc.name + file.extension;
        // fileDoc.path = uploadPath + fileDoc.fullName;

        if (!file.type && fileDoc.extension === '.md')  {
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

    function getFileContent(srcpath) {
        return fs.readFileSync(srcpath, {encoding: 'utf-8'});
    }

}