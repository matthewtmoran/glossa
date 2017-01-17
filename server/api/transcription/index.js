'use strict';

var express = require('express');
var controller = require('./transcription.controller');
var markdown = require('../../middleware/markdown');

var router = express.Router();

router.get('/', controller.index);
router.get('/corpus/:name', controller.corpusIndex);
router.get('/:id', controller.show);
router.post('/', markdown.createFile, controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;