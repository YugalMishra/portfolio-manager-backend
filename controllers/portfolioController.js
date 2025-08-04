require('dotenv').config();
const db = require('../config/db');
const axios = require('axios');

exports.buyStock = async (req, res) => {
    const { ticker, quantity } = req.body;

    if(!ticker || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Ticker and quantity are required and must be valid'});
    }

    try {
        const [cacheRows] = await db.execute('SELECT price, last_updated FROM price_cache WHERE ticker =?', [ticker.toUpperCase()]);
        let price;

        if(cacheRows.length > 0 && new Date() - new Date(cacheRows[0].last_updated) < 5*60*1000) {
            price = cacheRows[0].price;
        } else {
            const finnhubKey = process.env.FINNHUB_API_KEY;
            const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
                params: {
                    symbol: `${ticker.toUpperCase()}`,
                    token: finnhubKey
                }
            });

            const currentPrice = response.data.c;
            if (!currentPrice) {
                return res.status(400).json({ error: "Could not retrieve live price for ticker" });
            }

            price = parseFloat(currentPrice.toFixed(2));

            if (!price) return res.status(400).json({ error: "Could not retrieve price for ticker"});

            await db.execute(
                'REPLACE INTO price_cache (ticker, price, last_updated) VALUES (?, ?, NOW())',
                [ticker.toUpperCase(), price]
            );
        }

        const priceNum = parseFloat(price);
        const quantityNum = parseFloat(quantity);
        const totalCost = priceNum * quantityNum;

        const [balanceRows] = await db.query(`SELECT SUM(CASE 
            WHEN action = 'DEPOSIT' THEN amount
            WHEN action = 'SALE_PROCEEDS' THEN amount
            else -amount END) AS balance
        FROM account_transactions`);

        const balance = balanceRows[0].balance || 0;

        if(balance < totalCost) {
            return res.status(400).json({error: 'Insufficient funds to buy stock'});
        }

        await db.execute(
      `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
      ['WITHDRAW', totalCost, `Bought ${quantity} of ${ticker.toUpperCase()} at ${price}`]
    );

    await db.execute(
      `INSERT INTO transactions (action, asset_type, ticker, quantity, price_per_unit, total_value) VALUES (?, ?, ?, ?, ?, ?)`,
      ['BUY', 'stock', ticker.toUpperCase(), quantity, price, totalCost]
    );


    const [holdingRows] = await db.execute(
      'SELECT quantity, avg_buy_price FROM portfolio_items WHERE ticker = ? AND asset_type = "stock"',
      [ticker.toUpperCase()]
    );

    if (holdingRows.length > 0) {
      const oldQty = holdingRows[0].quantity;
      const oldAvg = holdingRows[0].avg_buy_price;

      const newQty = parseFloat(oldQty) + parseFloat(quantity);
      const newAvg = ((oldQty * oldAvg) + (quantity * price)) / newQty;

      await db.execute(
        `UPDATE portfolio_items SET quantity = ?, avg_buy_price = ? WHERE ticker = ? AND asset_type = "stock"`,
        [newQty, newAvg, ticker.toUpperCase()]
      );
    } else {
      await db.execute(
        `INSERT INTO portfolio_items (asset_type, ticker, quantity, avg_buy_price) VALUES (?, ?, ?, ?)`,
        ['stock', ticker.toUpperCase(), quantity, price]
      );
    }

    res.status(201).json({ message: `Successfully bought ${quantity} of ${ticker} at ₹${price}` });
  } catch (err) {
    console.error('Buy stock error:', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.sellStock = async (req, res) => {
  const { ticker, quantity } = req.body;

  if (!ticker || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Ticker and quantity are required and must be valid" });
  }

  try {
    const upperTicker = ticker.toUpperCase();
    const quantityNum = parseFloat(quantity);

    const [holdingRows] = await db.execute(
      `SELECT quantity, avg_buy_price FROM portfolio_items WHERE ticker = ? AND asset_type = 'stock'`,
      [upperTicker]
    );

    if (holdingRows.length === 0 || holdingRows[0].quantity < quantityNum) {
      return res.status(400).json({ error: "Insufficient holdings to sell" });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    const finnhubRes = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${upperTicker}&token=${apiKey}`);
    const livePrice = finnhubRes.data.c;

    if (!livePrice || livePrice <= 0) {
        return res.status(400).json({ error: 'Could not fetch live price for this ticker' });
    }

    const price = parseFloat(livePrice.toFixed(2));

    const totalValue = price * quantityNum;

    const newQty = holdingRows[0].quantity - quantityNum;

    if (newQty > 0) {
      await db.execute(
        `UPDATE portfolio_items SET quantity = ? WHERE ticker = ? AND asset_type = 'stock'`,
        [newQty, upperTicker]
      );
    } else {
      await db.execute(
        `DELETE FROM portfolio_items WHERE ticker = ? AND asset_type = 'stock'`,
        [upperTicker]
      );
    }

    await db.execute(
      `INSERT INTO transactions (action, asset_type, ticker, quantity, price_per_unit, total_value) VALUES (?, ?, ?, ?, ?, ?)`,
      ['SELL', 'stock', upperTicker, quantityNum, price, totalValue]
    );

    await db.execute(
      `INSERT INTO account_transactions (action, amount, description) VALUES (?, ?, ?)`,
      ['SALE_PROCEEDS', totalValue, `Sold ${quantityNum} of ${upperTicker} at ₹${price}`]
    );

    res.status(201).json({ message: `Successfully sold ${quantity} of ${upperTicker} at ₹${price}` });

  } catch (err) {
    console.error("Sell stock error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPortfolio = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ticker, quantity, avg_buy_price FROM portfolio_items WHERE asset_type = 'stock'`
    );

    if (rows.length === 0) {
      return res.status(200).json({ portfolio: [], totalCurrentValue: 0, totalInvested: 0, totalGainLoss: 0 });
    }

    const tickers = rows.map(row => row.ticker.toUpperCase());
    const priceMap = {};
    const now = new Date();

    for (let ticker of tickers) {
      const [cache] = await db.execute('SELECT price, last_updated FROM price_cache WHERE ticker = ?', [ticker]);

      const lastUpdated = cache.length > 0 ? new Date(cache[0].last_updated) : null;
      const isFresh = lastUpdated && (now - lastUpdated < 24 * 60 * 60 * 1000);

      if (isFresh) {
        priceMap[ticker] = parseFloat(cache[0].price);
      } else {
        try {
          const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
          const closePrice = parseFloat(response.data.c);

          if (closePrice) {
            priceMap[ticker] = closePrice;
            await db.execute(
              `REPLACE INTO price_cache (ticker, price, last_updated) VALUES (?, ?, NOW())`,
              [ticker, closePrice]
            );
          } else {
            console.warn(`No close price for ${ticker}`);
          }
        } catch (err) {
          console.warn(`Failed to fetch Finnhub price for ${ticker}:`, err.message);
        }
      }
    }

    const portfolio = [];
    let totalCurrentValue = 0;
    let totalInvested = 0;

    for (let row of rows) {
      const { ticker, quantity, avg_buy_price } = row;
      const latestPrice = priceMap[ticker.toUpperCase()];
      if (!latestPrice) continue;

      const invested = quantity * avg_buy_price;
      const currentValue = quantity * latestPrice;
      const gainLoss = currentValue - invested;

      totalInvested += invested;
      totalCurrentValue += currentValue;

      portfolio.push({
        ticker,
        quantity,
        avg_buy_price,
        latest_price: latestPrice,
        invested_value: invested,
        current_value: currentValue,
        gain_loss: gainLoss
      });
    }

    const totalGainLoss = totalCurrentValue - totalInvested;

    res.status(200).json({
      portfolio,
      totalCurrentValue,
      totalInvested,
      totalGainLoss
    });

  } catch (err) {
    console.error("Get portfolio error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPerformance = async (req, res) => {
  try {
    const [holdings] = await db.execute(
      'SELECT ticker, quantity, avg_buy_price FROM portfolio_items WHERE asset_type = "stock"'
    );

    let currentValue = 0;
    let investedAmount = 0;
    const now = new Date();

    for (let asset of holdings) {
      const { ticker, quantity, avg_buy_price } = asset;

      const [priceRow] = await db.execute(
        'SELECT price, last_updated FROM price_cache WHERE ticker = ?',
        [ticker]
      );

      let marketPrice;
      const lastUpdated = priceRow.length > 0 ? new Date(priceRow[0].last_updated) : null;
      const isFresh = lastUpdated && (now - lastUpdated < 24 * 60 * 60 * 1000);

      if (isFresh) {
        marketPrice = parseFloat(priceRow[0].price);
      } else {
        try {
          const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
          marketPrice = parseFloat(response.data.c);

          if (marketPrice) {
            await db.execute(
              `REPLACE INTO price_cache (ticker, price, last_updated) VALUES (?, ?, NOW())`,
              [ticker, marketPrice]
            );
          } else {
            console.warn(`No market price for ${ticker}`);
            continue;
          }
        } catch (err) {
          console.warn(`Error fetching price for ${ticker}:`, err.message);
          continue;
        }
      }

      const qty = parseFloat(quantity);
      const avgPrice = parseFloat(avg_buy_price);

      currentValue += qty * marketPrice;
      investedAmount += qty * avgPrice;
    }

    const [realizedRow] = await db.execute(`
      SELECT SUM(amount) as realized FROM account_transactions WHERE action = 'SALE_PROCEEDS'
    `);

    const realizedProfit = parseFloat(realizedRow[0].realized || 0);
    const unrealizedProfit = currentValue - investedAmount;
    const totalProfit = unrealizedProfit + realizedProfit;
    const totalProfitPercent = ((totalProfit) / (investedAmount + realizedProfit)) * 100;

    res.json({
      current_value: currentValue,
      invested_amount: investedAmount,
      realized_profit: realizedProfit,
      unrealized_profit: unrealizedProfit,
      total_profit: totalProfit,
      total_profit_percent: totalProfitPercent.toFixed(2)
    });
  } catch (err) {
    console.error('Performance error:', err.message);
    res.status(500).json({ error: 'Could not calculate performance' });
  }
};
