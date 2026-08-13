const db = require('../config/db');
const orderService = require('../services/orderService');
const socketHandler = require('../socket/socketHandler');

async function getMyRestaurant(req, res) {
  const restaurants = db.find('restaurants', r => r.owner_id === req.user.id);
  if (!restaurants.length) {
    return res.status(404).json({ success: false, message: 'No restaurant profile associated with this account' });
  }
  return res.json({
    success: true,
    data: restaurants[0],
    restaurants: restaurants
  });
}

async function registerRestaurant(req, res) {
  const { name, tagline, description, cuisine_types, address, city, pincode, phone, image_url } = req.body;
  if (!name || !address || !phone) {
    return res.status(400).json({ success: false, message: 'Name, address, and phone number are required.' });
  }

  const restaurant = db.insert('restaurants', {
    id: `rest_${Date.now()}`,
    owner_id: req.user.id,
    name,
    tagline: tagline || 'Delicious Chef Crafted Meals',
    description: description || 'Fresh ingredients prepared daily.',
    cuisine_types: cuisine_types || ['Multicuisine'],
    address,
    city: city || 'Mumbai',
    pincode: pincode || '400001',
    lat: 19.0760,
    lng: 72.8777,
    phone,
    rating: 4.5,
    rating_count: 0,
    avg_prep_time_mins: 20,
    min_order_amount: 100.00,
    image_url: image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    banner_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    status: 'OPEN',
    is_approved: false,
    opening_time: '10:00',
    closing_time: '23:00'
  });

  return res.status(201).json({ success: true, message: 'Restaurant profile submitted for admin review', data: restaurant });
}

async function toggleStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'CLOSED', 'TEMPORARILY_UNAVAILABLE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value. Allowed: OPEN, CLOSED, TEMPORARILY_UNAVAILABLE' });
  }

  const restaurant = db.findById('restaurants', id);
  if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

  const updated = db.update('restaurants', id, { status });

  // Broadcast real-time availability change via Socket.IO
  socketHandler.emitRestaurantStatusChanged(id, status);

  return res.json({ success: true, message: `Restaurant status updated to ${status}`, data: updated });
}

async function addMenuItem(req, res) {
  const { restaurant_id, name, description, price, is_veg, category_name, stock_quantity, image_url } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Item name and price are required' });
  }

  let restId = restaurant_id;
  if (!restId) {
    const myRest = db.findOne('restaurants', r => r.owner_id === req.user.id);
    if (!myRest) return res.status(400).json({ success: false, message: 'No restaurant found for user' });
    restId = myRest.id;
  }

  let category = db.findOne('menu_categories', c => c.restaurant_id === restId && c.name.toLowerCase() === (category_name || 'Chef Specials').toLowerCase());
  if (!category) {
    category = db.insert('menu_categories', {
      id: `cat_${Date.now()}`,
      restaurant_id: restId,
      name: category_name || 'Chef Specials',
      sort_order: 1
    });
  }

  const item = db.insert('menu_items', {
    id: `item_${Date.now()}`,
    restaurant_id: restId,
    category_id: category.id,
    name,
    description: description || '',
    price: parseFloat(price),
    is_veg: is_veg !== undefined ? is_veg : true,
    is_spicy: false,
    is_available: true,
    stock_quantity: parseInt(stock_quantity || 30),
    image_url: image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'
  });

  return res.status(201).json({ success: true, message: 'Menu item created successfully', data: item });
}

async function updateMenuItem(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const item = db.findById('menu_items', id);
  if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

  const updated = db.update('menu_items', id, updates);
  return res.json({ success: true, message: 'Menu item updated', data: updated });
}

async function deleteMenuItem(req, res) {
  const { id } = req.params;
  const deleted = db.delete('menu_items', id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });

  return res.json({ success: true, message: 'Menu item deleted successfully' });
}

async function getRestaurantOrders(req, res) {
  const { restaurant_id } = req.query;
  let restId = restaurant_id;

  if (!restId) {
    const myRest = db.findOne('restaurants', r => r.owner_id === req.user.id);
    if (!myRest) return res.json({ success: true, data: [] });
    restId = myRest.id;
  }

  const orders = db.find('orders', o => o.restaurant_id === restId);
  orders.sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at));

  const detailedOrders = orders.map(o => {
    const items = db.find('order_items', oi => oi.order_id === o.id);
    const customer = db.findById('users', o.customer_id);
    const address = db.findById('addresses', o.address_id);
    const partner = o.delivery_partner_id ? db.findById('users', o.delivery_partner_id) : null;

    return {
      ...o,
      items,
      customer_name: customer ? customer.name : 'Valued Customer',
      address,
      delivery_partner: partner ? { name: partner.name, phone: partner.phone } : null
    };
  });

  return res.json({ success: true, data: detailedOrders });
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await orderService.updateOrderStatus(id, status, req.user.id, notes);

    // Broadcast real-time status update via Socket.IO
    socketHandler.emitOrderStatusChanged(order);

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

async function getAnalytics(req, res) {
  const { restaurant_id } = req.query;
  let restId = restaurant_id;

  if (!restId) {
    const myRest = db.findOne('restaurants', r => r.owner_id === req.user.id);
    if (!myRest) return res.json({ success: true, data: {} });
    restId = myRest.id;
  }

  const orders = db.find('orders', o => o.restaurant_id === restId && o.status !== 'CANCELLED');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  return res.json({
    success: true,
    data: {
      totalOrders: orders.length,
      completedOrders,
      totalRevenue,
      averageOrderValue: orders.length ? +(totalRevenue / orders.length).toFixed(2) : 0
    }
  });
}

module.exports = {
  getMyRestaurant,
  registerRestaurant,
  toggleStatus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantOrders,
  updateOrderStatus,
  getAnalytics
};
