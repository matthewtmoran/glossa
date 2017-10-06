/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const app = require('electron').app;
const Notebook = require('./notebook.model');
const Transcriptions = require('../transcription/transcription.model');
const User = require('../user/user.model');
const Setting = require('../settings/settings.model');


module.exports = (io) => {

  this.index = function (req, res) {
    Notebook.find({}, function (err, notebooks) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(notebooks);
    });
  };

  this.show = function (req, res) {
    Notebook.findOne({_id: req.params.id}, function (err, notebook) {
      if (err) {
        return handleError(res, err);
      }
      if (!notebook) {
        return res.status(404).send('Not Found');
      }
      return res.json(notebook);
    });
  };

  this.create = function (req, res) {
    console.log('notebook being created');
    let newNotebook = req.body.dataObj;
    newNotebook.createdAt = Date.now();
    newNotebook.updatedAt = Date.now();
    Setting.findOne({}, (err, settings) => {
      if (err) {
       return console.log('error finding user');
      }


      Notebook.insert(newNotebook, (err, notebook) => {
        if (err) {
          return handleError(res, err);
        }
        console.log('notebook inserted');
        if (settings.isSharing) {
          console.log('user is sharing');

          parseNotebook(notebook)
            .then((notebookWithMedia) => {
              console.log('notebook parsed and ready to broadcast');
              console.log('emit:: rt:new-notebook');
              io.to('externalClientsRoom').emit('rt:notebook', notebookWithMedia);
              return res.status(201).json(notebook);
            });

        } else {
          console.log('user not sharing ');
          return res.status(201).json(notebook);
        }
      });


    });
  };


  this.update = function (req, res) {
    if (req.body._id) {
      delete req.body._id;
    }
    Notebook.findOne({_id: req.params.id}, function (err, notebook) {
      if (err) {
        return handleError(res, err);
      }
      if (!notebook) {
        return res.status(404).send('Not Found');
      }
      const options = {returnUpdatedDocs: true};
      let updated = _.merge(notebook, req.body.dataObj);
      updated.updatedAt = Date.now();
      // hashtags will either be array of tags or an empty array
      updated.hashtags = req.body.dataObj.hashtags || [];
      Notebook.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
        if (err) {
          return handleError(res, err);
        }

        Notebook.persistence.compactDatafile(); // concat db


        Setting.findOne({}, (err, settings) => {
          if (err) {}
          if (settings.isSharing) {
            parseNotebook(updatedDoc)
              .then((notebookWithMedia) => {
                console.log('notebook parsed and ready to broadcast');
                console.log('emit:: rt:new-notebook');
                io.to('externalClientsRoom').emit('rt:notebook', notebookWithMedia);
                return res.status(201).json(updatedDoc);
              });
          } else {
            console.log('user not sharing ');
            return res.status(201).json(updatedDoc);
          }
        });
      });
    });
  };

  this.destroy = function (req, res) {
    Notebook.findOne({_id: req.params.id}, (err, notebook) => {
      if (err) {
        return handleError(res, err);
      }
      let transcriptionPromises = [];
      Transcriptions.find({notebookId: req.params.id}, (err, transcriptions) => {
        if (err) {
          return handleError(res, err);
        }
        if (transcriptions.length > 0) {
          transcriptions.forEach((file) => {
            //make notebooks images independent media files
            if (notebook.image) {
              file.image = notebook.image;
            }
            if (notebook.audio) {
              file.audio = notebook.audio;
            }
            //remove the notebook connection
            delete file.notebookId;
            transcriptionPromises.push(updateTranscription(file))
          })
        }
      });
      Notebook.remove({_id: req.params.id}, (err, numRemoved) => {
        if (err) {
          return handleError(res, err);
        }
        if (transcriptionPromises.length) {
          Promise.all(transcriptionPromises)
            .then((results) => {
              return res.status(204).send({notebookId: req.params.id, transcriptions: results});
            })
            .catch((err) => {
              return console.log('error normalizeing transcriptiosn: ', err);
            })
        }
        return res.status(204).send({notebookId: req.params.id});
      });
    });
  };

  this.normalizeNotebooks = function (user) {
    return new Promise((resolve, reject) => {
      const query = {"createdBy._id": user._id};
      const options = {returnUpdatedDocs: true, multi: true};
      const update = {
        $set: {
          "createdBy.name": user.name,
          "createdBy.avatar": user.avatar
        }
      };
      Notebook.update(query, update, options, function (err, updatedCount, updatedDocs) {
        if (err) {
          console.log('Error normalizing notebook data', err);
          reject(err);
        }
        Notebook.persistence.compactDatafile();
        resolve(updatedDocs);
      });
    });
  };

  this.getExistingNotebooks = function (user) {
    console.log('looking for noteooks created by user:', user);
    return new Promise((resolve, reject) => {
      const query = {
        'createdBy._id': user._id
      };
      //project only updatedAt, createdAt and _id(default)
      const projection = {
        updatedAt: 1,
        createdAt: 1
      };
      Notebook.find(query, projection, (err, notebooks) => {
        if (err) {
          reject(err);
        }
        if (!notebooks) {
          console.log('no notebooks from user exist');
          resolve([]);
        }
        console.log('found notebooks from user:', notebooks.length);
        resolve(notebooks);
      })
    })
  };

  this.getNewAndUpdatedNotebooks = function (existingNotebooks) {
    console.log('existingNotebooks: ', existingNotebooks);
    return new Promise((resolve, reject) => {
      let promises = [];
      let notebooksToSend = [];
      User.findOne({}, (err, user) => {
        if (err) {
          reject(err)
        }
        Notebook.find({"createdBy._id": user._id}, (err, notebooks) => {

          if (existingNotebooks.length === 0) {
            notebooksToSend = notebooks.map((notebook) => {
              if (notebook.image) {
                promises.push(
                  encodeBase64(notebook.image.absolutePath).then(imageBufferString => {
                    notebook.imageBuffer = imageBufferString;
                  })
                )
              }
              if (notebook.audio) {
                promises.push(
                  encodeBase64(notebook.audio.absolutePath).then(audioBufferString => {
                    notebook.audioBuffer = audioBufferString;
                  })
                )
              }
              return notebook;
            });

          } else {
            notebooksToSend = notebooks.filter((notebook) => {

              let notebookExists = false;
              let notebookNeedsUpdate = false;

              //run through the data we have
              existingNotebooks.forEach((oldNotebook) => {
                //if we have the data set the exist flag to true
                if (oldNotebook._id === notebook._id) {
                  notebookExists = true;

                  //check if notebook needs to be updated.
                  //if the times are note equal
                  if (notebook.updatedAt !== oldNotebook.updatedAt) {
                    //and if the time of the new notebook is greater than the oldData notebook match
                    //we know there must be an update to this specific notebook;
                    //TODO: maybe to a deep object comparison...
                    if (notebook.updatedAt > oldNotebook.updatedAt) {
                      notebookNeedsUpdate = true;
                    }
                  }
                }
              });

              //if the notebook does not exist or if the notebook needs to be updated
              //this means it's a new notebook or a notebook that has a newer updated time
              //we assume it needs to be updatd
              //we don't care what data has changed, we grab it all
              if (!notebookExists || notebookNeedsUpdate) {

                if (notebook.image) {
                  promises.push(
                    encodeBase64(notebook.image.absolutePath)
                      .then((imageString) => {
                        notebook.imageBuffer = imageString;
                      })
                  );
                }
                if (notebook.audio) {
                  promises.push(
                    encodeBase64(notebook.audio.absolutePath)
                      .then((audioString) => {
                        notebook.audioBuffer = audioString;
                      })
                  )
                }
                //only return notebook if it has update or is new.
                return notebook;
              }
            });
          }

          Promise.all(promises)
            .then(result => {
              resolve(notebooksToSend);
            })
        })
      });
    })
  };

  this.newDataReturned = function (notebook) {
    return new Promise((resolve, reject) => {
      //write the media buffers to the file system
      writeSyncedMedia(notebook)
        .then((notebook) => {
          //when that is complete, update the database
          updateOrInsertNotebooks(notebook)
            .then((notebook) => {
              resolve(notebook);
            })
            .catch((err) => {
              console.log('error updating or inserting notebook', err);
            })
        })
        .catch((err) => {
          console.log('error writing synced media', err);
          reject(err);
        })
    });
  };

  return this;
};

