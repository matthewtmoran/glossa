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
  Hashtag.create(req.body, function (err, thing) {
    if (err) {
      return handleError(res, err);
    }
    global.appData.initialState.hashtags = [global.appData.initialState.hashtags, ...thing];
    return res.status(201).json(thing);
  });
};

// Updates an existing thing in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Hashtag.findOne({_id: req.params.id}, function (err, tag) {
    if (err) {
      return handleError(res, err);
    }
    if (!tag) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(tag, req.body);
    var options = {returnUpdatedDocs: true};
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

    let promises = [];

    Hashtag.remove({_id: tag._id}, {}, (err, count) => {
      if (err) {
        return handleError(res, err);
      }
      global.appData.initialState.hashtags = global.appData.initialState.hashtags.filter((t) => t._id !== tag._id);
      const query = {"hashtags._id": tag._id};
      promises.push(
        normalizeTranscriptions(query, tag),
        normalizeNotebooksFromRemoval(query, tag)
      );
    });

    Promise.all(promises)
      .then((results) => {
        return res.status(200).send('Updated global object');
      })

  })
};

function normalizeTranscriptions(query, tag) {
  return new Promise((resolve, reject) => {
    let promises = [];
    Transcription.find(query, (err, transcriptions) => {
      transcriptions.forEach((transcription) => {
        transcription.description = transcription.description.replace('#' + tag.tag, tag.tag);
        transcription.hashtags = transcription.hashtags.filter((t) => t._id !== tag._id);
        promises.push(updateTranscription(transcription));
        return transcription;
      });
    });
    Promise.all(promises)
      .then((results) => {
        resolve(results);
      })
  });
}

function updateTranscription(transcription) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
    Transcription.update({_id: transcription._id}, transcription, options, (err, updatedCount, updatedDoc) => {
      if (err) {
        reject(err)
      }

      global.appData.initialState.transcriptions = global.appData.initialState.transcriptions.map((trans) => {
        if (trans._id !== updatedDoc._id) {
          return trans;
        }
        return updatedDoc;
      });

      resolve(updatedCount)
    })
  })
}

function normalizeNotebooksFromRemoval(query, tag) {

  return new Promise((resolve, reject) => {
    let promises = [];
    Notebook.find(query, (err, notebooks) => {
      notebooks.forEach((notebook) => {
        notebook.description = notebook.description.replace('#' + tag.tag, tag.tag);
        notebook.hashtags = notebook.hashtags.filter((t) => t._id !== tag._id);
        promises.push(updateNotebook(notebook, tag));
        return notebook
      });
    });
    Promise.all(promises)
      .then((results) => {
        resolve(results);
      })
  });
}

function updateNotebook(notebook, tag) {
  return new Promise((resolve, reject) => {
    const options = {returnUpdatedDocs: true};
    Notebook.update({_id: notebook._id}, notebook, options, (err, updatedCount, updatedDoc) => {
      if (err) reject(err);

      global.appData.initialState.notebooks = global.appData.initialState.notebooks.map((note) => {
        if (note._id !== updatedDoc._id) {
          return note;
        }
        return updatedDoc;
      });
      resolve(updatedCount)
    })
  })
}

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
      global.appData.initialState.hashtags = [...global.appData.initialState.hashtags, createdTag];
      resolve(createdTag);
    });
  })
}

// function getHashtags() {
//
//   Hashtag.find({}, (err, hashtags) => {
//
//     global.appData.initialState.hashtags = Object.assign({}, hashtags);
//
//   })
//
// }

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
    var options = {returnUpdatedDocs: true};
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
  var promises = [];
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
  Hashtag.find({occurrence: {$gt: 0}}, function (err, tags) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(tags);
  })
};

function normalizeNotebooks(modifiedTag) {
  return new Promise(function (resolve, reject) {
    var query = {"hashtags._id": modifiedTag._id};

    Notebook.find(query, function (err, notebooks) {
      if (err) {
        reject(err)
      }
      ;


      notebooks.forEach(function (notebook) {
        var oldTagText = '';

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
    var allHashtags = [];
    var uniqueHashtags = [];
    var query = {$not: {"hashtags": {$size: 0}}};
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

      var data = {allHashtags: allHashtags, uniqueHashtags: uniqueHashtags};

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

    var promises = [];

    var updatedTagIdQuery = [];

    //add the id of the already updated tags to an array
    data.uniqueHashtags.forEach(function (usedTag) {
      updatedTagIdQuery.push(
        {_id: usedTag._id}
      )
    });

    //if occurrence is greater than 0
    var occurenceQuery = {
      occurrence: {$gt: 0}
    };
    //if its not one of the previously updated tags
    var notQuery = {
      $not: {$or: updatedTagIdQuery}
    };
    //if it fits both criteria
    var masterQuery = {
      $and: [occurenceQuery, notQuery]
    };


    Hashtag.find(masterQuery, function (err, hashtags) {
      if (err) {
        reject(err)
      }
      if (!hashtags) { //if no tags are found then go next
        resolve();
      }


      var updatedTags = [];
      //update each tag that is found......
      hashtags.forEach(function (t) {

        promises.push(
          new Promise(function (resolve, reject) {
            t.occurrence = countInArray(data.allHashtags, t);

            var options = {returnUpdatedDocs: true};
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
  var count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i]._id === tag._id) {
      count++;
    }
  }
  return count;
}

function handleError(res, err) {
  return res.status(500).send(err);
}
