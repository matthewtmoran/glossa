'use strict';

module.exports = function(io) {
  const express = require('express');
  const controller = require('./notebook.controller')(io);
  const hashtag = require('../../middleware/hashtag');
  const fileUpload = require('../../middleware/uploads');
  const router = express.Router();

  router.get('/', controller.index);
  router.get('/:id', controller.show);
  router.post('/', fileUpload.type, fileUpload.validateFilename, controller.create);
  router.put('/:id', fileUpload.type, fileUpload.validateFilename, controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.destroy);


  return router
};



