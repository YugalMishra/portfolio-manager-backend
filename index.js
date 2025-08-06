const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const portfolioRoutes = require('./routes/portfolioroute');
app.use('/api', portfolioRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
