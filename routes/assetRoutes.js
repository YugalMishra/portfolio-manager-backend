const express = require('express');
const router = express.Router();

const {
  addAssetController,
  getPortfolioController,
  removeAssetController,
  getAssetTransactionHistoryController
} = require('../controllers/assetController');

// ✅ Correct way (no parentheses)
router.post('/add', addAssetController);
router.post('/remove', removeAssetController);
router.get('/portfolio', getPortfolioController);
router.get('/transactions', getAssetTransactionHistoryController);

module.exports = router;
