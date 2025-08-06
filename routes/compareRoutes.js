const express = require('express');
const router = express.Router();
const { compareAssetsController } = require('../controllers/compareController');

router.get('/:symbol1/:symbol2', compareAssetsController);

module.exports = router;
