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
var AdmZip = require('adm-zip');


var User = require('./../user/user.model');
var Notebooks = require('./../notebook/notebook.model');
var Transcriptions = require('./../transcription/transcription.model');
var Projects = require('./../project/project.model');
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

exports.exportProject = function(req, res) {
    console.log('exportProject called');
    console.log('req.params', req.params);
    var userId = req.params.userId;
    var projectId = req.params.projectId;

    var me = {};
    var myProject = {};
    var myNotebooks;

    var databasePromises = [];

    databasePromises.push(getUser());

    databasePromises.push(getProject(userId));

    databasePromises.push(getNotebook(userId));

    Promise.all(databasePromises).then(function(results) {
        console.log('TODO: do everything else with data');

        me = results[0];
        myProject = results[1];
        myNotebooks = results[2];





        createExportDirecotry(myProject).then(function(exportTempPath) {

            getMediaFiles(myNotebooks).then(function(notebooksWithBuffer) {
                console.log('notebooksWithBuffer returned');

                var myJson = {
                    notebooks: notebooksWithBuffer
                };
                console.log('createExportDirecotry promise resolved');

                var fileName = path.join(exportTempPath, 'notebooks.json');

                createJsonFile(myJson, fileName).then(function() {
                    console.log('createJsonFile promise resolved');

                    var zip = new AdmZip();
                    console.log('zip', zip);

                    zip.addLocalFolder(exportTempPath);
                    console.log('debug1 ');

                    zip.writeZip(__dirname);
                    console.log('debug2 ');

                })

            });
        })



    });

};

function getMediaFiles(array) {
    var mediaPromises = [];
    return new Promise(function(resolve, reject) {
        array.map(function(object) {
            if (object.image) {
                mediaPromises.push(
                    encodeBase64(object.image.path).then(function(imageBufferString) {
                        console.log('Encoded notebook Image.');
                        object.imageBufferString = imageBufferString;
                    })
                )
            }

            if (object.audio) {
                mediaPromises.push(
                    encodeBase64(object.audio.path).then(function(audioBufferString) {
                        console.log('Encoded notebook Audio.');
                        object.audioBufferString = audioBufferString;
                    })
                )
            }
        });

        Promise.all(mediaPromises).then(function() {
            resolve(array);
        })
    });
}


// function getMediaFiles(array) {
//     return new Promise(function(resolve, reject) {
//         array.map(function(object) {
//             if (object.image) {
//                 encodeBase64(object.image.path).then(function(imageBufferString) {
//                     console.log('Encoded notebook Image.');
//                     object.imageBufferString = imageBufferString;
//                 })
//             }
//             if (object.audio) {
//                 encodeBase64(object.audio.path).then(function(audioBufferString) {
//                     console.log('Encoded notebook Audio.');
//                     object.audioBufferString = audioBufferString;
//                 })
//             }
//         });
//         resolve(array);
//     });
// }

function encodeBase64(mediaPath) {
    var myPath = path.join(config.root, '/server/data/', mediaPath);
    return new Promise(function(resolve, reject){
        fs.readFile(myPath, function(err, data){
            if (err) {
                console.log('there was an error encoding media...', err);
                reject(err);
            }
            resolve(data.toString('base64'));
        });
    });
}

function createJsonFile(object, name) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(name, JSON.stringify(object), 'utf8', function(err) {
            if (err) {
                console.log('Error writing json file', err);
                reject(err)
            }
            console.log('created ' + name + ' file success!');
            resolve()
        });
    })
}

function createExportDirecotry(project) {
    return new Promise(function(resolve, reject) {
        var exportTempPath = path.join(config.root, 'server/data', 'glossa-' + project._id);
        fs.mkdir(exportTempPath, function(err) {
            if (err) {
                console.log('There was an error creating export directory', err);
                reject(err);
            }
            console.log('Created Temp directory success!');
            resolve(exportTempPath)
        })
    })
}

function getUser() {
    console.log('getUser called');
    return new Promise(function(resolve, reject) {
        User.findOne({}, function(err, user) {
            if (err) {
                console.log('There was an error finding user', err);
                reject(err)
            }
            console.log('user found', user);
            resolve(user);
        });
    })
}
function getProject(userId) {
    return new Promise(function(resolve, reject) {
        Projects.findOne({createdBy: userId}, function(err, project) {
            if (err) {
                console.log('There was an error finding project', err);
                reject(err);
            }
            console.log('project found:', project);
            resolve(project);
        });
    });
}

function getNotebook(userId) {
    return new Promise(function(resolve, reject) {
        var query = {'createdBy._id': userId};
        Notebooks.find(query, function(err, myNotebooks) {
            if (err) {
                console.log('There was an error finding notebooks', err);
                reject(err);
            }
            console.log('myNotebooks', myNotebooks);
            resolve(myNotebooks);
        });
    })
}


function handleError(res, err) {
    return res.status(500).send(err);
}
