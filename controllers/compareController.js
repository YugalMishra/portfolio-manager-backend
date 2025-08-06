const { getAssetBySymbol } = require('../models/assetModel');
const { getQuote } = require('../utils/yahooQuote'); // We’ll build this
const { getHistoricalData } = require('../utils/yahoo'); // Already done

const compareAssetsController = async (req, res) => {
  try {
    const { symbol1, symbol2 } = req.params;

    // 🔍 Fetch assets from DB
    const asset1 = await getAssetBySymbol(symbol1.toUpperCase());
    const asset2 = await getAssetBySymbol(symbol2.toUpperCase());

    if (!asset1 || !asset2) {
      return res.status(404).json({ error: 'One or both assets not found in portfolio' });
    }

    // 💰 Live prices
    const quote1 = await getQuote(asset1.symbol);
    const quote2 = await getQuote(asset2.symbol);

    if (!quote1 || !quote2) {
      return res.status(500).json({ error: 'Could not fetch quotes' });
    }

    // 📈 Historical data
    const history1 = await getHistoricalData(asset1.symbol);
    const history2 = await getHistoricalData(asset2.symbol);

    // 🧮 Comparison table
    const buildStats = (asset, quote) => {
      const current_value = quote * asset.quantity;
      const profit = current_value - asset.buy_price;
      const percent_change = (profit / asset.buy_price) * 100;

      return {
        symbol: asset.symbol,
        type: asset.type,
        quantity: asset.quantity,
        buy_price: asset.buy_price,
        current_price: quote,
        current_value: current_value.toFixed(2),
        profit: profit.toFixed(2),
        percent_change: percent_change.toFixed(2)
      };
    };

    const comparison = [buildStats(asset1, quote1), buildStats(asset2, quote2)];

    res.status(200).json({
      comparison,
      chart: {
        [asset1.symbol]: history1,
        [asset2.symbol]: history2
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  compareAssetsController
};
