const {
  getSettlementBalance,
  recordSettlement,
  getSettlementHistory
} = require('../models/settlementModel');

// ✅ GET BALANCE
const getBalanceController = async (req, res) => {
  try {
    const balance = await getSettlementBalance();
    res.status(200).json({ balance: parseFloat(balance).toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ ADD DEPOSIT
const addDepositController = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    await recordSettlement({
      type: 'deposit',
      amount,
      note: 'User deposit'
    });

    res.status(201).json({ message: `Deposited ₹${amount.toFixed(2)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const withdrawController = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const balance = await getSettlementBalance();
    const numericBalance = parseFloat(balance);

    if (amount > numericBalance) {
      return res.status(400).json({
        error: `Insufficient balance. Available: ₹${numericBalance.toFixed(2)}`
      });
    }

    await recordSettlement({
      type: 'withdraw',
      amount: -Math.abs(amount),
      note: 'User withdrawal'
    });

    res.status(200).json({ message: `Withdrew ₹${amount.toFixed(2)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getHistoryController = async (req, res) => {
  try {
    const history = await getSettlementHistory();
    res.status(200).json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getBalanceController,
  addDepositController,
  withdrawController,
  getHistoryController
};
