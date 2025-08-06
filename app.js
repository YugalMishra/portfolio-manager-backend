const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Load routes
const assetRoutes = require('./routes/assetRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const compareRoutes = require('./routes/compareRoutes');
const chartRoutes = require('./routes/chartRoutes')
const portfolioRoutes = require('./routes/portfolioRoutes');


app.use('/api/assets', assetRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/chart', chartRoutes)
app.use('/api/compare', compareRoutes);
app.use('/api/portfolio', portfolioRoutes);


app.get('/', (req, res) => {
  res.send('Portfolio Manager Backend is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));