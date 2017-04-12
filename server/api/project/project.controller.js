/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var Project = require('./project.model');
var archiver = require('archiver');
var AdmZip = require('adm-zip');


var User = require('./../user/user.model');
var Notebooks = require('./../notebook/notebook.model');
var Transcriptions = require('./../transcription/transcription.model');
var Projects = require('./../project/project.model');
var Connections = require('./../connections/connection.model');
// var Connections = require('./../connections/connections.model');
var config = require('./../../config/environment/index');


// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Project.find({}, function (err, project) {
        if(err) { return handleError(res, err); }
        return res.status(200).json(project);
    });
};

// Get a single thing
exports.show = function(req, res) {
    Project.findOne({_id:req.params.id}, function (err, project) {
        if(err) { return handleError(res, err); }
        if(!project) { return res.status(404).send('Not Found'); }
        return res.json(project);
    });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    var project = req.body;
    Project.insert(project, function(err, c) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(c);
    });
};

// Updates an existing project in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of project...
exports.update = function(req, res) {
    if(req.body._id) { delete req.body._id; }
    Project.findOne({_id:req.params.id}, function (err, project) {
        if (err) { return handleError(res, err); }
        if(!project) { return res.status(404).send('Not Found'); }
        var options = {returnUpdatedDocs: true};
        var updated = _.merge(project, req.body);
        Project.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
            if (err) { return handleError(res, err); }
            Project.persistence.compactDatafile(); // concat db
            return res.status(200).json(updatedDoc);
        });
    });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Project.findById(req.params.id, function (err, thing) {
        if(err) { return handleError(res, err); }
        if(!thing) { return res.status(404).send('Not Found'); }
        thing.remove(function(err) {
            if(err) { return handleError(res, err); }
            return res.status(204).send('No Content');
        });
    });
};

/**
 * Import all project data
 * @param req
 * @param res
 */
exports.importProject = function(req, res) {
    console.log('req.body', req.body);
    var newProjectData;
    var zip = new AdmZip(req.body.projectPath);
    var zipEntries = zip.getEntries();
    zipEntries.forEach(function(zipEntry) {
        newProjectData = JSON.parse(zip.readAsText(zipEntry));
        var replacePromises = [];


        // replacePromises.push(replaceProject(userId));
        // replacePromises.push(replaceUser(newProjectData.user));

        // replacePromises.push(replaceProject(newProjectData.project));

        console.log('newProjectData.notebooks.length', newProjectData.notebooks.length);

        replacePromises.push(replaceNotebooks(newProjectData.notebooks));

        replacePromises.push(replaceConnections(newProjectData.connections));

        replacePromises.push(replaceTranscriptions(newProjectData.transcriptions));





        Promise.all(replacePromises).then(function(results) {

            var updatedData = {
                notebooks: results[0],
                connections: results[1],
                transcriptions: results[2]
            };

            return res.status(200).send(updatedData);
        });

    });
};

/**
 * Export all project data
 * @param req.body = {userId: string, projectId: string}
 * @param res
 */
exports.exportProject = function(req, res) {
    var userId = req.params.userId;
    var projectId = req.params.projectId;
    var projectData = {};//initiate project data object
    var databasePromises = [];//initiate promise array

    //TODO: queries need to be refractored
    //push application data(promises) to array
    databasePromises.push(getUser());
    databasePromises.push(getProject(userId));
    databasePromises.push(getNotebook(userId));
    databasePromises.push(getConnections());
    databasePromises.push(getTranscriptions());

    Promise.all(databasePromises).then(function(results) {//once all the promises have resolved

        //update the application data object
        projectData.user = results[0];
        projectData.project = results[1];
        projectData.notebooks = results[2];
        projectData.connections = results[3];
        projectData.transcriptions = results[4];

        //create and stream zip file

        res.set('Content-disposition', 'attachment; filename=' + 'project-' +  projectData.project._id + '.glossa'); //set header info / project name
        res.set('Content-Type', 'application/zip');

        var archive = archiver('zip'); // Sets the compression level.
        archive.pipe(res); //pipe the response
        //add file to archive
        archive.append(JSON.stringify(projectData), { name: 'project-' +  projectData.project._id + '.json'});

        archive.on('error', function(err) { ///if there is an error....
            console.error(err);
            throw err;
        });

        res.on('close', function() { //when the response is done
            return res.status(200).send('OK').end(); //send response to client
        });

        archive.finalize();

    })
};


