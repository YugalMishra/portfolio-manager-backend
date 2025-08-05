const express = require('express');
const router = express.Router();
const { addAssetManually, removeAssetManually, getPortfolio, getPerformance } = require('../controllers/portfolioController');

router.get('/', getPortfolio);
router.post('/add-asset', addAssetManually);
router.post('/remove-asset', removeAssetManually);
router.get('/performance', getPerformance);

module.exports = router;