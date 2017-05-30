'use strict';

var express = require('express');
var controller = require('./hashtag.controller');

var router = express.Router();

router.get('/', controller.findOccurrence, controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.get('/search/:term', controller.showTerm);
router.get('/common/:nothing', controller.findCommonTags);
router.put('/decrease/:id', controller.decreaseCount);

module.exports = router;