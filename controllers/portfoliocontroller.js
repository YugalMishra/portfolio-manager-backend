// controllers/portfoliocontroller.js
const db = require('../config/db');

// BUY STOCK
exports.buyStock = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;
        const totalCost = quantity * price;

        // Get current balance
        const [rows] = await db.query(`
            SELECT SUM(CASE 
                        WHEN action IN ('DEPOSIT', 'SALE_PROCEEDS') THEN amount 
                        ELSE -amount END) AS balance
            FROM account_transactions
        `);

        const balance = rows[0].balance || 0;

        if (balance < totalCost) {
            return res.status(400).json({ error: 'Insufficient funds in settlements account.' });
        }

        // Add to portfolio
        await db.execute(
            `INSERT INTO portfolios (symbol, quantity, price, type) VALUES (?, ?, ?, 'BUY')`,
            [symbol, quantity, price]
        );

        // Update account balance
        await db.execute(
            `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
            ['BUY', totalCost, `Bought ${quantity} shares of ${symbol}`]
        );

        res.status(201).json({ message: 'Stock bought successfully' });
    } catch (err) {
        console.error('Error buying stock:', err);
        res.status(500).json({ error: 'Error buying stock.', details: err.message });
    }
};

// SELL STOCK
exports.sellStock = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;

        // Check if user holds enough quantity
        const [holdings] = await db.query(
            `SELECT SUM(CASE WHEN type = 'BUY' THEN quantity ELSE -quantity END) AS net_quantity
             FROM portfolios WHERE symbol = ?`,
            [symbol]
        );

        const netQty = holdings[0].net_quantity || 0;

        if (netQty < quantity) {
            return res.status(400).json({ error: 'Not enough holdings to sell.' });
        }

        const totalValue = quantity * price;

        await db.execute(
            `INSERT INTO portfolios (symbol, quantity, price, type) VALUES (?, ?, ?, 'SELL')`,
            [symbol, quantity, price]
        );

        await db.execute(
            `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
            ['SALE_PROCEEDS', totalValue, `Sold ${quantity} shares of ${symbol}`]
        );

        res.status(201).json({ message: 'Stock sold successfully' });
    } catch (err) {
        console.error('Error selling stock:', err);
        res.status(500).json({ error: 'Error selling stock.', details: err.message });
    }
};

// GET HOLDINGS
exports.getHoldings = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT symbol,
                    SUM(CASE WHEN type = 'BUY' THEN quantity ELSE -quantity END) AS quantity,
                    SUM(CASE WHEN type = 'BUY' THEN quantity * price ELSE 0 END) AS invested
             FROM portfolios
             GROUP BY symbol
             HAVING quantity > 0`
        );
        res.json(rows);
    } catch (err) {
        console.error('Error getting holdings:', err);
        res.status(500).json({ error: 'Error fetching holdings.' });
    }
};

// GET TRANSACTIONS

exports.getTransactions = async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT * FROM account_transactions
      `);
      res.status(200).json({ transactions: rows });
    } catch (err) {
      console.error(" Error fetching transactions:", err);
      res.status(500).json({ error: "Error fetching transactions.", details: err.message });
    }
  };

// GET BALANCE
exports.getBalance = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT SUM(CASE 
                         WHEN action IN ('DEPOSIT', 'SALE_PROCEEDS') THEN amount 
                         ELSE -amount END) AS balance
            FROM account_transactions
        `);

        const balance = rows[0].balance || 0;
        res.json({ balance });
    } catch (err) {
        console.error('Get balance error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ADD FUNDS
exports.addFunds = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        await db.execute(
            `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)` ,
            ['DEPOSIT', amount, 'User deposited funds']
        );

        res.status(201).json({ message: `Successfully added ₹${amount}` });
    } catch (err) {
        console.error('Error adding funds:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// WITHDRAW FUNDS
exports.withdrawFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const [rows] = await db.query(`
            SELECT SUM(CASE 
                         WHEN action IN ('DEPOSIT', 'SALE_PROCEEDS') THEN amount 
                         ELSE -amount END) AS balance
            FROM account_transactions
        `);

        const balance = rows[0].balance || 0;

        if (balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        await db.execute(
            `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
            ['WITHDRAW', amount, 'User withdrew funds']
        );

        res.status(201).json({ message: `Successfully withdrew ₹${amount}` });
    } catch (err) {
        console.error('Error withdrawing funds:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
