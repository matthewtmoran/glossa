'use strict';

var express = require('express');
var controller = require('./transcription.controller');
var markdown = require('../../middleware/markdown');
var fileUpload = require('../../middleware/uploads');

var router = express.Router();

router.get('/', controller.index);
router.get('/corpus/:name', controller.corpusIndex);
router.get('/:id', controller.show);
router.post('/', markdown.createFile, controller.create);
router.put('/:id', fileUpload.type, fileUpload.validateFilename, controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;