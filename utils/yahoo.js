const yahooFinance = require('yahoo-finance2').default;

const getHistoricalData = async (symbol) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 60 * 60 * 24 * 30;

    const result = await yahooFinance.chart(symbol, {
      period1: thirtyDaysAgo,
      period2: now,
      interval: '1d'
    });

    if (!result || !result.quotes || result.quotes.length === 0) {
      return null;
    }

    // Format: [{ date: 'YYYY-MM-DD', close: number }]
    const chart = result.quotes.map(q => ({
      date: new Date(q.date).toISOString().split('T')[0],
      close: q.close
    })).filter(d => d.close !== null);

    return chart;
  } catch (err) {
    console.error('Yahoo error:', err.response?.data || err.message);
    return null;
  }
};

module.exports = {
  getHistoricalData
};
