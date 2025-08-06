const axios = require('axios');
const API_KEY = process.env.FINNHUB_API_KEY;

const getQuote = async (symbol) => {
  try {
    const res = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: API_KEY }
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching quote:', err.message);
    return null;
  }
};

const getCandleData = async (symbol, from, to, resolution = 'D') => {
  try {
    const res = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
      params: {
        symbol,
        resolution,
        from,
        to,
        token: API_KEY
      }
    });
    return res.data;
  } catch (err) {
      console.error('Finnhub error:', err.response?.data || err.message);
      return null;
  }
};

module.exports = {
  getQuote,
  getCandleData
};
