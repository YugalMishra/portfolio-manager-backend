const { getAllAssets, getRealizedProfit } = require('../models/assetModel');
const { getQuote } = require('../utils/yahooQuote');

const getPortfolioAnalysis = async (req, res) => {
  try {
    const assets = await getAllAssets();
    const realizedProfit = await getRealizedProfit();

    let totalValue = 0;
    let totalUnrealizedProfit = 0;
    const assetBreakdown = {};
    const assetDetails = [];

    for (const asset of assets) {
      const quote = await getQuote(asset.symbol);
      if (!quote) continue;

      const current_price = quote;
      const current_value = current_price * asset.quantity;
      const unrealized_profit = current_value - asset.buy_price;
      const percent_change = (unrealized_profit / asset.buy_price) * 100;

      totalValue += current_value;
      totalUnrealizedProfit += unrealized_profit;

      if (!assetBreakdown[asset.type]) {
        assetBreakdown[asset.type] = current_value;
      } else {
        assetBreakdown[asset.type] += current_value;
      }

      assetDetails.push({
        symbol: asset.symbol,
        type: asset.type,
        quantity: asset.quantity,
        buy_price: asset.buy_price,
        current_price: current_price.toFixed(2),
        current_value: current_value.toFixed(2),
        unrealized_profit: unrealized_profit.toFixed(2),
        percent_change: percent_change.toFixed(2)
      });
    }

    res.status(200).json({
      summary: {
        total_portfolio_value: totalValue.toFixed(2),
        total_unrealized_profit: totalUnrealizedProfit.toFixed(2),
        total_realized_profit: parseFloat(realizedProfit || 0).toFixed(2)
      },
      asset_breakdown: assetBreakdown,
      assets: assetDetails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getPortfolioAnalysis
};
