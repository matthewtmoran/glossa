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
const Hashtag = require('./hashtag.model');
const path = require('path');
const Notebook = require('../notebook/notebook.model');
const User = require('../user/user.model');
const Transcription = require('../transcription/transcription.model');

// Get list of things
exports.index = function (req, res) {
  Hashtag.find({}, function (err, hashtags) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(hashtags);
  });
};

// Get a single thing
exports.show = function (req, res) {
  Hashtag.findOne(req.params.id, function (err, thing) {
    if (err) {
      return handleError(res, err);
    }
    if (!thing) {
      return res.status(404).send('Not Found');
    }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function (req, res) {

  Hashtag.find({tag: req.body.tag}, (err, tag) => {
    if (err) {
      return handleError(res, err);
    }
    if (!tag || tag.length < 1) {

      const hashtag = {
        tag: req.body.tag,
        tagColor: '#4285f4',
        realTitle: req.body.tag,
        canEdit: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        occurrence: 1
      };

      Hashtag.insert(hashtag, (err, createdTag) => {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json(createdTag);
      });
    }

  });
};

// Updates an existing thing in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  console.log('update');

  Hashtag.findOne({_id: req.params.id}, function (err, tag) {
    if (err) {
      return handleError(res, err);
    }
    if (!tag) {
      return res.status(404).send('Not Found');
    }
    let updated = _.merge(tag, req.body);
    let options = {returnUpdatedDocs: true};
    Hashtag.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) {
        return handleError(res, err);
      }

      normalizeNotebooks(updatedDoc)
        .then(function () {
          Hashtag.persistence.compactDatafile();
          return res.status(200).json(updatedDoc);
        })
        .catch(function () {
          console.log('there was an error');
        })

    });
  });
};

exports.removeTag = function (req, res) {
  Hashtag.findOne({_id: req.params.id}, (err, tag) => {
    if (err) {
      return handleError(res, err);
    }
    if (!tag) {
      return res.status(404).send('Not Found');
    }


    Hashtag.remove({_id: tag._id}, {}, (err, count) => {
      if (err) {
        return handleError(res, err);
      }
      const query = {"hashtags._id": tag._id};
      let updatedObject = {};
      normalizeTranscriptions(query, tag)
        .then((updatedTranscriptions) => {
          console.log('transcriptions normalized');
          updatedObject.transcriptions = updatedTranscriptions;

          normalizeNotebooksFromRemoval(query, tag)
            .then((updatedNotebooks) => {
              console.log('notebooks normalized');
              updatedObject.notebooks = updatedNotebooks;

              return res.status(200).send(updatedObject);
            })
            .catch((err) => {
              console.log('error normalizing notebooks', err);
              return handleError(res, err);
            })
        })
        .catch((err) => {
          console.log('error transcriptions', err);
          return handleError(res, err);
        })
    });
  })
};

