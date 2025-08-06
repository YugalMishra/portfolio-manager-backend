const { getHistoricalData } = require('../utils/yahoo');

const getChartDataController = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const chart = await getHistoricalData(symbol);

    if (!chart || chart.length === 0) {
      return res.status(404).json({ error: 'No chart data found' });
    }

    res.status(200).json({ symbol, chart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getChartDataController
};