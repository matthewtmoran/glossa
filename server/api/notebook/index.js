'use strict';

var express = require('express');
var controller = require('./notebook.controller');
var hashtag = require('../../middleware/hashtag');
var fileUpload = require('../../middleware/uploads');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', fileUpload.type, fileUpload.validateFilename, controller.create);
router.put('/:id', fileUpload.type, fileUpload.validateFilename, controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;