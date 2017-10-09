import express from 'express';
import controller from './preload.controller';
const router = express.Router();

router.get('/', controller.index);

module.exports = router;