/**
 * Replace all connections with imported connections
 * @param newConnections
 * TODO: need to take into account avatars
 */
function replaceConnections(newConnections) {
    return new Promise(function(resolve, reject) {
        Connections.remove({}, {multi: true}, function(err, numRemoved) {
            if (err) {
                console.log('Error removing connections', err);
                reject(err);
            }

            Connections.insert(newConnections, function(err, connections) {
                if (err) {
                    console.log('Error inserting new connections connections', err);
                    reject(err);
                }
                resolve(connections);
            })

        })
    })
}

/**
 * Query for connections that are being followed.
 * TODO: update query to take into account followed connections / set to offline?
 * TODO: need to take into account avatars
 */
function getConnections() {
    return new Promise(function(resolve, reject) {
        Connections.find({}, function(err, connections) {
            if (err) {
                console.log('There was an error finding connections', err);
                reject(err);
            }
            resolve(connections);
        });
    })
}

function getCorpus() {

}

function getHashtags() {

}

function getSession() {

}

function getSettings() {

}

/**
 * Replace all transcriptions data with imported transcriptions
 * @param newTranscriptions = array of transcriptions.
 * TODO: take into account media files.
 */
function replaceTranscriptions(newTranscriptions) {
    return new Promise(function(resolve, reject) {
        Transcriptions.remove({}, {multi: true}, function(err, numRemoved) {
            if (err) {
                console.log('Error removing transcriptions', err);
                reject(err);
            }
            Transcriptions.insert(newTranscriptions, function(err, transcriptions) {
                if (err) {
                    console.log('Error inserting new transcriptions', err);
                    reject(err);
                }
                resolve(transcriptions);
            })

        })
    })
}

/**
 * Query for all transcription files.
 * TODO: need to update function to take into account media files (independent vs attached notebooks)
 */
function getTranscriptions() {
    return new Promise(function(resolve, reject) {
        Transcriptions.find({}, function(err, transcriptions) {
            if (err) {
                console.log('There was an error finding transcriptions', err);
                reject(err);
            }
            resolve(transcriptions);
        });
    });
}

/**
 * Takes all notebooks, decodes, writes, and deletes buffer property.
 * @param array
 */
function decodeMediaFiles(array) {
    var mediaPromises = []; //store promises
    return new Promise(function(resolve, reject) {
        array.map(function(object) { //iterate through array
            if (object.imageBuffer) { //if there is an image buffer string

                var imageData = { //create an object with the path and buffer string to pass to wrtie media file function
                    buffer: data.imageBuffer,
                    path: object.image.path
                };

                mediaPromises.push( //push write media file promise
                    writeMediaFile(imageData).then(function() {
                        delete object.imageBuffer //delete the imagebuffer string
                    })
                )
            }
            if (object.audioBuffer) {

                var audioData = {
                    buffer: data.audioBuffer,
                    path: object.audio.path
                };

                mediaPromises.push(
                    writeMediaFile(audioData).then(function() {
                        delete object.audioBuffer
                    })
                )
            }
        });

        Promise.all(mediaPromises).then(function(results) { //once the promises are finished
            resolve(array); //resolve(array);

        })
    });
}

/**
 * Encodes media files into base64 buffer
 * Takes an array (like notebooks) and encodes the image and audio files, updates the notebook objects with a buffer property.
 * @param array - array of notebooks
 */