function parseNotebook(notebook) {
  return new Promise((resolve, reject) => {
    let promises = [];

    //encode image
    if (notebook.image) {
      promises.push(
        encodeBase64(notebook.image.absolutePath)
          .then((imageString) => {
            notebook.imageBuffer = imageString;
          })
      )
    }

    //encode audio
    if (notebook.audio) {
      promises.push(
        encodeBase64(notebook.audio.absolutePath)
          .then((audioString) => {
            notebook.audioBuffer = audioString;
          })
      )
    }
    if (promises.length) {
      Promise.all(promises)
        .then((result) => {
          resolve(notebook);
        });
    } else {
      resolve(notebook);
    }
  })
}


//
// // var globalPaths = require('electron').remote.getGlobal('userPaths');
// // Get list of things
// exports.index = function (req, res) {
//   Notebook.find({}, function (err, notebooks) {
//     if (err) {
//       return handleError(res, err);
//     }
//     return res.status(200).json(notebooks);
//   });
// };
// // Get a single thing
// exports.show = function (req, res) {
//   Notebook.findOne({_id: req.params.id}, function (err, notebook) {
//     if (err) {
//       return handleError(res, err);
//     }
//     if (!notebook) {
//       return res.status(404).send('Not Found');
//     }
//     return res.json(notebook);
//   });
// };
// // Creates a new thing in the DB.
// exports.create = function (req, res) {
//   let newNotebook = req.body.dataObj;
//   newNotebook.createdAt = Date.now();
//   newNotebook.updatedAt = Date.now();
//   Notebook.insert(req.body.dataObj, function (err, notebook) {
//     if (err) {
//       return handleError(res, err);
//     }
//     return res.status(201).json(notebook);
//   });
// };
// // Updates an existing notebooks in the DB.
// //becuase this could potentially have uploaded files, the body object is, dataObj instead of notebooks...
// exports.update = function (req, res) {
//   if (req.body._id) {
//     delete req.body._id;
//   }
//   Notebook.findOne({_id: req.params.id}, function (err, notebook) {
//     if (err) {
//       return handleError(res, err);
//     }
//     if (!notebook) {
//       return res.status(404).send('Not Found');
//     }
//     const options = {returnUpdatedDocs: true};
//     let updated = _.merge(notebook, req.body.dataObj);
//     updated.updatedAt = Date.now();
//     // hashtags will either be array of tags or an empty array
//     updated.hashtags = req.body.dataObj.hashtags || [];
//     Notebook.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
//       if (err) {
//         return handleError(res, err);
//       }
//
//       Notebook.persistence.compactDatafile(); // concat db
//       return res.status(200).json(updatedDoc);
//     });
//   });
// };
// // Deletes a thing from the DB.
// exports.destroy = function (req, res) {
//   Notebook.findOne({_id: req.params.id}, (err, notebook) => {
//     if (err) {
//       return handleError(res, err);
//     }
//     let transcriptionPromises = [];
//     Transcriptions.find({notebookId: req.params.id}, (err, transcriptions) => {
//       if (err) {
//         return handleError(res, err);
//       }
//       if (transcriptions.length > 0) {
//         transcriptions.forEach((file) => {
//           //make notebooks images independent media files
//           if (notebook.image) {
//             file.image = notebook.image;
//           }
//           if (notebook.audio) {
//             file.audio = notebook.audio;
//           }
//           //remove the notebook connection
//           delete file.notebookId;
//           transcriptionPromises.push(updateTranscription(file))
//         })
//       }
//     });
//     Notebook.remove({_id: req.params.id}, (err, numRemoved) => {
//       if (err) {
//         return handleError(res, err);
//       }
//       if (transcriptionPromises.length) {
//         Promise.all(transcriptionPromises)
//           .then((results) => {
//             return res.status(204).send({notebookId: req.params.id, transcriptions: results});
//           })
//           .catch((err) => {
//             return console.log('error normalizeing transcriptiosn: ', err);
//           })
//       }
//       return res.status(204).send({notebookId: req.params.id});
//     });
//   });
// };
//
// exports.normalizeNotebooks = function(user) {
//   return new Promise((resolve, reject) => {
//     const query = {"createdBy._id": user._id};
//     const options = {returnUpdatedDocs: true, multi: true};
//     const update = {
//       $set: {
//         "createdBy.name": user.name,
//         "createdBy.avatar": user.avatar
//       }
//     };
//     Notebook.update(query, update, options, function (err, updatedCount, updatedDocs) {
//       if (err) {
//         console.log('Error normalizing notebook data', err);
//         reject(err);
//       }
//       Notebook.persistence.compactDatafile();
//       resolve(updatedDocs);
//     });
//   });
// };
//
// exports.getExistingNotebooks = function(user) {
//   console.log('looking for noteooks created by user:', user);
//   return new Promise((resolve, reject) => {
//     const query = {
//       'createdBy._id': user._id
//     };
//     //project only updatedAt, createdAt and _id(default)
//     const projection = {
//       updatedAt: 1,
//       createdAt: 1
//     };
//     Notebook.find(query, projection, (err, notebooks) => {
//       if (err) {reject(err);}
//       if (!notebooks) {
//         console.log('no notebooks from user exist');
//         resolve([]);
//       }
//       console.log('found notebooks from user:', notebooks.length);
//       resolve(notebooks);
//     })
//   })
// };
//
// exports.getNewAndUpdatedNotebooks = function(existingNotebooks) {
//   console.log('existingNotebooks: ', existingNotebooks);
//   return new Promise((resolve, reject) => {
//     let promises = [];
//     let notebooksToSend = [];
//     User.findOne({}, (err, user) => {
//       if (err) {reject(err)}
//       Notebook.find({"createdBy._id": user._id}, (err, notebooks) => {
//
//         if (existingNotebooks.length === 0) {
//           notebooksToSend = notebooks.map((notebook) => {
//             if (notebook.image) {
//               promises.push(
//                 encodeBase64(notebook.image.absolutePath).then(imageBufferString => {
//                   notebook.imageBuffer = imageBufferString;
//                 })
//               )
//             }
//             if (notebook.audio) {
//               promises.push(
//                 encodeBase64(notebook.audio.absolutePath).then(audioBufferString => {
//                   notebook.audioBuffer = audioBufferString;
//                 })
//               )
//             }
//             return notebook;
//           });
//
//         } else {
//           notebooksToSend = notebooks.filter((notebook) => {
//
//             let notebookExists = false;
//             let notebookNeedsUpdate = false;
//
//             //run through the data we have
//             existingNotebooks.forEach((oldNotebook) => {
//               //if we have the data set the exist flag to true
//               if (oldNotebook._id === notebook._id) {
//                 notebookExists = true;
//
//                 //check if notebook needs to be updated.
//                 //if the times are note equal
//                 if (notebook.updatedAt !== oldNotebook.updatedAt) {
//                   //and if the time of the new notebook is greater than the oldData notebook match
//                   //we know there must be an update to this specific notebook;
//                   //TODO: maybe to a deep object comparison...
//                   if (notebook.updatedAt > oldNotebook.updatedAt) {
//                     notebookNeedsUpdate = true;
//                   }
//                 }
//               }
//             });
//
//             //if the notebook does not exist or if the notebook needs to be updated
//             //this means it's a new notebook or a notebook that has a newer updated time
//             //we assume it needs to be updatd
//             //we don't care what data has changed, we grab it all
//             if (!notebookExists || notebookNeedsUpdate) {
//
//               if (notebook.image) {
//                 promises.push(
//                   encodeBase64(notebook.image.absolutePath)
//                     .then((imageString) => {
//                       notebook.imageBuffer = imageString;
//                     })
//                 );
//               }
//               if (notebook.audio) {
//                 promises.push(
//                   encodeBase64(notebook.audio.absolutePath)
//                     .then((audioString) => {
//                       notebook.audioBuffer = audioString;
//                     })
//                 )
//               }
//               //only return notebook if it has update or is new.
//               return notebook;
//             }
//           });
//         }
//
//         Promise.all(promises)
//           .then(result => {
//             resolve(notebooksToSend);
//           })
//       })
//     });
//   })
// };
//
// exports.newDataReturned = function(notebook) {
//   return new Promise((resolve, reject) => {
//     //write the media buffers to the file system
//     writeSyncedMedia(notebook)
//       .then((notebook) => {
//         //when that is complete, update the database
//         updateOrInsertNotebooks(notebook)
//           .then((notebook) => {
//             resolve(notebook);
//           })
//           .catch((err) => {
//             console.log('error updating or inserting notebook', err);
//           })
//       })
//       .catch((err) => {
//         console.log('error writing synced media', err);
//       })
//   });
// };


