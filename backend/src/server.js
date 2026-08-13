const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/apiRoutes');
const socketHandler = require('./socket/socketHandler');
const seedData = require('./utils/seedData');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT']
  }
});

socketHandler.initSocket(io);

app.use(cors());
app.use(express.json());

// API Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount REST API Router
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'QuickBite Food Delivery Platform Backend',
    timestamp: new Date().toISOString(),
    usersCount: db.getTable('users').length,
    restaurantsCount: db.getTable('restaurants').length,
    ordersCount: db.getTable('orders').length
  });
});

// Auto-seed database if empty
if (db.getTable('users').length === 0) {
  seedData();
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 QuickBite Operations Backend listening on port ${PORT}`);
  console.log(`📡 Real-Time Socket.IO Server active`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
