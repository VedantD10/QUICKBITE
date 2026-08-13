const express = require('express');
const cors = require('cors');

const apiRoutes = require('../backend/src/routes/apiRoutes');
const seedData = require('../backend/src/utils/seedData');
const db = require('../backend/src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Auto-seed database if empty
if (db.getTable('users').length === 0) {
  seedData();
}

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'QuickBite Food Delivery Platform Backend on Vercel',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
