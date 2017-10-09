'use strict';
module.exports = function(io) {

  let express = require('express');
  let controller = require('./connection.controller')(io);
  let router = express.Router();

  router.get('/', controller.index);
  router.get('/:id', controller.show);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.destroy);

  return router;
};
