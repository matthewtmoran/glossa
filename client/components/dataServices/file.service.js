'use strict';
// TODO: Need to come up with a better system for file paths
//node modules
// var db = require('./db/database'),
//     fs = require('fs'),
//     path = require('path'),
//     _ = require('lodash'),
//     fileCollection = db.transMarkdown,
//     nbCollection = db.notebooks,
//     util = require('./components/node/file.utils'),
//     remote = require('electron').remote,
//     globalPaths = remote.getGlobal('userPaths');


angular.module('glossa')
    .factory('fileSrvc', fileSrvc);

function fileSrvc(dbSrvc, $stateParams, $q) {

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
        saveIndependentAttachment: saveIndependentAttachment,
        saveNotebookAttachment: saveNotebookAttachment,
        isAttached: isAttached,
        getFileList: getFileList,
        deleteMediaFile: deleteMediaFile,
        updateAttached: updateAttached,
        deleteTextFile: deleteTextFile,
        attachNotebook: attachNotebook,
        unattachNotebook: unattachNotebook,
        newUpdate: newUpdate,
        setCurrentFile: setCurrentFile,
        getCurrentFile: getCurrentFile
    };

    return service;
    ///////////////

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
     * Queries db for all files
     * @returns {*}
     *
     * TODO: may just want to query for text files (Actually all the files being saved in db right now are text file and this might be fine)
     */
    function queryAllFiles(currentCorpus) {
        // return dbSrvc.find(fileCollection, {corpus: currentCorpus}).then(function(docs) {
        //     return docs;
        // })
    }
    function getFileList() {
        return data.fileList;
    }


    ////////////////////////
    //Text File Functions///
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

            // targetPath = uploadRoot + file.name + file.extension;

            targetPath = path.join(globalPaths.static.markdown, file.name + file.extension);

            //if a file exists with the same name...
            if (util.doesExist(targetPath)) {
                //increment the number
                fileNumber++;
                //    if a file with the same name does not exists...
            } else {
                //define the path
                var newPath = path.join(globalPaths.static.markdown, file.name + file.extension);
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
        console.log('TODO: fix this function');
        // var file = {};
        // file.name = searchInput;
        // file.extension = ".md";
        // var fullFilePath = path.join(__dirname, file.name + file.extension);
        // return createAndSaveFile(file, fullFilePath);
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
        // return dbSrvc.insert(fileCollection, buildFileObject(file))
        //     .then(function(doc) {
        //         when promise returns, push the document to the fileList
        //         when the promise resolves write the file to the file system
                // fs.createWriteStream(fullFilePath)
                //     .on('close', function() {
                //         console.log("file written to system")
                //     });
                // return doc;
            // })
    }
    /**
     * Deletes the current text file and independently attached media
     * @param currentFile
     * @returns {*}
     */
    function deleteTextFile(currentFile) {
        if (currentFile.mediaType === 'notebook') {
            var data = {
                fileId: currentFile.notebookId,
                newObj: {
                    isAttached: false,
                    attachedToId: null
                },
                options: {
                    returnUpdatedDocs: true
                }
            };

            // dbSrvc.update(nbCollection, data).then(function(result) {
            //     nbCollection.persistence.compactDatafile();
            //     return result;
            // })

        } else {
            for (var key in currentFile.media) {
                // check also if property is not inherited from prototype
                if (currentFile.media.hasOwnProperty(key) ) {
                    if (currentFile.media[key]) {
                        var attachment = currentFile.media[key];
                        var writePath = path.join(globalPaths.static.markdown, key, attachment.name);
                        fs.unlink(writePath);
                    }
                }
            }
        }

        var parentFile = path.join(globalPaths.static.markdown, currentFile.name + currentFile.extension);

        // fs.unlink(parentFile);

        // return dbSrvc.remove(fileCollection, currentFile._id).then(function(doc) {
        //     fileCollection.persistence.compactDatafile();
        //     return doc;
        // });
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
            media: {},
            corpus: $stateParams.corpus
        };

        fileDoc.path = path.join(globalPaths.relative.markdown, file.name + file.extension);

        if (!file.type && fileDoc.extension === '.md')  {
            fileDoc.type = 'md';
        }
        return fileDoc;
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
        console.log('fileSrvc: updateFileData');
        // data.options = {
        //     returnUpdatedDocs: true
        // };
        // if (data.field === 'name') {

            // data.newObj.path = path.join(globalPaths.static.markdown, data.newObj.name + data.file.extension);

            // console.log('data.newObj.path', data.newObj.path);

        //     return dbSrvc.update(fileCollection, data).then(function(result) {
        //         fileCollection.persistence.compactDatafile();
        //
        //         console.log('data.file.path', data.file.path);
        //
        //         renameFileToSystem(data.file.path, data.newObj.path, function() {
        //             console.log('probably dont need thie cb anymore...');
        //         });
        //
        //         return result;
        //     });
        // } else {
        //     return dbSrvc.update(fileCollection, data).then(function(result) {
        //         fileCollection.persistence.compactDatafile();
        //         return result;
        //     })
        // }
    }

    //Some File System Functions

    /**
     * Renames the file.
     * @param oldPath - the old file path (name)
     * @param newPath - the new file path (name)
     * TODO: maybe create a 'filesystem' api and move this function there.
     */
    function renameFileToSystem(objToMod) {
        var deferred = $q.defer();
        // var oldRelPath = objToMod.path,
        //     newRelPath = path.join(globalPaths.relative.markdown, objToMod.name + objToMod.extension),
        //     oldStaticPath = path.join(globalPaths.static.trueRoot, objToMod.path),
        //     newStaticPath = path.join(globalPaths.static.markdown, objToMod.name + objToMod.extension);
        //
        // fs.rename(oldStaticPath, newStaticPath, function(err) {
        //     if (err) {
        //         deferred.reject({
        //             success: false,
        //             msg: 'There was an error renaming file in the filesystem',
        //             error: err
        //         });
        //     }
        //     objToMod.path = newRelPath;
        //     deferred.resolve({
        //         success: true,
        //         msg: 'File renamed in filesystem success',
        //         data: objToMod
        //     });
        // });

        return deferred.promise;
    }


    ////////////////////////
    ///Attach media files///
    ////////////////////////


    function writeToNotebook(notebook, callback) {
        // var data = {
        //     options: {
        //         upsert: true,
        //         returnUpdatedDocs: true
        //     },
        //     fileObj: {}
        // };
        // if (notebooks.$$hashKey) {
        //     delete notebooks.$$hashKey;
        // }
        // data.fileObj = notebooks;
        // return dbSrvc.updateAll(nbCollection, data).then(function(result) {
        //     nbCollection.persistence.compactDatafile();
        //     return callback(null, result);
        // });
    }
    function writeToTransfile(currentFile, callback) {
        // var data = {
        //     options: {
        //         upsert: true,
        //         returnUpdatedDocs: true
        //     },
        //     fileObj: {}
        // };
        // if (currentFile.$$hashKey) {
        //     delete currentFile.$$hashKey;
        // }
        // data.fileObj = currentFile;
        // return dbSrvc.updateAll(fileCollection, data).then(function(result) {
        //     fileCollection.persistence.compactDatafile();
        //     return callback(null, result);
        // });
    }

    function saveIndependentAttachment(currentFile, callback) {
        // currentFile.mediaType = 'independent';
        // var maxLoops = Object.keys(currentFile.media).length;
        //
        // for(var key in currentFile.media) {
        //
        //     if (currentFile.media.hasOwnProperty(key)) {
        //
        //         if (!currentFile.media[key].absolutePath) {
        //             maxLoops--;
        //             continue;
        //         }
        //         //closure to make current key always accessible
        //         (function(key){
        //             //write to this path
        //             var writePath = path.join(globalPaths.static.markdown, key, currentFile.media[key].name);
        //
        //             //call copy and write function; pass in file location, new location, notebooks data, and callback
        //             util.copyAndWrite(currentFile.media[key].absolutePath, writePath, currentFile, function(err, to) {
        //                 if (err) {
        //                     return console.log('There was an error copying and writing file', err);
        //                 }
        //
        //                 //Modify loop length
        //                 maxLoops--;
        //
        //                 //create object for database
        //                 currentFile.media[key] = util.createMediaObject(currentFile.media[key], key);
        //
        //                 //delete absolute path
        //                 delete currentFile.media[key].absolutePath;
        //
        //                 // if we are are done looping
        //                 if (!maxLoops) {
        //                     //save the notebooks in the database and call callback
        //
        //                     var data = {
        //                         options: {
        //                             upsert: true,
        //                             returnUpdatedDocs: true
        //                         },
        //                         fileObj: {}
        //                     };
        //
        //                     if (currentFile.$$hashKey) {
        //                         delete currentFile.$$hashKey;
        //                     }
        //
        //                     data.fileObj = currentFile;
        //
        //                     return dbSrvc.updateAll(fileCollection, data).then(function(result) {
        //                         return callback(null, result);
        //                     });
        //                 }
        //             });
        //             //    pass the key to make accessible
        //         })(key);
        //     }
        // }
    }
    function saveNotebookAttachment(currentFile, notebook, callback) {
        // var updatedDocs = [];
        // updatedDocs.push(
        //     writeToNotebook(notebooks, function(err, result) {
        //         if (err){return console.log('There was an error saving notebooks', err)}
        //         return result
        //     })
        // );
        // updatedDocs.push(
        //     writeToTransfile(currentFile, function(err, result) {
        //         if (err){return console.log('There was an error saving transfile', err)}
        //         return result;
        //     })
        // );
        //
        // Promise.all(updatedDocs).then(function(result) {
        //     result.forEach(function(obj) {
        //         if (obj.type === 'md') {
        //             return callback(null, obj);
        //         }
        //     });
        // }, function(err) {
        //     console.log('err', err);
        // });
    }


    function deleteMediaFile(attachment, type, currentFile) {
        // var writePath = path.join(globalPaths.static.markdown, type, attachment.name);
        //
        // fs.unlink(writePath);
        //
        // var tempData = {
        //     newObj: {}
        // };
        //
        // tempData.newObj.media = currentFile.media;
        //
        // delete tempData.newObj.media[type];
        //
        // if (!tempData.newObj.media.image && !tempData.newObj.media.audio) {
        //     tempData.newObj.mediaType = '';
        // }
        //
        // tempData.fileId = currentFile._id;
        // tempData.options = {
        //     returnUpdatedDocs: true
        // };
        //
        // return dbSrvc.update(fileCollection, tempData).then(function(result) {
        //     fileCollection.persistence.compactDatafile();
        //     return result;
        // });
    }
    function updateAttached(currentFile, attached, type) {
        //
        // var tempData = {
        //     newObj: {}
        // };
        // tempData.newObj.media = currentFile.media;
        //
        // tempData.newObj.media[type] = {
        //     name: attached.name,
        //     description: '',
        //     path: attached.path,
        //     extension: attached.extension
        // };
        //
        // tempData.fileId = currentFile._id;
        // tempData.options = {
        //     returnUpdatedDocs: true
        // };
        //
        // return dbSrvc.update(fileCollection, tempData).then(function(result) {
        //     fileCollection.persistence.compactDatafile();
        //     return result;
        // });
    }

    function attachNotebook(notebook, currentFile, callback) {

        // for(var key in notebooks.media) {
        //     if (notebooks.media.hasOwnProperty(key)) {
        //         currentFile.media[key] = notebooks.media[key];
        //         currentFile.mediaType = 'notebooks';
        //         currentFile.notebookId = notebooks._id;
        //
        //         notebooks.isAttached = true;
        //         notebooks.attachedToId = currentFile._id;
        //
        //     }
        // }
        // callback(null, notebooks, currentFile);
    }
    function unattachNotebook(notebook, currentFile) {

        // delete notebooks.isAttached;
        // delete notebooks.attachedToId;
        //
        // for (var key in currentFile.media) {
        //     if (currentFile.media.hasOwnProperty(key)) {
        //         delete currentFile.media[key];
        //     }
        // }
        //
        // delete currentFile.mediaType;
        // delete currentFile.notebookId;
        //
        // saveNotebookAttachment(currentFile, notebooks, function(err, result) {
        //     if (err) {
        //         return console.log('there was an error in the detaching the notebooks', err);
        //     }
        //     return result;
        // })


    }


    /**
     * Should be a universal update function
     * @param objectToUpdate - The object being updated
     * @param fsChange - (optional) the field name being updated - this gives us the ability to write to the file system if the the name filed is modified.
     * @returns a promise object {success: Boolean, msg: 'message to diplay to user', (data/error): data object or error message}
     */
    function newUpdate(objectToUpdate, fsChange) {
        //if the field modified is the name field
        // if (fsChange === 'name') {
        //     //rename in the file in the file system
        //     /**
        //      * Updates in the db if the filesystem write is successful
        //      * @returns a promise object {success: Boolean, msg: 'message to diplay to user', (data/error): data object or error message}
        //      */
        //    return renameFileToSystem(objectToUpdate).then(function(result) {
        //         if (!result.success) {
        //             return alert('There was an error modifying data: ' + result);
        //         }
        //        return dbSrvc.basicUpdate(fileCollection, objectToUpdate);
        //     })
        // } else {
        //     return dbSrvc.basicUpdate(fileCollection, objectToUpdate);
        // }
    }

}