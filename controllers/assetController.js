const {
  addAsset,
  getAllAssets,
  getAssetBySymbol,
  updateAssetOnSell,
  logAssetTransaction,
  getAssetTransactionHistory
} = require('../models/assetModel');

const {
  recordSettlement,
  getSettlementBalance
} = require('../models/settlementModel');

const { getQuote } = require('../utils/finnhub');

// ADD ASSET
const addAssetController = async (req, res) => {
  try {
    const { symbol, type, quantity, price } = req.body;

    if (!symbol || !type || quantity <= 0 || price <= 0) {
      return res.status(400).json({ error: 'All fields are required and must be positive numbers' });
    }

    const balance = await getSettlementBalance();
    const totalCost = quantity * price;

    if (balance < totalCost) {
      return res.status(400).json({
        error: `Insufficient balance. Available: ₹${balance.toFixed(2)}`
      });
    }

    const assetId = await addAsset({ symbol, type, quantity, price });

    await recordSettlement({
      type: 'buy',
      amount: -Math.abs(totalCost),
      note: `Bought ${quantity} of ${symbol}`
    });

    await logAssetTransaction({
      symbol,
      type,
      action: 'buy',
      quantity,
      price
    });

    res.status(201).json({ message: 'Asset added', assetId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// REMOVE ASSET
const removeAssetController = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || quantity <= 0) {
      return res.status(400).json({ error: 'Symbol and positive quantity required' });
    }

    const asset = await getAssetBySymbol(symbol);
    if (!asset || asset.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity or asset not found' });
    }

    const quote = await getQuote(symbol);
    if (!quote || !quote.c) {
      return res.status(500).json({ error: 'Could not fetch live price' });
    }

    const sellPrice = quote.c;
    const totalSell = sellPrice * quantity;

    const remaining = asset.quantity - quantity;
    await updateAssetOnSell(asset.id, remaining);

    await recordSettlement({
      type: 'sell',
      amount: +Math.abs(totalSell),
      note: `Sold ${quantity} of ${symbol}`
    });

    await logAssetTransaction({
      symbol,
      type: asset.type,
      action: 'sell',
      quantity,
      price: sellPrice
    });

    res.status(200).json({
      message: 'Asset removed',
      total_received: totalSell.toFixed(2),
      remaining
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET PORTFOLIO
const getPortfolioController = async (req, res) => {
  try {
    const assets = await getAllAssets();
    const portfolio = [];

    for (const asset of assets) {
      const quote = await getQuote(asset.symbol);

      if (!quote || !quote.c) {
        portfolio.push({ ...asset, error: 'No live price' });
        continue;
      }

      const current_price = quote.c;
      const current_value = current_price * asset.quantity;
      const percent_change = ((current_price - asset.price) / asset.price) * 100;
      const unrealized_profit = current_value - asset.quantity * asset.price;

      portfolio.push({
        ...asset,
        current_price,
        current_value,
        percent_change: percent_change.toFixed(2),
        unrealized_profit: unrealized_profit.toFixed(2)
      });
    }

    res.status(200).json({ portfolio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAssetTransactionHistoryController = async (req, res) => {
  try {
    const history = await getAssetTransactionHistory();
    res.status(200).json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  addAssetController,
  removeAssetController,
  getPortfolioController,
  getAssetTransactionHistoryController
};
