const express = require('express');
const router = express.Router();
const {
  getBalanceController,
  addDepositController,
  withdrawController,
  getHistoryController
} = require('../controllers/settlementController');

router.get('/balance', getBalanceController);
router.post('/add', addDepositController);
router.post('/withdraw', withdrawController);
router.get('/history', getHistoryController);

module.exports = router;