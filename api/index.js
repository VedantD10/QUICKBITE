const express = require('express');
const cors = require('cors');

const apiRoutes = require('../backend/src/routes/apiRoutes');
const seedData = require('../backend/src/utils/seedData');
const db = require('../backend/src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

let isSeeded = false;

// Middleware to ensure database is seeded on Vercel cold starts before handling requests
app.use(async (req, res, next) => {
  if (!isSeeded || db.getTable('restaurants').length === 0) {
    try {
      await seedData();
      isSeeded = true;
    } catch (err) {
      console.error('Vercel cold start seed error:', err);
    }
  }
  next();
});

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'QuickBite Food Delivery Platform Backend on Vercel',
    timestamp: new Date().toISOString(),
    restaurantsCount: db.getTable('restaurants').length,
    dishesCount: db.getTable('menu_items').length
  });
});

module.exports = app;
