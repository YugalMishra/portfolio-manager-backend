const db = require('../db');

const recordSettlement = async ({ type, amount, note }) => {
  await db.execute(
    `INSERT INTO settlement_transactions (type, amount, note) VALUES (?, ?, ?)`,
    [type, amount, note]
  );
};

const getSettlementBalance = async () => {
  const [rows] = await db.execute(`SELECT SUM(amount) AS balance FROM settlement_transactions`);
  return rows[0].balance || 0;
};

const getSettlementHistory = async () => {
  const [rows] = await db.execute(`SELECT * FROM settlement_transactions ORDER BY date DESC`);
  return rows;
};

module.exports = {
  recordSettlement,
  getSettlementBalance,
  getSettlementHistory
};
