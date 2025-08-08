const db = require('../db');

const addAsset = async ({ symbol, type, quantity, price }) => {
  if (!symbol || !type || !quantity || !price) {
    throw new Error('Missing required fields in addAsset');
  }

  const [result] = await db.execute(
    `INSERT INTO assets (symbol, type, quantity, price) VALUES (?, ?, ?, ?)`,
    [symbol, type, quantity, price]
  );
  return result.insertId;
};

const getAllAssets = async () => {
  const [rows] = await db.execute(`
    SELECT 
  symbol,
  type,
  SUM(CASE WHEN action = 'buy' THEN quantity ELSE -quantity END) AS quantity,
  SUM(CASE WHEN action = 'buy' THEN quantity * price ELSE 0 END) / 
    NULLIF(SUM(CASE WHEN action = 'buy' THEN quantity ELSE 0 END), 0) AS purchase_price
FROM asset_transactions
GROUP BY symbol, type
HAVING quantity > 0

  `);
  return rows;
};


const getAssetBySymbol = async (symbol) => {
  const [rows] = await db.execute(
    `SELECT * FROM assets WHERE symbol = ? ORDER BY id DESC LIMIT 1`,
    [symbol]
  );
  return rows[0];
};

const updateAssetOnSell = async (id, remainingQty) => {
  await db.execute(`UPDATE assets SET quantity = ? WHERE id = ?`, [remainingQty, id]);
};

const logAssetTransaction = async ({ symbol, type, action, quantity, price }) => {
  await db.execute(
    `INSERT INTO asset_transactions (symbol, type, action, quantity, price, date)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [symbol, type, action, quantity, price]
  );
};

const getAssetTransactionHistory = async () => {
  const [rows] = await db.execute(`SELECT * FROM asset_transactions ORDER BY date DESC`);
  return rows;
};

module.exports = {
  addAsset,
  getAllAssets,
  getAssetBySymbol,
  updateAssetOnSell,
  logAssetTransaction,
  getAssetTransactionHistory
};