//helper function to write the media dat to the filesystem
function writeSyncedMedia(notebook) {
  return new Promise((resolve, reject) => {
    let mediaPromises = [];
    //if there are updates...
    //if imageBuffer exists then write it to system
    if (notebook.imageBuffer) {
      //create an object  with the buffer and the path of the iamge
      let imageUpdateObject = {
        type: 'image',
        name: notebook.image.filename,
        absolutePath: path.join(app.getPath('userData'), 'image', notebook.image.filename),
        buffer: notebook.imageBuffer
      };
      //store promise of image file in array
      mediaPromises.push(
        writeMediaFile(imageUpdateObject)
      );
      //delete image buffer from object so we don't save it in the db
      delete notebook.imageBuffer;
      notebook.image.absolutePath = imageUpdateObject.absolutePath;
      notebook = Object.assign({}, notebook);
    }
    //if audioBuffer exist then write it to system
    if (notebook.audioBuffer) {
      let audioUpdateObject = {
        type: 'audio',
        name: notebook.audio.filename,
        absolutePath: path.join(app.getPath('userData'), 'audio', notebook.audio.filename),
        buffer: notebook.audioBuffer
      };

      mediaPromises.push(
        writeMediaFile(audioUpdateObject)
      );
      notebook.audio.absolutePath = audioUpdateObject.absolutePath;
      delete notebook.audioBuffer;
      notebook = Object.assign({}, notebook);
    }
    if (mediaPromises.length) {
      Promise.all(mediaPromises)
        .then((result) => {
          //once all media files have been written to the system successfully
          resolve(notebook);
        });
    } else {
      resolve(notebook);
    }

  });
};

