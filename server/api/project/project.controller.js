/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';


const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const config = require('./../../config/environment/index');
const Projects = require('./project.model');
const User = require('./../user/user.model');
const Notebooks = require('./../notebook/notebook.model');
const Transcriptions = require('./../transcription/transcription.model');
const Hashtags = require('./../hashtag/hashtag.model');
const Connections = require('./../connections/connection.model');
// let Connections = require('./../connections/connections.model');


// let globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = (req, res) => {
  Projects.find({}, function (err, project) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(project);
  });
};

// Get a single thing
exports.show = (req, res) => {
  Projects.findOne({_id: req.params.id}, function (err, project) {
    if (err) {
      return handleError(res, err);
    }
    if (!project) {
      return res.status(404).send('Not Found');
    }
    return res.json(project);
  });
};

// Creates a new thing in the DB.
exports.create = (req, res) => {
  let project = req.body;
  Projects.insert(project, function (err, c) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(c);
  });
};

// Updates an existing project in the DB.
//becuase this could potentially have uploaded files, the body object is, dataObj instead of project...
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Projects.findOne({_id: req.params.id}, function (err, project) {
    if (err) {
      return handleError(res, err);
    }
    if (!project) {
      return res.status(404).send('Not Found');
    }
    let options = {returnUpdatedDocs: true};
    let updated = _.merge(project, req.body);
    Projects.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }
      global.appData.initialState.project = Object.assign({}, updatedDoc);
      Projects.persistence.compactDatafile(); // concat db
      return res.status(200).json(updatedDoc);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
  Projects.findById(req.params.id, function (err, thing) {
    if (err) {
      return handleError(res, err);
    }
    if (!thing) {
      return res.status(404).send('Not Found');
    }
    thing.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

/**
 * Import all project data
 * @param req
 * @param res
 */
exports.importProject = (req, res) => {
  console.log('TODO: REMOVE ALL MEDIA FILES FROM FILE SYSTEM!!!!!!!!!');
  let newProjectData;
  let zip = new AdmZip(req.body.projectPath);
  let zipEntries = zip.getEntries();
  zipEntries.forEach((zipEntry) => {
    newProjectData = JSON.parse(zip.readAsText(zipEntry));
    let replacePromises = [];

    replacePromises.push(replaceUser(newProjectData.user));
    replacePromises.push(replaceProject(newProjectData.project));
    replacePromises.push(replaceNotebooks(newProjectData.notebooks));
    replacePromises.push(replaceConnections(newProjectData.connections));
    replacePromises.push(replaceTranscriptions(newProjectData.transcriptions));
    replacePromises.push(replaceHashtags(newProjectData.hashtags));
    replacePromises.push(replaceCorporia(newProjectData.corporia));

    Promise.all(replacePromises).then((results) => {

      let updatedData = {
        user: results[0],
        project: results[1],
        notebooks: results[2],
        connections: results[3],
        transcriptions: results[4],
        hashtags: results[5],
        corporia: results[6],
      };

      return res.status(200).send(updatedData);
    });

  });
};

/**
 * Export all project data
 * @param req
 *  req.body = {userId: string, projectId: string}
 * @param res
 */
exports.exportProject = function (req, res) {
  let userId = req.params.userId;
  let projectId = req.params.projectId;
  let projectData = {};//initiate project data object
  let databasePromises = [];//initiate promise array

  //TODO: queries need to be refractored
  //push application data(promises) to array
  databasePromises.push(getUser());
  databasePromises.push(getProject(userId));
  databasePromises.push(getNotebooks(userId));
  databasePromises.push(getConnections());
  databasePromises.push(getTranscriptions());
  databasePromises.push(getHashtags());
  databasePromises.push(getCorporia());

  Promise.all(databasePromises).then((results) => {//once all the promises have resolved

    let archive = archiver('zip'); // Sets the compression level.

    //update the application data object
    projectData.user = results[0];
    projectData.project = results[1];
    projectData.notebooks = results[2];
    projectData.connections = results[3]; //TODO: get avatars
    projectData.transcriptions = results[4]; //TODO: get media files
    projectData.hashtags = results[5];
    projectData.corporia = results[6];

    //create and stream zip file

    // console.log('notebooks being exported: ', projectData.notebooks.length);
    // console.log('Image buffer?', !!projectData.notebooks[0].imageBuffer);
    // console.log('Image buffer?', !!projectData.notebooks[1].imageBuffer);

    var projectNameNoSpace = projectData.project.name.replace(/\s/g, '');

    res.set('Content-disposition', `attachment; filename=Project-${projectNameNoSpace}.glossa`); //set header info / project name
    res.set('Content-Type', 'application/zip');


    archive.pipe(res); //pipe the response
    //add file to archive

    archive.append(JSON.stringify(projectData), {name: `project-${projectData.project._id}.json`});

    archive.on('error', (err) => { ///if there is an error....
      console.error(err);
      throw err;
    });

    res.on('close', () => { //when the response is done
      return res.status(200).send('OK').end(); //send response to client
    });

    archive.finalize();

  })
};


/**
 * Query for user
 */
function getUser() {
  return new Promise((resolve, reject) => {
    User.findOne({}, (err, user) => {
      if (err) {
        console.log('There was an error finding user', err);
        reject(err)
      }
      if (user.avatar) {
        encodeBase64(user.avatar).then((imageBufferString) => {
          user.imageBufferString = imageBufferString;
          resolve(user);

        });
      } else {
        resolve(user);
      }
    });
  })
}
/**
 * Query for project
 * @param userId - the user _id
 */
function getProject(userId) {
  return new Promise((resolve, reject) => {
    Projects.find({createdBy: userId}, (err, project) => {
      if (err) {
        console.log('There was an error finding project', err);
        reject(err);
      }
      resolve(project[0]);
    });
  });
}
/**
 * Query for all user created notebooks
 * @param userId = user's _id
 * TODO: need to update query to include project id
 */
function getNotebooks(userId) {
  return new Promise(function (resolve, reject) {
    let query = {'createdBy._id': userId};
    Notebooks.find(query, function (err, myNotebooks) {
      if (err) {
        console.log('There was an error finding notebooks', err);
        reject(err);
      }
      encodeMediaFiles(myNotebooks).then(function (notebooksWithBuffer) { //encode all media files and attache buffer as property
        resolve(notebooksWithBuffer);
      });

    });
  })
}
/**
 * Query for connections that are being followed.
 * TODO: need to take into account avatars
 */
function getConnections() {
  return new Promise((resolve, reject) => {
    let query = {following: true};
    Connections.find(query, (err, connections) => {
      if (err) {
        console.log('There was an error finding connections', err);
        reject(err);
      }

      connections.forEach((connection) => {
        connection.online = false; //set online to false for consistency.
        if (connection.avatar) {
          encodeBase64(connection.avatar).then(function (imageBufferString) {
            connection.imageBufferString = imageBufferString;
          })
        }
      });

      resolve(connections);
    });
  })
}
/**
 * Query for all transcription files.
 * TODO: need to update function to take into account media files (independent vs attached notebooks)
 */
function getTranscriptions() {
  return new Promise((resolve, reject) => {
    Transcriptions.find({}, (err, transcriptions) => {
      if (err) {
        console.log('There was an error finding transcriptions', err);
        reject(err);
      }
      encodeMediaFiles(transcriptions).then((transcriptionsWithBuffer) => {
        resolve(transcriptionsWithBuffer);
      });
    });
  });
}

function getHashtags() {
  return new Promise((resolve, reject) => {
    let query = {canEdit: true};
    Hashtags.find(query, (err, hashtags) => {
      if (err) {
        console.log('There was an error finding hashtags', err);
        reject(err)
      }
      resolve(hashtags);
    });
  })
}

function getCorporia() {
  return new Promise((resolve, reject) => {
    Corporia.find({}, (err, corporia) => {
      if (err) {
        console.log('There was an error finding corporia', err);
        reject(err)
      }
      resolve(corporia);
    });
  })
}


/**
 * Replace the user data (writes avatar)
 */
function replaceUser(newUser) {
  return new Promise((resolve, reject) => {
    User.remove({}, {multi: true}, (err, numRemoved) => {
      if (err) {
        console.log('Error removing user', err);
        reject(err);
      }

      if (newUser.avatar) {

        let userAvatarData = {
          path: newUser.avatar,
          buffer: newUser.imageBufferString
        };

        writeMediaFile(userAvatarData);

        delete newUser.imageBufferString;
      }


      User.insert(newUser, (err, user) => {
        if (err) {
          console.log('Error inserting new user ', err);
          reject(err);
        }
        resolve(user);
      })
    })
  })
}

function replaceProject(newProject) {
  return new Promise((resolve, reject) => {
    Projects.remove({}, {multi: true}, (err, numRemoved) => {
      if (err) {
        console.log('Error removing project', err);
        reject(err);
      }

      Projects.insert(newProject, (err, project) => {
        if (err) {
          console.log('Error inserting new user ', err);
          reject(err);
        }
        resolve(project);
      })
    })
  })
}
/**
 * Replaces all notebooks with imported notebook data
 * @param newNotebooks = an array of imported notebooks
 */
function replaceNotebooks(newNotebooks) {
  return new Promise(function (resolve, reject) {
    Notebooks.remove({}, {multi: true}, function (err, numRemoved) {//remove all notebooks
      if (err) {
        console.log('Error removing notebooks', err);
        reject(err);
      }

      decodeMediaFiles(newNotebooks).then(function (notebooksWithoutBuffer) { //decode, write, and remove buffer property of notebooks
        Notebooks.insert(notebooksWithoutBuffer, function (err, notebooks) {//insert notebooks without buffer string
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
/**
 * Replace all connections with imported connections
 * @param newConnections
 * TODO: need to take into account avatars
 */
function replaceConnections(newConnections) {
  return new Promise(function (resolve, reject) {
    Connections.remove({}, {multi: true}, function (err, numRemoved) {
      if (err) {
        console.log('Error removing connections', err);
        reject(err);
      }

      newConnections.forEach((connection) => {
        if (connection.avatar) {
          writeMediaFile({path: connection.avatar, buffer: connection.imageBufferString});
          delete connection.imageBufferString;
        }
      });

      Connections.insert(newConnections, function (err, connections) {
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
 * Replace all transcriptions data with imported transcriptions
 * @param newTranscriptions = array of transcriptions.
 * TODO: take into account media files.
 */
function replaceTranscriptions(newTranscriptions) {
  return new Promise((resolve, reject) => {
    Transcriptions.remove({}, {multi: true}, (err, numRemoved) => {
      if (err) {
        console.log('Error removing transcriptions', err);
        reject(err);
      }
      decodeMediaFiles(newTranscriptions).then((transWithouBuffer) => {
        Transcriptions.insert(transWithouBuffer, (err, transcriptions) => {
          if (err) {
            console.log('Error inserting new transcriptions', err);
            reject(err);
          }
          resolve(transcriptions);
        })
      });
    })
  })
}

function replaceHashtags(newHashtags) {
  return new Promise((resolve, reject) => {
    Hashtags.remove({}, {multi: true}, (err, numRemoved) => {
      if (err) {
        console.log('Error removing hashtags', err);
        reject(err);
      }
      Hashtags.insert(newHashtags, (err, hashtags) => {
        if (err) {
          console.log('Error inserting new user ', err);
          reject(err);
        }
        resolve(hashtags);
      })
    })
  })
}

function replaceCorporia(newCorpus) {
  return new Promise((resolve, reject) => {
    Corporia.remove({}, {multi: true}, (err, numRemoved) => {
      if (err) {
        console.log('Error removing corpus', err);
        reject(err);
      }
      Corporia.insert(newCorpus, (err, corpus) => {
        if (err) {
          console.log('Error inserting new corpus ', err);
          reject(err);
        }
        resolve(corpus);
      })
    })
  })
}


/**
 * Encodes media files into base64 buffer
 * Takes an array (like notebooks) and encodes the image and audio files, updates the notebook objects with a buffer property.
 * @param array - array of notebooks
 */
function encodeMediaFiles(array) {
  let mediaPromises = []; //create array t ohold promises
  return new Promise(function (resolve, reject) { //create new promise and return
    array.map(function (object) { //iterate through array an modify array
      if (object.image) {// if there is an image
        mediaPromises.push( //push the enodeBase64 promise
          encodeBase64(object.image.path).then(function (imageBufferString) {
            object.imageBufferString = imageBufferString; //add image buffer string as property
          })
        )
      }

      if (object.audio) { //if there is an audio file
        mediaPromises.push(
          encodeBase64(object.audio.path).then(function (audioBufferString) {
            object.audioBufferString = audioBufferString;
          })
        )
      }
    });

    Promise.all(mediaPromises).then(function () { //once all promises are resolved
      resolve(array); // resolve with the modified array
    })
  });
}
/**
 * Takes all notebooks, decodes, writes, and deletes buffer property.
 * @param array
 */
function decodeMediaFiles(array) {
  let mediaPromises = []; //store promises
  return new Promise((resolve, reject) => {
    array.map((object) => { //iterate through array
      if (object.imageBufferString) { //if there is an image buffer string

        let imageData = { //create an object with the path and buffer string to pass to wrtie media file function
          buffer: object.imageBufferString,
          path: object.image.path
        };

        mediaPromises.push( //push write media file promise
          writeMediaFile(imageData).then(() => {
            delete object.imageBufferString; //delete the imagebuffer string
          })
        )
      }
      if (object.audioBufferString) {

        let audioData = {
          buffer: object.audioBufferString,
          path: object.audio.path
        };

        mediaPromises.push(
          writeMediaFile(audioData).then(() => {
            delete object.audioBufferString
          })
        )
      }
    });

    Promise.all(mediaPromises).then((results) => { //once the promises are finished
      resolve(array); //resolve(array);
    })
  });
}


/**
 * Writes the media files to the file system
 * ata is a single
 * @param data - A single object containing media buffer and media path - {buffer: String, path: String}
 */
function writeMediaFile(data) {
  return new Promise(function (resolve, reject) {
    let mediaPath = path.join(config.root, '/server/data/', data.path); //the root path

    let buffer = new Buffer(data.buffer, 'base64', function (err) { //decode buffer bas364
      if (err) {
        console.log('issue decoding base64 data');
        reject(err);
      }
    });

    fs.writeFile(mediaPath, buffer, function (err) { //write the file to the file system
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
  let myPath = path.join(config.root, '/server/data/', mediaPath); //build a more 'absolute' path to the file
  return new Promise(function (resolve, reject) {
    fs.readFile(myPath, function (err, data) {
      if (err) {
        console.log('there was an error encoding media...', err);
        reject(err);
      }
      resolve(data.toString('base64')); //return a buffer string
    });
  });
}


function handleError(res, err) {
  return res.status(500).send(err);
}
