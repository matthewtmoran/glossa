'use strict';

var express = require('express');
var controller = require('./user.controller');
var avatarUpload = require('../../middleware/avatar-upload');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.post('/avatar', avatarUpload.type, avatarUpload.validateFilename, controller.avatar);
router.put('/:id/avatar', avatarUpload.removeAvatar, controller.removeAvatar);
router.put('/:id', controller.update);
router.put('/:id/session', controller.updateSession);
router.put('/:id/settings', controller.updateSettings);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;