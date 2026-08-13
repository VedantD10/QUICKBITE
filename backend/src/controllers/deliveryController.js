const db = require('../config/db');
const orderService = require('../services/orderService');
const socketHandler = require('../socket/socketHandler');

async function getMyProfile(req, res) {
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Delivery partner profile not found' });
  return res.json({ success: true, data: partner });
}

async function toggleDriverStatus(req, res) {
  const { is_online } = req.body;
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Driver profile not found' });

  const updated = db.update('delivery_partners', partner.id, { is_online: Boolean(is_online) });
  return res.json({
    success: true,
    message: `Driver status updated to ${updated.is_online ? 'ONLINE' : 'OFFLINE'}`,
    data: updated
  });
}

async function getAssignedDeliveries(req, res) {
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

  let assignments = db.find('delivery_assignments', da => da.partner_id === partner.id && ['ASSIGNED', 'ACCEPTED'].includes(da.status));

  // FALLBACK: If no explicit assignment record exists, find orders ready for pickup or assigned to this driver
  if (!assignments.length) {
    const activeOrders = db.find('orders', o =>
      ['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status) &&
      (!o.delivery_partner_id || o.delivery_partner_id === partner.id || o.delivery_partner_id === req.user.id)
    );

    if (activeOrders.length > 0) {
      assignments = activeOrders.map(o => {
        let existingAssign = db.findOne('delivery_assignments', da => da.order_id === o.id);
        if (!existingAssign) {
          existingAssign = db.insert('delivery_assignments', {
            id: `da_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            order_id: o.id,
            partner_id: partner.id,
            status: 'ASSIGNED',
            assigned_at: new Date().toISOString()
          });
        }
        return existingAssign;
      });
    }
  }

  const deliveries = assignments.map(a => {
    const order = db.findById('orders', a.order_id);
    if (!order) return null;
    const restaurant = db.findById('restaurants', order.restaurant_id);
    const customer = db.findById('users', order.customer_id);
    const address = db.findById('addresses', order.address_id);
    const items = db.find('order_items', oi => oi.order_id === order.id);

    return {
      assignment_id: a.id,
      assignment_status: a.status,
      order_id: order.id,
      order_number: order.order_number,
      order_status: order.status,
      total_amount: order.total_amount,
      restaurant: restaurant ? { name: restaurant.name, address: restaurant.address, phone: restaurant.phone } : null,
      customer: customer ? { name: customer.name, phone: customer.phone } : null,
      address,
      items
    };
  }).filter(Boolean);

  return res.json({ success: true, data: deliveries });
}

async function acceptAssignment(req, res) {
  const { orderId } = req.body;
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Driver profile not found' });

  // Accept by orderId or assignmentId
  let assignment = db.findOne('delivery_assignments', da => (da.id === orderId || da.order_id === orderId) && da.partner_id === partner.id);
  if (!assignment) {
    // Auto-create assignment record if accepting directly
    assignment = db.insert('delivery_assignments', {
      id: `da_${Date.now()}`,
      order_id: orderId,
      partner_id: partner.id,
      status: 'ASSIGNED',
      assigned_at: new Date().toISOString()
    });
  }

  db.update('delivery_assignments', assignment.id, { status: 'ACCEPTED', responded_at: new Date().toISOString() });
  db.update('delivery_partners', partner.id, { is_busy: true });
  db.update('orders', assignment.order_id, { delivery_partner_id: req.user.id, status: 'DELIVERY_ASSIGNED' });

  const order = db.findById('orders', assignment.order_id);
  if (order) socketHandler.emitOrderStatusChanged(order);

  return res.json({ success: true, message: 'Delivery assignment accepted! Proceed to pickup.' });
}

async function rejectAssignment(req, res) {
  try {
    const { orderId, reason } = req.body;
    const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    let assignment = db.findOne('delivery_assignments', da => (da.id === orderId || da.order_id === orderId) && da.partner_id === partner.id);
    const targetAssignId = assignment ? assignment.id : orderId;

    const result = await orderService.rejectDeliveryAssignment(targetAssignId, partner.id, reason);
    return res.json({ success: true, message: 'Delivery rejected and reassignment initiated', data: result });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'REJECTION_FAILED', message: err.message });
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition for delivery' });
    }

    const order = await orderService.updateOrderStatus(orderId, status, req.user.id);
    return res.json({ success: true, message: `Delivery updated to ${status}`, data: order });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateLocation(req, res) {
  const { lat, lng, speed } = req.body;
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (partner && lat && lng) {
    db.update('delivery_partners', partner.id, { current_lat: lat, current_lng: lng });
    socketHandler.emitDriverLocationUpdate(req.user.id, { lat, lng, speed: speed || 30 });
  }
  return res.json({ success: true, message: 'Driver GPS location updated' });
}

async function getEarnings(req, res) {
  const partner = db.findOne('delivery_partners', dp => dp.user_id === req.user.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Driver profile not found' });

  const completedTrips = db.find('orders', o => o.delivery_partner_id === req.user.id && (o.status === 'DELIVERED' || o.status === 'COMPLETED'));

  return res.json({
    success: true,
    data: {
      earningsTotal: partner.earnings_total || completedTrips.length * 45.00,
      totalDeliveries: partner.total_deliveries || completedTrips.length,
      rating: partner.rating
    }
  });
}

module.exports = {
  getMyProfile,
  toggleDriverStatus,
  getAssignedDeliveries,
  acceptAssignment,
  rejectAssignment,
  updateDeliveryStatus,
  updateLocation,
  getEarnings
};
