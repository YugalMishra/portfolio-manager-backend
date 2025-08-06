// File: controllers/accountController.js
const db = require('../config/db');

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    await db.query(
      `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
      ['DEPOSIT', amount, 'User deposited funds']
    );

    res.status(201).json({ message: `Successfully added ₹${amount}` });
  } catch (err) {
    console.error('Error adding funds:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [rows] = await db.query(`
      SELECT
        SUM(CASE 
              WHEN action = 'DEPOSIT' THEN amount 
              WHEN action = 'SALE_PROCEEDS' THEN amount 
              ELSE -amount END) AS balance
      FROM account_transactions
    `);

    const balance = rows[0].balance || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await db.query(
      `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
      ['WITHDRAW', amount, 'User withdrew funds']
    );

    res.status(201).json({ message: `Successfully withdrew ₹${amount}` });
  } catch (err) {
    console.error('Error withdrawing funds:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        SUM(CASE 
              WHEN action = 'DEPOSIT' THEN amount 
              WHEN action = 'SALE_PROCEEDS' THEN amount 
              ELSE -amount END) AS balance
      FROM account_transactions
    `);

    const balance = rows[0].balance || 0;
    res.json({ balance });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
