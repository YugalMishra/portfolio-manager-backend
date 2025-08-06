const yahooFinance = require('yahoo-finance2').default;

const getQuote = async (symbol) => {
  try {
    const result = await yahooFinance.quote(symbol);
    return result.regularMarketPrice || null;
  } catch (err) {
    console.error('Yahoo quote error:', err.message);
    return null;
  }
};

module.exports = {
  getQuote
};
