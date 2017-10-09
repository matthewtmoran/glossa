'use strict';

  console.log('debug notebook index 1')
module.exports = function(io) {
  console.log('debug notebook index 1.5')
  const express = require('express');
  console.log('debug notebook index 2')
  const controller = require('./notebook.controller')(io);
  console.log('debug notebook index 3')
  const hashtag = require('../../middleware/hashtag');
  console.log('debug notebook index 4')
  const fileUpload = require('../../middleware/uploads');
  console.log('debug notebook index 5')
  const router = express.Router();

  router.get('/', controller.index);
  router.get('/:id', controller.show);
  router.post('/', fileUpload.type, fileUpload.validateFilename, controller.create);
  router.put('/:id', fileUpload.type, fileUpload.validateFilename, controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.destroy);


  return router
};



