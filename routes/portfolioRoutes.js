const express = require('express');
const router = express.Router();
const { getPortfolioAnalysis } = require('../controllers/portfolioController');

router.get('/analysis', getPortfolioAnalysis);

module.exports = router;