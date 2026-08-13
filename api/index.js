const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'QuickBite Food Delivery Platform Backend on Vercel',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
