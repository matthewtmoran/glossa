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
    var data = {
        currentFile: {}
    };

    var service = {
        getAllFiles: getAllFiles,
        createNewTextFile: createNewTextFile,
        updateFileData: updateFileData,
        attachAudioFile: attachAudioFile,
        setSelectedFile: setSelectedFile,
        getSelectedFile: getSelectedFile
    };

    return service;
    //////////////

    //dbSrvc takes the data collection and the query to call
    function getAllFiles() {
        return dbSrvc.find(fileCollection, {}).then(function(docs) {
            fileList = docs;
            return docs;
        })
    }
    /**
     * Helper function to call the proper file either named or an untitled file
     * @param searchInput
     */
    function createNewTextFile(searchInput) {
        //if there is not text input on search submit
        if (!searchInput) {
            return startBlankFile();
        } else {
            return startNamedFile(searchInput);
        }
    }
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
     * Set the current file
     * @param file
     */
    function setSelectedFile(file) {
        data.currentFile = file;
    }
    /**
     * Return the current file
     * @returns {*}
     */
    function getSelectedFile() {
        return data.currentFile;
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

    //creates and returns the file data
    function createFileData(file) {
        var fileDoc = {
            name: file.name,
            extension: file.extension,
            isLinked: false,
            linked: {},
            audio: '',
            image: '',
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





    /**
     * Check if file exists
     * Returns true if the file exists and false if the file does not exist
     * @param dir
     * @returns {boolean}
     */
    function doesExist(dir) {
        try {
            fs.statSync(dir);
            return true;
        } catch (err) {
            return !(err && err.code === 'ENOENT');
        }
    }



    /**
     * Attaches an audio file to the current file by writing new file to system and saving file in db.
     * @param file - the new file being we are working with.
     * @returns {*}
     * TODO: here we need some set of events.
     * TODO: Are they allowed to attach the same file to different text files?
     *
     */
    function attachAudioFile(file) {
        var newPath = uploadPath + file.name;
        //check if file with the same name exists in file system
        var exists = doesExist(newPath);
        if (exists) {
            return console.log('A file with this name already exists.  Do you want to overwrite the existing file or rename this file?')
        }

        updateCollection(newPath).then(function(result) {
            console.log('promise returned');
            copyAndWrite(file.path, newPath, function() {
                console.log('copy and write ahs finished');
                data.currentFile.audio = result.newObj.audio;
            })
        });

        // return copyAndWrite(file.path, newPath, updateCollection);
    }


    /**
     * "Upload" file into app"
     * Takes the original file location, the new file location, and a callback function
     * It will copy the file and wirte the file and then initait the saveToDb callback
     * @param from - the original file location
     * @param to - the new file location
     * @param saveToDb - call back that take the new Path and saves data in db.
     */
    function copyAndWrite(from, to, saveToDb) {
        //copy the file
        fs.createReadStream(from)
        //write the file
            .pipe(fs.createWriteStream(to)
                .on('close', function() {
                        console.log("Uploaded file done");
                        return saveToDb(to);
                    }
                )
            );
    }



    /**
     * Attach Audio File to the current file
     * @param path - the path where the file exists in the app.
     */
    function updateCollection(path) {
        var tempData = {
            newObj: {}
        };

        tempData['newObj']['audio'] = path;
        console.log('data.currentFile', data.currentFile);
        tempData.fileId = data.currentFile._id;
        tempData.options = {};
        return dbSrvc.update(fileCollection, tempData).then(function(result) {
            return tempData;
        });
    }


}