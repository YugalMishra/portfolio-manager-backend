const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

router.post('/add-funds', accountController.addFunds);
router.post('/withdraw-funds', accountController.withdrawFunds);
router.get('/balance', accountController.getBalance);

module.exports = router;