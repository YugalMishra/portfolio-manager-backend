const db = require('../config/db');

exports.getStockTransactions = async (req, res) => {
  try {
    const { asset_type } = req.query; // optional query param

    let query = `
      SELECT action, ticker, quantity, price_per_unit, total_value, created_at
      FROM transactions
    `;
    const values = [];

    if (asset_type) {
      query += ` WHERE asset_type = ?`;
      values.push(asset_type.toLowerCase());
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await db.execute(query, values);
    res.json({ transactions: rows });

  } catch (err) {
    console.error("Error fetching stock transactions:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAccountTransactions = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT action, amount, description, created_at
      FROM account_transactions
      ORDER BY created_at DESC
    `);
    res.json({ transactions: rows });
  } catch (err) {
    console.error("Error fetching account transactions:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};