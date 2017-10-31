const express = require('express');
const controller = require('./project.controller');

const router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/import', controller.importProject);
router.post('/export', controller.exportProject);

module.exports = router;