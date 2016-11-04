'use strict';
// TODO: Need to come up with a better system for file paths
//node modules
var db = require('../db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    fileCollection = db.uploadedFiles,
    uploadPathStatic = path.join(__dirname,'../uploads/'),
    uploadPathRelative = 'uploads/',
    imagesDir = 'uploads/image/',
    audioDir = 'uploads/image/';


angular.module('glossa')
    .factory('fileSrvc', fileSrvc);

function fileSrvc(dbSrvc) {

    var file = {},
        fileList = [];

    var fileSrvc = this;


    var data = {
        searchText: '',
        currentFile: {},
        fileList: [],
        filteredFiles: []
    };

    var service = {
        queryAllFiles: queryAllFiles,
        createNewTextFile: createNewTextFile,
        updateFileData: updateFileData,
        attachFile: attachFile,
        setCurrentFile: setCurrentFile,
        getCurrentFile: getCurrentFile,
        isAttached: isAttached,
        getFileList: getFileList,
        deleteMediaFile: deleteMediaFile,
        updateAttached: updateAttached,
        deleteTextFile: deleteTextFile,
        data: data
    };

    return service;
    ///////////////

    /**
     * Queries db for all files
     * @returns {*}
     *
     * TODO: may just want to query for text files (Actually all the files being saved in db right now are text file and this might be fine)
     */
    function queryAllFiles() {
        return dbSrvc.find(fileCollection, {}).then(function(docs) {
            return docs;
        })
    }

    function getFileList() {
        return data.fileList;
    }


    ////////////////////////
    ///Text File Creation///
    ////////////////////////

    /**
     * Create new text file
     * If no search input will name the file 'untitled$.md'
     * @param searchInput - the users' search term
     */
    function createNewTextFile(searchInput) {
        //if there is not text input on search submit
        if (!searchInput) {
            return blankFile();
        } else {
            return namedFile(searchInput);
        }
    }
    /**
     * Creates new untitled text file
     */
    function blankFile() {
        var fileExist = true;
        var fileNumber = 1;
        var fileNumber_str;
        var fileName = 'untitled';
        var file = {};
        var targetPath = '';
        //if a file with the same name exists
        while(fileExist) {
            //change the integer to a string
            fileNumber_str = fileNumber.toString();
            //create the name of the file using the generic name and dynamic incremental number
            file.name = fileName + fileNumber_str;
            file.extension = '.md';

            targetPath = uploadPathRelative + file.name + file.extension;
            //if a file exists with the same name...
            if (doesExist(targetPath)) {
                //increment the number
                fileNumber++;
                //    if a file with the same name does not exists...
            } else {
                //define the path
                var newPath = uploadPathStatic + file.name + file.extension;
                //write the file to that path
                //second argument will be the default text in the document
                return createAndSaveFile(file, newPath);
            }
        }
    }
    /**
     * Creates titled text file
     */
    function namedFile(searchInput) {
        var file = {};
        file.name = searchInput;
        file.extension = ".md";
        var fullFilePath = path.join(__dirname, file.name + file.extension);
        return createAndSaveFile(file, fullFilePath);
    }
    /**
     * Writes text file to directory and saves the data in the database
     * @param file - the file object
     * @param fullFilePath - the path of where the file will be stored
     *
     * I wanted to write the file to the system first but do to the async nature of the file writing and the promise, I was haivng trouble getting the promise value out when I needed it.
     */
    function createAndSaveFile(file, fullFilePath) {
        //insert the file in to the fileCollection
        return dbSrvc.insert(fileCollection, buildFileObject(file))
            .then(function(doc) {
                //when promise returns, push the document to the fileList
                fileList.push(doc);

                //when the promise resolves write the file to the file system
                fs.createWriteStream(fullFilePath)
                    .on('close', function() {
                        console.log("file written to system")
                    });
                return doc;
            })
    }


    function deleteTextFile(currentFile) {
        console.log('currentFile',currentFile);
        for (var key in currentFile.media) {
            // check also if property is not inherited from prototype
            if (currentFile.media.hasOwnProperty(key) ) {
                if (!currentFile.media[key]) {
                    break;
                }

                var attachment = currentFile.media[key];
                var writePath = path.join(uploadPathStatic, key, attachment.name);
                console.log('writePath');
                fs.unlink(writePath);
            }
        }

        var parentFile = path.join(uploadPathStatic, currentFile.name + currentFile.extension);

        fs.unlink(parentFile);

        return dbSrvc.remove(fileCollection, currentFile._id ).then(function(doc) {
            fileCollection.persistence.compactDatafile();
            return doc;
        });
    }

    ////////////////////////
    ////Helper Functions////
    ////////////////////////

    /**
     * Create text file object
     *
     * This object will be saved to db and should have all necessary information
     *
     * @param file
     * @returns {
     *      {
     *            name: (string|*),
     *            extension: string,
     *            isLinked: boolean,
     *            linked: {},
     *            audio: string,
     *            image: string,
     *            description: string
     *      }
     * }
     */
    function buildFileObject(file) {
        var fileDoc = {
            name: file.name,
            extension: file.extension,
            description: '',
            media: {}
        };
        fileDoc.media.image = null;
        fileDoc.media.audio = null;

        fileDoc.path = uploadPathRelative + fileDoc.name + file.extension;
        // fileDoc.path = uploadPath + fileDoc.fullName;

        if (!file.type && fileDoc.extension === '.md')  {
            fileDoc.type = 'md';
        }
        fileDoc.category = defineCategory(fileDoc.type);
        return fileDoc;
    }
    /**
     * Defines The category for the file
     * @param type
     * @returns {*}
     */
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
     *
     * TODO: consider just querying the db for an existing file by the name(path)
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
     * Set the current file
     * @param file
     */
    function setCurrentFile(file) {
        data.currentFile = file;
    }
    /**
     * Return the current file
     * @returns {*}
     */
    function getCurrentFile() {
        return data.currentFile;
    }
    /**
     * Does the text file already have audio/image files attached?
     * @param type - the type of attached file we are checking against
     * @returns {boolean} - true if it has file already attached
     */
    function isAttached(type, currentFile) {
        if (currentFile.media[type]) {
            return true;
        }
        return false;
    }


    ////////////////////////
    ////Update Meta Data////
    ////////////////////////

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
            data.newObj.path = uploadPathStatic + data.newObj.name + data.file.extension;
            dbSrvc.update(fileCollection, data);
            renameFileToSystem(data.file.path, data.newObj.path);
        } else {
            dbSrvc.update(fileCollection, data);
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


    ////////////////////////
    ///Attach media files///
    ////////////////////////

    /**
     * Attaches a file to the current file by writing new file to system and saving file in db.
     * @param file - the new file being we are working with.
     * @param type -
     * @returns {*}
     *
     * TODO: here we need some set of events.
     * TODO: Are they allowed to attach the same file to different text files?
     *
     */
    function attachFile(file, type, currentFile) {
        var writePath = path.join(uploadPathStatic, type, file.name);
        var targetPath = uploadPathRelative + type + '/' + file.name;
        // var targetPath = path.join(uploadPathRelative,type,file.name);

        //check if file with the same name exists in file system
        var exists = doesExist(targetPath);
        if (exists) {
            //TODO: use angular material alert/confirm
            return alert('A file with this name already exists.');
        }
        return copyAndWrite(file.path, writePath, function(err, res) {
            if (err) {
                return console.log('There was an error', err);
            }

            return updateFileInDb(targetPath, type, file, currentFile).then(function(result) {
                //TODO: Might be better just to update property
                data.currentFile = result;
                return result;
            })
        });
    }
    /**
     * Attach Audio File to the current file
     * @param path - the path where the file exists in the app.
     * @param type -
     * @param file -
     * @param currentFile - the current file that is selected
     * Current file is passed in so i can set the tempData.newObj.media to the existing media otherwise, saving the media object, even though we are targeting a nested object, overwrites the media object completely.
     */
    function updateFileInDb(path, type, file, currentFile) {
        var tempData = {
            newObj: {}
        };

        tempData.newObj.media = currentFile.media;

        tempData.newObj.media[type] = {
            name: file.name,
            description: '',
            path: path,
            extension: file.extension
        };

        tempData.fileId = currentFile._id;
        tempData.options = {
            returnUpdatedDocs: true
        };

        return dbSrvc.update(fileCollection, tempData).then(function(result) {
            fileCollection.persistence.compactDatafile();
            return result;
        });
    }
    /**
     * "Upload" file into app"
     * Takes the original file location, the new file location, and a callback function
     * It will copy the file and wirte the file and then initait the saveToDb callback
     * @param from - the original file location
     * @param to - the new file location
     * @param callback - call back that take the new Path and saves data in db.
     */
    function copyAndWrite(from, to, callback) {
        //copy the file
        fs.createReadStream(from)
        //write the file
            .pipe(fs.createWriteStream(to)
                .on('close', function() {
                    return callback(null, to);
                })
                .on('error', function(err) {
                    return callback(err, null);
                })
            );
    }

    function deleteMediaFile(attachment, type, currentFile) {
        var writePath = path.join(uploadPathStatic, type, attachment.name);

        fs.unlink(writePath);

        var tempData = {
            newObj: {}
        };

        tempData.newObj.media = currentFile.media;

        tempData.newObj.media[type] = null;

        tempData.fileId = currentFile._id;
        tempData.options = {
            returnUpdatedDocs: true
        };

        return dbSrvc.update(fileCollection, tempData).then(function(result) {
            fileCollection.persistence.compactDatafile();
            return result;
        });
    }

    function updateAttached(currentFile, attached, type) {

        var tempData = {
            newObj: {}
        };
        tempData.newObj.media = currentFile.media;

        tempData.newObj.media[type] = {
            name: attached.name,
            description: '',
            path: attached.path,
            extension: attached.extension
        };

        tempData.fileId = currentFile._id;
        tempData.options = {
            returnUpdatedDocs: true
        };

        return dbSrvc.update(fileCollection, tempData).then(function(result) {
            fileCollection.persistence.compactDatafile();
            return result;
        });
    }

}