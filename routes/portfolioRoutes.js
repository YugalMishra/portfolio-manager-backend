const express = require('express');
const router = express.Router();
const { buyStock, sellStock, getPortfolio, getPerformance } = require('../controllers/portfolioController');

router.get('/', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/performance', getPerformance);

module.exports = router;