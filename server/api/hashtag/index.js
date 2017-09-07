'use strict';

const express = require('express');
const controller = require('./hashtag.controller');
const router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.post('/remove/:id', controller.removeTag);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/search', controller.showTerm);
router.get('/common/:nothing', controller.findCommonTags);
router.put('/decrease/:id', controller.decreaseCount);

module.exports = router;