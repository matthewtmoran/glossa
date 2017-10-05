'use strict';
const path = require('path');
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

// const path = require('path');
// var express = require('express');
// var controller = require(path.join(__dirname, './connection.controller'));
//
// var router = express.Router();
//
// router.get('/', controller.index);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);
//
// module.exports = router;