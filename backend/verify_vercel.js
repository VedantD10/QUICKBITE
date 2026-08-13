const db = require('./src/config/db');
const seedData = require('./src/utils/seedData');
const authController = require('./src/controllers/authController');

async function testVercelBackend() {
  console.log('🧪 Testing Vercel Backend Architecture & Endpoints...');
  console.log('==================================================');

  // 1. Seed database in memory
  await seedData();

  console.log(`✅ Database Seeded in Memory!`);
  console.log(`Restaurants count: ${db.getTable('restaurants').length}`);
  console.log(`Dishes count: ${db.getTable('menu_items').length}`);
  console.log(`Users count: ${db.getTable('users').length}`);

  if (db.getTable('restaurants').length !== 25) {
    throw new Error(`Expected 25 restaurants, got ${db.getTable('restaurants').length}`);
  }

  // Helper mock req/res
  const mockRes = () => {
    let statusCode = 200;
    let jsonBody = null;
    return {
      status(code) { statusCode = code; return this; },
      json(body) { jsonBody = body; return this; },
      get code() { return statusCode; },
      get body() { return jsonBody; }
    };
  };

  // 2. Test Customer Login
  console.log('\n🔹 Testing CUSTOMER Login (customer@quickbite.com)...');
  const custRes = mockRes();
  await authController.login({ body: { email: 'customer@quickbite.com', password: 'password123' } }, custRes);
  console.log('Customer Login Status:', custRes.code);
  console.log('Customer User:', custRes.body.user.name, 'Role:', custRes.body.user.role);
  if (!custRes.body.token || custRes.body.user.role !== 'CUSTOMER') {
    throw new Error('Customer login failed!');
  }

  // 3. Test Restaurant Owner Login
  console.log('\n🔹 Testing RESTAURANT Login (owner@quickbite.com)...');
  const restRes = mockRes();
  await authController.login({ body: { email: 'owner@quickbite.com', password: 'password123' } }, restRes);
  console.log('Restaurant Owner Login Status:', restRes.code);
  console.log('Restaurant User:', restRes.body.user.name, 'Role:', restRes.body.user.role);
  if (!restRes.body.token || restRes.body.user.role !== 'RESTAURANT') {
    throw new Error('Restaurant login failed!');
  }

  // 4. Test Delivery Rider Login
  console.log('\n🔹 Testing DELIVERY Login (delivery@quickbite.com)...');
  const delRes = mockRes();
  await authController.login({ body: { email: 'delivery@quickbite.com', password: 'password123' } }, delRes);
  console.log('Delivery Rider Login Status:', delRes.code);
  console.log('Delivery User:', delRes.body.user.name, 'Role:', delRes.body.user.role);
  if (!delRes.body.token || delRes.body.user.role !== 'DELIVERY') {
    throw new Error('Delivery login failed!');
  }

  // 5. Test Admin Login
  console.log('\n🔹 Testing ADMIN Login (admin@quickbite.com)...');
  const admRes = mockRes();
  await authController.login({ body: { email: 'admin@quickbite.com', password: 'password123' } }, admRes);
  console.log('Admin Login Status:', admRes.code);
  console.log('Admin User:', admRes.body.user.name, 'Role:', admRes.body.user.role);
  if (!admRes.body.token || admRes.body.user.role !== 'ADMIN') {
    throw new Error('Admin login failed!');
  }

  console.log('\n==================================================');
  console.log('✅ ALL VERCEL BACKEND ARCHITECTURE TESTS PASSED PERFECTLY!');
}

testVercelBackend().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
