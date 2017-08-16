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
var Hashtag = require('./hashtag.model');
var path = require('path');
var Notebook = require('../notebook/notebook.model');
// var globalPaths = require('electron').remote.getGlobal('userPaths');

// Get list of things
exports.index = function(req, res) {
    Hashtag.find({}, function (err, hashtags) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(hashtags);
  });
};

// Get a single thing
exports.show = function(req, res) {
    Hashtag.findOne(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
    Hashtag.create(req.body, function(err, thing) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(thing);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
    Hashtag.findOne({_id: req.params.id}, function (err, tag) {
    if (err) { return handleError(res, err); }
    if(!tag) { return res.status(404).send('Not Found'); }
    var updated = _.merge(tag, req.body);
    var options = {returnUpdatedDocs: true};
    Hashtag.update({_id: updated._id}, updated, options, function (err, updatedNum, updatedDoc) {
      if (err) { return handleError(res, err); }

      normalizeNotebooks(updatedDoc)
        .then(function() {
          Hashtag.persistence.compactDatafile();
          return res.status(200).json(updatedDoc);
        })
        .catch(function() {
          console.log('there was an error');
        })

    });
  });
};


// Deletes a thing from the DB.
exports.destroy = function(req, res) {
    Hashtag.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.status(404).send('Not Found'); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

// Get a single hashtag by term
exports.showTerm = function(req, res) {
    var tagName = req.params.term;
    Hashtag.findOne({"tag": tagName}, function (err, tag) {
        if(err) { return handleError(res, err); }
        //if there is no tag, create a new one...
        if(!tag) {
            var newTag = {
                tag: tagName,
                tagColor: '#4285f4',
                realTitle: tagName,
                canEdit: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                occurrence: 1
            };
            return Hashtag.insert(newTag, function(err, createdTag) {
                if(err) { return handleError(res, err); }
                return res.status(200).json(createdTag);
            });
        }
        var options = {returnUpdatedDocs: true};
        tag.updatedAt = Date.now();
        Hashtag.update({"_id": tag._id}, tag, options, function(err, updatedCount, updatedTag) {
            if(err) { return handleError(res, err); }
            return res.status(200).json(updatedTag);
        })
    });
};

exports.decreaseCount = function(req, res) {
    if(req.body._id) { delete req.body._id; }
    Hashtag.findOne({_id: req.params.id}, function (err, hashtag) {
        if (err) { return handleError(res, err); }
        if(!hashtag) { return res.status(404).send('Not Found'); }

        if (!hashtag.occurrence) {
            hashtag.occurrence = 0;
        } else {
            hashtag.occurrence--
        }
        var options = {returnUpdatedDocs: true};
        hashtag.updatedAt = Date.now();
        Hashtag.update({_id: hashtag._id}, hashtag, options, function (err, updatedCount, updatedTag) {
            if (err) { return handleError(res, err); }
            return res.status(200).json(updatedTag);
        });
    });
};

exports.findOccurrence = function(req, res, next) {
  req.commonTags = [];
  var promises = [];
  findNotebooksWithTags()
    .then(function(data) {

      if(data.uniqueHashtags) {
        data.uniqueHashtags.forEach(function(tag) {
          promises.push(updateExistingOccurrence(data.allHashtags, tag))
        });
      }



      Promise.all(promises)
        .then(function(results) {
          updateNonExistingOccurrence(data)
            .then(function() {
              next();
            })
        });

    })
};

exports.findCommonTags = function(req, res) {
  Hashtag.find({occurrence: {$gt: 0}}, function(err, tags) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(tags);
  })
};

function normalizeNotebooks(modifiedTag) {
  return new Promise(function(resolve, reject) {
    var query = {"hashtags._id": modifiedTag._id};

    Notebook.find(query, function(err, notebooks) {
      if (err) {reject(err)};


      notebooks.forEach(function(notebook) {
        var oldTagText = '';

        notebook.hashtags.map(function(oldTag, index) {
          if (oldTag._id === modifiedTag._id) {
            console.log('match found');
            oldTagText = '#' + oldTag.tag;
            notebook.hashtags[index] = modifiedTag;
          }
        });

        notebook.description = notebook.description.replace(oldTagText, '#' + modifiedTag.tag);

        Notebook.update({_id: notebook._id}, notebook, function(err, updatedNum) {
          if (err) { reject(err) }
          resolve()
        })

      })
    })
  });
}

function findNotebooksWithTags() {
  return new Promise(function(resolve, reject) {
    var allHashtags = [];
    var uniqueHashtags = [];
    var query = { $not:{"hashtags": { $size: 0 }}};
    Notebook.find(query, function(err, notebooks) {
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
  return new Promise(function(resolve, reject) {
    Hashtag.findOne({_id: tag._id}, function(err, doc) {
      if (err) { reject(err) }
      doc.occurrence = countInArray(allHashtags, doc);
      Hashtag.update({_id: doc._id}, doc, function(err, updatedCount) {
        if (err) {reject()}
        resolve();
      })
    })
  })
}

function updateNonExistingOccurrence(data) {
  return new Promise(function(resolve, reject) {

    var promises = [];

    var updatedTagIdQuery = [];

    //add the id of the already updated tags to an array
    data.uniqueHashtags.forEach(function(usedTag) {
      updatedTagIdQuery.push(
        {_id: usedTag._id}
      )
    });

    //if occurrence is greater than 0
    var occurenceQuery = {
      occurrence: { $gt:0 }
    };
    //if its not one of the previously updated tags
    var notQuery = {
      $not: { $or: updatedTagIdQuery }
    };
    //if it fits both criteria
    var masterQuery = {
      $and: [ occurenceQuery, notQuery ]
    };



    Hashtag.find(masterQuery, function(err, hashtags) {
      if (err) { reject(err) }
      if (!hashtags) { //if no tags are found then go next
        resolve();
      }


      var updatedTags = [];
      //update each tag that is found......
      hashtags.forEach(function(t) {

        promises.push(

          new Promise(function(resolve, reject) {
            t.occurrence = countInArray(data.allHashtags, t);

            var options = {returnUpdatedDocs: true};
            Hashtag.update({_id: t._id}, t, options, function(err, updatedCount, updatedDoc) {
              if (err) { reject(err) }
              updatedTags.push(updatedDoc);
              resolve();
            })
          })

        );

      });

      Promise.all(promises).then(function(results) {
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
