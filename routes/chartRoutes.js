const express = require('express');
const router = express.Router();
const { getChartDataController } = require('../controllers/chartController');

router.get('/:symbol', getChartDataController);

module.exports = router;
