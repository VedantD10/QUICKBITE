const express = require('express');
const cors = require('cors');

const apiRoutes = require('../backend/src/routes/apiRoutes');
const seedData = require('../backend/src/utils/seedData');
const db = require('../backend/src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Auto-seed in-memory database synchronously at module load time for instant cold-start readiness
if (db.getTable('restaurants').length === 0) {
  try {
    seedData();
  } catch (err) {
    console.error('Database seeding error:', err);
  }
}

// Health check endpoint (Requirements 9 & 10)
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'QuickBite Food Delivery Platform Backend on Vercel',
    timestamp: new Date().toISOString(),
    restaurantsCount: db.getTable('restaurants').length,
    dishesCount: db.getTable('menu_items').length
  });
});

// Mount routes on BOTH /api and / to handle all Vercel rewrite paths
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

module.exports = app;
