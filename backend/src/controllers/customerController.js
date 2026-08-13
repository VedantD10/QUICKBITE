const db = require('../config/db');
const orderService = require('../services/orderService');

async function getRestaurants(req, res) {
  const { search, cuisine } = req.query;
  let restaurants = db.find('restaurants', r => r.is_approved !== false);

  if (search) {
    const q = search.toLowerCase();
    restaurants = restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      (Array.isArray(r.cuisine_types) ? r.cuisine_types.some(c => c.toLowerCase().includes(q)) : r.cuisine_types.toLowerCase().includes(q))
    );
  }

  if (cuisine && cuisine !== 'All') {
    const cQ = cuisine.toLowerCase();
    restaurants = restaurants.filter(r =>
      Array.isArray(r.cuisine_types)
        ? r.cuisine_types.some(c => c.toLowerCase().includes(cQ))
        : r.cuisine_types.toLowerCase().includes(cQ)
    );
  }

  return res.json({ success: true, data: restaurants });
}

async function getRestaurantById(req, res) {
  const { id } = req.params;
  const restaurant = db.findById('restaurants', id);
  if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
  return res.json({ success: true, data: restaurant });
}

async function getRestaurantMenu(req, res) {
  const { id } = req.params;
  let categories = db.find('menu_categories', c => c.restaurant_id === id);
  const items = db.find('menu_items', i => i.restaurant_id === id);

  if (!categories.length && items.length) {
    categories = [{ id: `cat_def_${id}`, restaurant_id: id, name: 'Chef Specials', sort_order: 1 }];
  }

  const menu = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id || !item.category_id)
  })).filter(cat => cat.items.length > 0);

  if (!menu.length && items.length) {
    menu.push({
      id: `cat_all_${id}`,
      restaurant_id: id,
      name: 'All Delicious Dishes',
      items: items
    });
  }

  return res.json({ success: true, data: menu });
}

async function getAddresses(req, res) {
  const addresses = db.find('addresses', a => a.user_id === req.user.id);
  return res.json({ success: true, data: addresses });
}

async function addAddress(req, res) {
  const { address_type, flat_no, street, landmark, city, pincode, lat, lng } = req.body;
  if (!flat_no || !street || !city || !pincode) {
    return res.status(400).json({ success: false, message: 'Flat/house no, street, city, and pincode are required.' });
  }

  const address = db.insert('addresses', {
    id: `addr_${Date.now()}`,
    user_id: req.user.id,
    address_type: address_type || 'Home',
    flat_no,
    street,
    landmark: landmark || '',
    city,
    pincode,
    lat: lat || 19.0760,
    lng: lng || 72.8777,
    is_default: true
  });

  return res.status(201).json({ success: true, message: 'Address saved successfully', data: address });
}

async function placeOrder(req, res) {
  try {
    const { restaurantId, addressId, items, paymentMethod, notes } = req.body;

    if (!restaurantId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Restaurant and order items are required' });
    }

    let targetAddressId = addressId;
    if (!targetAddressId) {
      const userAddresses = db.find('addresses', a => a.user_id === req.user.id);
      if (userAddresses.length) {
        targetAddressId = userAddresses[0].id;
      } else {
        const defaultAddr = db.insert('addresses', {
          id: `addr_${Date.now()}`,
          user_id: req.user.id,
          address_type: 'Home',
          flat_no: 'Flat 402, Shivam Heights',
          street: 'Linking Road, Bandra West',
          city: 'Mumbai',
          pincode: '400050',
          lat: 19.0596,
          lng: 72.8295,
          is_default: true
        });
        targetAddressId = defaultAddr.id;
      }
    }

    const order = await orderService.createOrder({
      customerId: req.user.id,
      restaurantId,
      addressId: targetAddressId,
      items,
      paymentMethod,
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });

  } catch (err) {
    console.error('Order creation error:', err.message);
    return res.status(400).json({
      success: false,
      error: 'ORDER_FAILED',
      message: err.message
    });
  }
}