// Deletes a thing from the DB.
exports.destroy = function (req, res) {
  Hashtag.findById(req.params.id, function (err, thing) {
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

// Get a single hashtag by term
exports.showTerm = function (req, res) {
  let tagTerms = req.body;
  let promises = [];

  tagTerms.forEach((tagName) => {
    promises.push(
      findTag(tagName)
    )
  });
  Promise.all(promises)
    .then((results) => {
      return res.status(200).json(results);
    })
};

exports.decreaseCount = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Hashtag.findOne({_id: req.params.id}, function (err, hashtag) {
    if (err) {
      return handleError(res, err);
    }
    if (!hashtag) {
      return res.status(404).send('Not Found');
    }

    if (!hashtag.occurrence) {
      hashtag.occurrence = 0;
    } else {
      hashtag.occurrence--
    }
    const options = {returnUpdatedDocs: true};
    hashtag.updatedAt = Date.now();
    Hashtag.update({_id: hashtag._id}, hashtag, options, function (err, updatedCount, updatedTag) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(updatedTag);
    });
  });
};

exports.findOccurrence = function (req, res, next) {
  req.commonTags = [];
  let promises = [];
  findNotebooksWithTags()
    .then(function (data) {

      if (data.uniqueHashtags) {
        data.uniqueHashtags.forEach(function (tag) {
          promises.push(updateExistingOccurrence(data.allHashtags, tag))
        });
      }


      Promise.all(promises)
        .then(function (results) {
          updateNonExistingOccurrence(data)
            .then(function () {
              next();
            })
        });

    })
};

exports.findCommonTags = function (req, res) {
  console.log('TODO: search through note books for all tags and return');

  User.findOne({}, (err, user) => {
    Notebook.find({'createdBy._id': user._id}, (err, notebooks) => {
      notebooks.forEach((notebook) => {
        let hashtags = [];
        let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
        if (hashReg.test(notebook.description)) {
          hashtags = notebook.description.match(hashReg).map((tag) => {
            return tag.trim().substr(1);
          });
          return hashtags
        }
      })
    });
  });


  // Hashtag.find({occurrence: {$gt: 0}}, function (err, tags) {
  //   if (err) {
  //     return handleError(res, err);
  //   }
  //   return res.status(200).json(tags);
  // })
};


exports.findCommonTags = function (req, res) {
  User.findOne({}, (err, user) => {
    Notebook.find({'createdBy._id': user._id}, (err, notebooks) => {
      let hashtags = [];
      notebooks.forEach((notebook) => {
        let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
        if (hashReg.test(notebook.description)) {
          notebook.description.match(hashReg).forEach((tag) => {
            if (hashtags.indexOf(tag.trim().substr(1)) < 0 ) {
              hashtags.push(tag.trim().substr(1));
            }
          });
        }
      });
      return res.status(200).json(hashtags);
    });
  });
};

function findTag(name) {
  return new Promise((resolve, reject) => {
    Hashtag.findOne({"tag": name}, (err, tag) => {
      if (err) {
        reject(err);
      }
      //if there is no tag, create a new one...
      if (!tag) {
        resolve(createNewTag(name));
      }
      resolve(tag);
    })
  });
}

function createNewTag(name) {
  return new Promise((resolve, reject) => {
    let newTag = {
      tag: name,
      tagColor: '#4285f4',
      realTitle: name,
      canEdit: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrence: 1
    };
    Hashtag.insert(newTag, (err, createdTag) => {
      if (err) reject(err);
      resolve(createdTag);
    });
  })
}

function updateTranscription(transcription) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
   return Transcription.update({_id: transcription._id}, transcription, options, (err, updatedCount, updatedDoc) => {
      if (err) {
        reject(err)
      }
      return resolve(updatedDoc)
    })
  })
}

function normalizeNotebooksFromRemoval(query, tag) {

  return new Promise((resolve, reject) => {
    let promises = [];
    Notebook.find(query, (err, notebooks) => {

      let newPromises = notebooks.map((notebook) => {
        notebook.description = notebook.description.replace('#' + tag.tag, tag.tag);
        notebook.hashtags = notebook.hashtags.filter((t) => t._id !== tag._id);
        return updateNotebook(notebook, tag);
      });

      Promise.all(newPromises)
        .then((results) => {
          console.log('promises:', promises);
          console.log("notebook results:", results);
          resolve(results);
        })
    });

  });
}

function updateNotebook(notebook, tag) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
     return Notebook.update({_id: notebook._id}, notebook, options, (err, updatedCount, updatedDoc) => {
        if (err) reject(err);
        console.log('resolving notebook');
        return resolve(updatedDoc)
      })
  })
}

function normalizeTranscriptions(query, tag) {
  return new Promise((resolve, reject) => {
    Transcription.find(query, (err, transcriptions) => {
      let promises = transcriptions.map((transcription) => {
        transcription.description = transcription.description.replace('#' + tag.tag, tag.tag);
        transcription.hashtags = transcription.hashtags.filter((t) => t._id !== tag._id);
        return updateTranscription(transcription);
      });
      Promise.all(promises)
        .then((results) => {
          resolve(results);
        })
    });
  });
}

