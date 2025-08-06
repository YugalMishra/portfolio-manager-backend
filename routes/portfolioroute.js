const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfoliocontroller');
const accountController = require('../controllers/accountcontroller');

//  Logger middleware for debugging
router.use((req, res, next) => {
  console.log(` ${req.method} ${req.originalUrl} hit with body:`, req.body);
  next();
});

// Portfolio routes
router.post('/buy', portfolioController.buyStock);
router.post('/sell', portfolioController.sellStock);
router.get('/holdings', portfolioController.getHoldings);
router.get('/transactions', portfolioController.getTransactions);

// Account routes (moved from portfolioController)
router.post('/account/add', accountController.addFunds);
router.post('/account/withdraw', accountController.withdrawFunds);
router.get('/account/balance', accountController.getBalance);

module.exports = router;
