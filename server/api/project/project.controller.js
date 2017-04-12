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

exports.exportProject = function(req, res) {
    console.log('exportProject called');
    var userId = req.params.userId;
    var projectId = req.params.projectId;
    var projectData = {};
    var databasePromises = [];

    //TODO: queries need to be refractored
    databasePromises.push(getUser());
    databasePromises.push(getProject(userId));
    databasePromises.push(getNotebook(userId));
    databasePromises.push(getConnections());
    databasePromises.push(getTranscriptions());

    Promise.all(databasePromises).then(function(results) {
        console.log('TODO: do everything else with data');

        projectData.user = results[0];
        projectData.project = results[1];
        projectData.notebooks = results[2];
        projectData.connections = results[3];
        projectData.transcriptions = results[4];


        //sending response to here

        res.set('Content-disposition', 'attachment; filename=' + 'project-' +  projectData.project._id + '.glossa');
        res.set('Content-Type', 'application/zip');

        var archive = archiver('zip'); // Sets the compression level.

        archive.pipe(res);

        archive.on('error', function(err) {
            console.error(err);
            throw err;
        });

        res.on('close', function() {
            console.log('closing zip');
            return res.status(200).send('OK').end();
        });

        archive.append(JSON.stringify(projectData), { name: 'project-' +  projectData.project._id + '.json'});

        archive.finalize();

    })
};

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

function decodeMediaFiles(array) {
    var mediaPromises = [];
    return new Promise(function(resolve, reject) {
        array.map(function(object) {
            if (object.imageBuffer) {

                var imageData = {
                    buffer: data.imageBuffer,
                    path: object.image.path
                };

                mediaPromises.push(
                    writeMediaFile(imageData).then(function() {
                        delete object.imageBuffer
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
        Promise.all(mediaPromises).then(function(results) {
            resolve(array);
        })
    });
}





function encodeMediaFiles(array) {
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


// function encodeMediaFiles(array) {
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

function writeMediaFile(data) {
    return new Promise(function(resolve, reject) {
        var mediaPath = path.join(config.root, '/server/data/', data.path);

        var buffer = new Buffer(data.buffer, 'base64', function(err) {
            if (err) {
                console.log('issue decoding base64 data');
                reject(err);
            }
            console.log('buffer created....');
        });

        fs.writeFile(mediaPath, buffer, function(err) {
            if (err) {
                console.log('There was an error writing file to filesystem', err);
                reject(err);
            }
            console.log('media file written to file system');
            resolve('success');
        })
    });
}

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

function replaceNotebooks(newNotebooks) {
    return new Promise(function(resolve, reject) {
        Notebooks.remove({}, {multi: true}, function(err, numRemoved) {
            if (err) {
                console.log('Error removing notebooks', err);
                reject(err);
            }

            decodeMediaFiles(newNotebooks).then(function(notebooksWithoutBuffer) {
                console.log('notebooksWithoutBuffer.length', notebooksWithoutBuffer.length);
                Notebooks.insert(notebooksWithoutBuffer, function(err, notebooks) {
                    if (err) {
                        console.log('Error inserting new notebooks', err);
                        reject(err);
                    }
                    console.log('notebooks.length', notebooks.length);
                    resolve(notebooks);
                })
            })
        })
    })
}

function getNotebook(userId) {
    return new Promise(function(resolve, reject) {
        var query = {'createdBy._id': userId};
        Notebooks.find(query, function(err, myNotebooks) {
            if (err) {
                console.log('There was an error finding notebooks', err);
                reject(err);
            }

            encodeMediaFiles(myNotebooks).then(function(notebooksWithBuffer) {
                resolve(notebooksWithBuffer);
            });

        });
    })
}


function handleError(res, err) {
    return res.status(500).send(err);
}