function encodeMediaFiles(array) {
    var mediaPromises = []; //create array t ohold promises
    return new Promise(function(resolve, reject) { //create new promise and return
        array.map(function(object) { //iterate through array an modify array
            if (object.image) {// if there is an image
                mediaPromises.push( //push the enodeBase64 promise
                    encodeBase64(object.image.path).then(function(imageBufferString) {
                        object.imageBufferString = imageBufferString; //add image buffer string as property
                    })
                )
            }

            if (object.audio) { //if there is an audio file
                mediaPromises.push(
                    encodeBase64(object.audio.path).then(function(audioBufferString) {
                        object.audioBufferString = audioBufferString;
                    })
                )
            }
        });

        Promise.all(mediaPromises).then(function() { //once all promises are resolved
            resolve(array); // resolve with the modified array
        })
    });
}

/**
 * Writes the media files to the file system
 * ata is a single
 * @param data - A single object containing media buffer and media path - {buffer: String, path: String}
 */
function writeMediaFile(data) {
    return new Promise(function(resolve, reject) {
        var mediaPath = path.join(config.root, '/server/data/', data.path); //the root path

        var buffer = new Buffer(data.buffer, 'base64', function(err) { //decode buffer bas364
            if (err) {
                console.log('issue decoding base64 data');
                reject(err);
            }
        });

        fs.writeFile(mediaPath, buffer, function(err) { //write the file to the file system
            if (err) {
                console.log('There was an error writing file to filesystem', err);
                reject(err);
            }
            resolve('success');
        })
    });
}

/**
 * Encodes a file to a base64 buffer string
 * @param mediaPath - String that is a relative path to a file.
 */
function encodeBase64(mediaPath) {
    var myPath = path.join(config.root, '/server/data/', mediaPath); //build a more 'absolute' path to the file
    return new Promise(function(resolve, reject){
        fs.readFile(myPath, function(err, data){
            if (err) {
                console.log('there was an error encoding media...', err);
                reject(err);
            }
            resolve(data.toString('base64')); //return a buffer string
        });
    });
}

/**
 * Query for user
 */
function getUser() {
    console.log('getUser called');
    return new Promise(function(resolve, reject) {
        User.findOne({}, function(err, user) {
            if (err) {
                console.log('There was an error finding user', err);
                reject(err)
            }
            resolve(user);
        });
    })
}

/**
 * Query for project
 * @param userId - the user _id
 */
function getProject(userId) {
    return new Promise(function(resolve, reject) {
        Projects.findOne({createdBy: userId}, function(err, project) {
            if (err) {
                console.log('There was an error finding project', err);
                reject(err);
            }
            resolve(project);
        });
    });
}

/**
 * Query for all user created notebooks
 * @param userId = user's _id
 * TODO: need to update query to include project id
 */
function getNotebook(userId) {
    return new Promise(function(resolve, reject) {
        var query = {'createdBy._id': userId};
        Notebooks.find(query, function(err, myNotebooks) {
            if (err) {
                console.log('There was an error finding notebooks', err);
                reject(err);
            }
            encodeMediaFiles(myNotebooks).then(function(notebooksWithBuffer) { //encode all media files and attache buffer as property
                resolve(notebooksWithBuffer);
            });

        });
    })
}


/**
 * Replaces all notebooks with imported notebook data
 * @param newNotebooks = an array of imported notebooks
 */
function replaceNotebooks(newNotebooks) {
    return new Promise(function(resolve, reject) {
        Notebooks.remove({}, {multi: true}, function(err, numRemoved) {//remove all notebooks
            if (err) {
                console.log('Error removing notebooks', err);
                reject(err);
            }

            decodeMediaFiles(newNotebooks).then(function(notebooksWithoutBuffer) { //decode, write, and remove buffer property of notebooks
                Notebooks.insert(notebooksWithoutBuffer, function(err, notebooks) {//insert notebooks without buffer string
                    if (err) {
                        console.log('Error inserting new notebooks', err);
                        reject(err);
                    }
                    resolve(notebooks);
                })
            })
        })
    })
}




function handleError(res, err) {
    return res.status(500).send(err);
}