async function getOrders(req, res) {
  const user = req.user;
  let orders = [];

  if (user.role === 'CUSTOMER') {
    orders = db.find('orders', o => o.customer_id === user.id);
  } else if (user.role === 'RESTAURANT') {
    const rest = db.findOne('restaurants', r => r.owner_id === user.id);
    if (rest) orders = db.find('orders', o => o.restaurant_id === rest.id);
  } else if (user.role === 'DELIVERY') {
    orders = db.find('orders', o => o.delivery_partner_id === user.id);
  } else if (user.role === 'ADMIN') {
    orders = db.find('orders', () => true);
  }

  orders.sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at));

  const detailedOrders = orders.map(o => {
    const items = db.find('order_items', oi => oi.order_id === o.id);
    const restaurant = db.findById('restaurants', o.restaurant_id);
    const address = db.findById('addresses', o.address_id);
    const partner = o.delivery_partner_id ? db.findById('users', o.delivery_partner_id) : null;

    return {
      ...o,
      items,
      restaurant_name: restaurant ? restaurant.name : 'QuickBite Restaurant',
      address,
      delivery_partner: partner ? { name: partner.name, phone: partner.phone } : null
    };
  });

  return res.json({ success: true, data: detailedOrders });
}

async function getOrderById(req, res) {
  const { id } = req.params;
  const order = db.findById('orders', id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const items = db.find('order_items', oi => oi.order_id === order.id);
  const restaurant = db.findById('restaurants', order.restaurant_id);
  const address = db.findById('addresses', order.address_id);
  const partner = order.delivery_partner_id ? db.findById('users', order.delivery_partner_id) : null;

  return res.json({
    success: true,
    data: {
      ...order,
      items,
      restaurant,
      address,
      delivery_partner: partner
    }
  });
}

async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await orderService.cancelOrder(id, req.user.id, reason || 'Customer requested cancellation');
    return res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: 'CANCELLATION_FORBIDDEN',
      message: err.message
    });
  }
}

async function rateOrder(req, res) {
  const { order_id, restaurant_rating, delivery_rating, review_text } = req.body;

  const order = db.findById('orders', order_id);
  if (!order || order.customer_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized or order not found' });
  }

  const rating = db.insert('ratings', {
    id: `rate_${Date.now()}`,
    order_id,
    customer_id: req.user.id,
    restaurant_id: order.restaurant_id,
    delivery_partner_id: order.delivery_partner_id,
    restaurant_rating: parseInt(restaurant_rating || 5),
    delivery_rating: parseInt(delivery_rating || 5),
    review_text: review_text || '',
    created_at: new Date().toISOString()
  });

  return res.status(201).json({ success: true, message: 'Rating submitted. Thank you for your feedback!', data: rating });
}

async function clearOrderHistory(req, res) {
  const user = req.user;
  let targetOrderIds = [];

  if (user.role === 'CUSTOMER') {
    const userOrders = db.find('orders', o => o.customer_id === user.id);
    targetOrderIds = userOrders.map(o => o.id);
    db.delete('orders', o => o.customer_id === user.id);
  } else if (user.role === 'ADMIN') {
    db.delete('orders', () => true);
    db.delete('order_items', () => true);
    db.delete('order_status_history', () => true);
    db.delete('delivery_assignments', () => true);
    return res.json({ success: true, message: 'Platform order history cleared completely' });
  } else if (user.role === 'RESTAURANT') {
    const rest = db.findOne('restaurants', r => r.owner_id === user.id);
    if (rest) {
      const restOrders = db.find('orders', o => o.restaurant_id === rest.id);
      targetOrderIds = restOrders.map(o => o.id);
      db.delete('orders', o => o.restaurant_id === rest.id);
    }
  }

  if (targetOrderIds.length > 0) {
    const orderIdSet = new Set(targetOrderIds);
    db.delete('order_items', oi => orderIdSet.has(oi.order_id));
    db.delete('order_status_history', osh => orderIdSet.has(osh.order_id));
    db.delete('delivery_assignments', da => orderIdSet.has(da.order_id));
  }

  return res.json({ success: true, message: 'Order history cleared successfully' });
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getAddresses,
  addAddress,
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
  clearOrderHistory
};