function normalizeNotebooks(modifiedTag) {
  return new Promise(function (resolve, reject) {
    let query = {"hashtags._id": modifiedTag._id};

    Notebook.find(query, function (err, notebooks) {
      if (err) {
        reject(err)
      };


      notebooks.forEach(function (notebook) {
        let oldTagText = '';

        notebook.hashtags.map(function (oldTag, index) {
          if (oldTag._id === modifiedTag._id) {
            console.log('match found');
            oldTagText = '#' + oldTag.tag;
            notebook.hashtags[index] = modifiedTag;
          }
        });

        notebook.description = notebook.description.replace(oldTagText, '#' + modifiedTag.tag);

        Notebook.update({_id: notebook._id}, notebook, function (err, updatedNum) {
          if (err) {
            reject(err)
          }
          resolve()
        })

      })
    })
  });
}

function findNotebooksWithTags() {
  return new Promise(function (resolve, reject) {
    let allHashtags = [];
    let uniqueHashtags = [];
    const query = {$not: {"hashtags": {$size: 0}}};
    Notebook.find(query, function (err, notebooks) {
      if (err) {
        reject(err);
      }
      //look for all notebooks
      notebooks.forEach(function (notebook) {

        if (notebook.hashtags) {
          notebook.hashtags.forEach(function (hashtag) {
            //push one of each hastag to array
            if (uniqueHashtags.indexOf(hashtag) < 0) {
              uniqueHashtags.push(hashtag);
            }
            //push each hashtag to array
            allHashtags.push(hashtag);
          });
        }

      });

      let data = {allHashtags: allHashtags, uniqueHashtags: uniqueHashtags};

      resolve(data);
    });
  })
}

function updateExistingOccurrence(allHashtags, tag) {
  return new Promise(function (resolve, reject) {
    Hashtag.findOne({_id: tag._id}, function (err, doc) {
      if (err) {
        reject(err)
      }
      doc.occurrence = countInArray(allHashtags, doc);
      Hashtag.update({_id: doc._id}, doc, function (err, updatedCount) {
        if (err) {
          reject()
        }
        resolve();
      })
    })
  })
}

function updateNonExistingOccurrence(data) {
  return new Promise(function (resolve, reject) {
    let promises = [];
    let updatedTagIdQuery = [];

    //add the id of the already updated tags to an array
    data.uniqueHashtags.forEach(function (usedTag) {
      updatedTagIdQuery.push(
        {_id: usedTag._id}
      )
    });

    //if occurrence is greater than 0
    let occurenceQuery = {
      occurrence: {$gt: 0}
    };
    //if its not one of the previously updated tags
    let notQuery = {
      $not: {$or: updatedTagIdQuery}
    };
    //if it fits both criteria
    let masterQuery = {
      $and: [occurenceQuery, notQuery]
    };


    Hashtag.find(masterQuery, function (err, hashtags) {
      if (err) {
        reject(err)
      }
      if (!hashtags) { //if no tags are found then go next
        resolve();
      }


      let updatedTags = [];
      //update each tag that is found......
      hashtags.forEach(function (t) {

        promises.push(
          new Promise(function (resolve, reject) {
            t.occurrence = countInArray(data.allHashtags, t);

            let options = {returnUpdatedDocs: true};
            Hashtag.update({_id: t._id}, t, options, function (err, updatedCount, updatedDoc) {
              if (err) {
                reject(err)
              }
              updatedTags.push(updatedDoc);
              resolve();
            })
          })
        );

      });

      Promise.all(promises).then(function (results) {
        resolve();
      })
    });
  });
}

function countInArray(array, tag) {
  let count = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i]._id === tag._id) {
      count++;
    }
  }
  return count;
}

function handleError(res, err) {
  return res.status(500).send(err);
}
