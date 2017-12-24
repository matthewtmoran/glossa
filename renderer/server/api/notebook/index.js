import express from 'express';
import fileUpload from '../../middleware/uploads';
module.exports = function(io) {
  const controller = require('./notebook.controller')(io);
  const router = express.Router();

  router.get('/', controller.index);
  router.get('/:id', controller.show);
  router.post('/', fileUpload.type, fileUpload.validateFilename, controller.create);
  router.put('/:id', fileUpload.type, fileUpload.validateFilename, controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.destroy);

  return router
};



