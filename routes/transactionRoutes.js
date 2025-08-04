const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionControllers');

router.get('/stocks', transactionController.getStockTransactions);
router.get('/account', transactionController.getAccountTransactions);

module.exports = router;
