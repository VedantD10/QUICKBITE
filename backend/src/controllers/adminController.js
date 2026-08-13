const db = require('../config/db');

async function getPendingRestaurants(req, res) {
  const restaurants = db.find('restaurants', r => !r.is_approved);
  return res.json({ success: true, count: restaurants.length, data: restaurants });
}

async function approveRestaurant(req, res) {
  const { id } = req.params;
  const restaurant = db.findById('restaurants', id);
  if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

  const updated = db.update('restaurants', id, { is_approved: true, status: 'OPEN' });
  return res.json({ success: true, message: `Restaurant '${restaurant.name}' approved for live ordering!`, data: updated });
}

async function rejectRestaurant(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const restaurant = db.findById('restaurants', id);
  if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

  db.delete('restaurants', id);
  return res.json({ success: true, message: `Restaurant registration rejected. Reason: ${reason || 'Incomplete documentation'}` });
}

async function getUsers(req, res) {
  const { role, search } = req.query;
  let users = db.find('users', () => true);

  if (role) {
    users = users.filter(u => u.role === role);
  }

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  const safeUsers = users.map(({ password_hash, ...u }) => u);
  return res.json({ success: true, count: safeUsers.length, data: safeUsers });
}

async function suspendUser(req, res) {
  const { id } = req.params;
  const { is_suspended, reason } = req.body;

  const user = db.findById('users', id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const updated = db.update('users', id, {
    is_suspended: is_suspended !== undefined ? is_suspended : true,
    suspension_reason: reason || 'Fraudulent activity flag'
  });

  return res.json({ success: true, message: `User account ${updated.is_suspended ? 'suspended' : 'reactivated'}`, data: updated });
}

async function getPlatformOrders(req, res) {
  const orders = db.find('orders', () => true).sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at));

  const detailedOrders = orders.map(o => {
    const restaurant = db.findById('restaurants', o.restaurant_id);
    const customer = db.findById('users', o.customer_id);
    return {
      ...o,
      restaurant_name: restaurant ? restaurant.name : 'Unknown',
      customer_name: customer ? customer.name : 'Customer'
    };
  });

  return res.json({ success: true, data: detailedOrders });
}

async function getComplaints(req, res) {
  const complaints = db.find('complaints', () => true);
  const detailed = complaints.map(c => {
    const customer = db.findById('users', c.customer_id);
    const order = db.findById('orders', c.order_id);
    return {
      ...c,
      customer_name: customer ? customer.name : 'Customer',
      order_number: order ? order.order_number : 'N/A'
    };
  });

  return res.json({ success: true, data: detailed });
}

async function resolveComplaint(req, res) {
  const { id } = req.params;
  const { resolution_notes, refund_amount } = req.body;

  const complaint = db.findById('complaints', id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint record not found' });

  const updated = db.update('complaints', id, {
    status: 'RESOLVED',
    resolution_notes: resolution_notes || 'Resolved by Platform Admin',
    refund_amount: parseFloat(refund_amount || 0),
    resolved_by_admin_id: req.user.id
  });

  return res.json({ success: true, message: 'Complaint marked as resolved', data: updated });
}

async function getPlatformAnalytics(req, res) {
  const users = db.find('users', () => true);
  const restaurants = db.find('restaurants', () => true);
  const orders = db.find('orders', () => true);
  const drivers = db.find('delivery_partners', () => true);
  const complaints = db.find('complaints', () => true);

  const completedOrders = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

  const gmv = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const cancellationRate = orders.length ? +((cancelledOrders.length / orders.length) * 100).toFixed(1) : 0;

  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      activeRestaurants: restaurants.filter(r => r.is_approved && r.status === 'OPEN').length,
      pendingRestaurants: restaurants.filter(r => !r.is_approved).length,
      activeDrivers: drivers.filter(d => d.is_online).length,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      gmv: +gmv.toFixed(2),
      cancellationRate,
      openComplaints: complaints.filter(c => c.status === 'OPEN').length
    }
  });
}

module.exports = {
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getUsers,
  suspendUser,
  getPlatformOrders,
  getComplaints,
  resolveComplaint,
  getPlatformAnalytics
};
