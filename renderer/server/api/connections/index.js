import express from 'express';
module.exports = function(io) {

  const controller = require('./connection.controller')(io);
  const router = express.Router();

  router.get('/', controller.index);
  router.get('/:id', controller.show);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.destroy);

  return router;
};
