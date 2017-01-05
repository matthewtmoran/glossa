'use strict';

var express = require('express');
var controller = require('./notebook.controller');
var hashtag = require('../../middleware/hashtag');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', hashtag.parse, controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;