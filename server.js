require('dotenv').config();
require('./config/db');
const express = require('express');
const cors = require('cors');

const portfolioRoutes = require('./routes/portfolioRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);
app.use('/api/account', accountRoutes);

app.get('/', (req, res) => res.send('Portfolio Manager API is running'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));