//does the actual writing of the media file
function writeMediaFile(data) {
  return new Promise((resolve, reject) => {

    let buffer = new Buffer(data.buffer, 'base64', (err) => {
      if (err) {
        console.log('issue decoding base64 data');
        reject(err);
      }
    });

    fs.writeFile(data.absolutePath, buffer, (err) => {
      if (err) {
        console.log('There was an error writing file to filesystem', err);
        reject(err);
      }
      delete data.buffer;
      resolve(data);
    })
  });
};

function updateTranscription(transcription) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
    Transcriptions.update({_id: transcription._id}, transcription, options, (err, updatedCount, updatedDoc) => {
      if (err) {
        reject(err);
      }
      resolve(updatedDoc);
    })
  })
}

//adds or updates notebook to database
function updateOrInsertNotebooks(notebook) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true, upsert: true};
    let query = {_id: notebook._id};
    //becuase nedb auto time stamp does not work
    // let manualTimeEntry = new Date(notebook.updatedAt);
    // notebook.updatedAt = new Date(manualTimeEntry.getTime());
    Notebook.update(query, notebook, options, (err, updateCount, updatedDoc) => {
      if (err) {
        console.log('Error inserting new notebooks', err);
        reject(err);
      }
      console.log('updated or inserted amount:', updateCount);
      resolve(updatedDoc)
    });
  });
};

function encodeBase64(mediaPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(mediaPath, (err, data) => {
      if (err) {
        console.log('there was an error encoding media...');
        reject(err);
      }
      resolve(data.toString('base64'));
    });
  });
};


function handleError(res, err) {
  return res.status(500).send(err);
}
