const db = require('../config/db');
const socketHandler = require('../socket/socketHandler');

const ALLOWED_TRANSITIONS = {
  PLACED: ['RESTAURANT_ACCEPTED', 'RESTAURANT_REJECTED', 'CANCELLED'],
  RESTAURANT_ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['DELIVERY_ASSIGNED'],
  DELIVERY_ASSIGNED: ['PICKED_UP', 'DELIVERY_REASSIGNED'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  CANCELLED: [],
  RESTAURANT_REJECTED: [],
  COMPLETED: []
};

async function createOrder({ customerId, restaurantId, addressId, items, paymentMethod }) {
  return await db.transaction(async (tx) => {
    // 1. Verify restaurant status
    const restaurant = tx.findById('restaurants', restaurantId);
    if (!restaurant) throw new Error('RESTAURANT_NOT_FOUND: Restaurant does not exist');
    if (restaurant.status !== 'OPEN') {
      throw new Error(`RESTAURANT_UNAVAILABLE: Restaurant is currently ${restaurant.status}. Orders are paused.`);
    }

    let subtotal = 0;
    const processedItems = [];

    // 2. Atomic Stock Check & Decrement (CRITICAL CONCURRENCY REQUIREMENT - TEST 3)
    for (const itemRequest of items) {
      const menuItem = tx.findById('menu_items', itemRequest.menuItemId);
      if (!menuItem) {
        throw new Error(`ITEM_NOT_FOUND: Menu item ${itemRequest.menuItemId} does not exist`);
      }

      if (!menuItem.is_available) {
        throw new Error(`ITEM_UNAVAILABLE: '${menuItem.name}' is currently marked out-of-stock.`);
      }

      if (menuItem.stock_quantity < itemRequest.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Item '${menuItem.name}' is no longer available in the requested quantity (Available: ${menuItem.stock_quantity}).`);
      }

      // Decrement stock atomically
      const newStock = menuItem.stock_quantity - itemRequest.quantity;
      tx.update('menu_items', menuItem.id, {
        stock_quantity: newStock,
        is_available: newStock > 0 ? menuItem.is_available : false
      });

      const lineSubtotal = menuItem.price * itemRequest.quantity;
      subtotal += lineSubtotal;

      processedItems.push({
        id: `oi_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: itemRequest.quantity,
        subtotal: lineSubtotal
      });
    }

    const taxAmount = +(subtotal * 0.08).toFixed(2);
    const deliveryFee = 40.00;
    const totalAmount = +(subtotal + taxAmount + deliveryFee).toFixed(2);

    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orderNumber = `QB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const newOrder = tx.insert('orders', {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      restaurant_id: restaurantId,
      delivery_partner_id: null,
      address_id: addressId,
      status: 'PLACED',
      subtotal,
      tax_amount: taxAmount,
      delivery_fee: deliveryFee,
      surge_fee: 0.00,
      total_amount: totalAmount,
      payment_method: paymentMethod || 'UPI',
      payment_status: 'COMPLETED',
      placed_at: new Date().toISOString()
    });

    for (const oi of processedItems) {
      tx.insert('order_items', { ...oi, order_id: orderId });
    }

    // Log status history
    tx.insert('order_status_history', {
      id: `osh_${Date.now()}`,
      order_id: orderId,
      previous_status: null,
      new_status: 'PLACED',
      changed_by_user_id: customerId,
      notes: 'Order submitted by customer.'
    });

    // Emit Socket.IO event to kitchen
    socketHandler.emitOrderCreated(newOrder, restaurantId);

    return newOrder;
  });
}

function autoAssignDeliveryPartner(tx, orderId) {
  const availablePartner = tx.findOne('delivery_partners', dp => dp.is_online && !dp.is_busy);
  if (availablePartner) {
    tx.update('orders', orderId, {
      delivery_partner_id: availablePartner.id,
      status: 'DELIVERY_ASSIGNED'
    });

    tx.update('delivery_partners', availablePartner.id, { is_busy: true });

    const assignment = tx.insert('delivery_assignments', {
      id: `da_${Date.now()}`,
      order_id: orderId,
      partner_id: availablePartner.id,
      status: 'ASSIGNED',
      reassignment_count: 0
    });

    socketHandler.emitDeliveryAssigned(assignment, availablePartner.user_id);
  }
}

async function cancelOrder(orderId, userId, reason) {
  return await db.transaction(async (tx) => {
    const order = tx.findById('orders', orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND: Order does not exist');

    // BACKEND BUSINESS RULE ENFORCEMENT: Customer cannot cancel after PREPARING begins (TEST 1 & 2)
    if (['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
      throw new Error(`CANCELLATION_FORBIDDEN: Cannot cancel order after food preparation has started. Current status is ${order.status}.`);
    }

    // Restore inventory stock
    const orderItems = tx.find('order_items', oi => oi.order_id === orderId);
    for (const oi of orderItems) {
      const menuItem = tx.findById('menu_items', oi.menu_item_id);
      if (menuItem) {
        tx.update('menu_items', menuItem.id, {
          stock_quantity: menuItem.stock_quantity + oi.quantity,
          is_available: true
        });
      }
    }

    // Free delivery partner if assigned
    if (order.delivery_partner_id) {
      tx.update('delivery_partners', order.delivery_partner_id, { is_busy: false });
    }

    const updatedOrder = tx.update('orders', orderId, {
      status: 'CANCELLED',
      cancellation_reason: reason || 'Cancelled by customer before preparation.'
    });

    tx.insert('order_status_history', {
      id: `osh_${Date.now()}`,
      order_id: orderId,
      previous_status: order.status,
      new_status: 'CANCELLED',
      changed_by_user_id: userId,
      notes: reason || 'Customer cancelled order.'
    });

    socketHandler.emitOrderStatusChanged(updatedOrder);
    return updatedOrder;
  });
}

async function updateOrderStatus(orderId, newStatus, userId, notes) {
  return await db.transaction(async (tx) => {
    const order = tx.findById('orders', orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND: Order does not exist');

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`INVALID_TRANSITION: Cannot transition order state from '${order.status}' to '${newStatus}'.`);
    }

    const updatedOrder = tx.update('orders', orderId, { status: newStatus });

    tx.insert('order_status_history', {
      id: `osh_${Date.now()}`,
      order_id: orderId,
      previous_status: order.status,
      new_status: newStatus,
      changed_by_user_id: userId,
      notes: notes || `State updated to ${newStatus}`
    });

    if (newStatus === 'READY_FOR_PICKUP') {
      autoAssignDeliveryPartner(tx, orderId);
    }

    // If order completed, update partner earnings & total
    if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
      if (order.delivery_partner_id) {
        const dp = tx.findById('delivery_partners', order.delivery_partner_id);
        if (dp) {
          tx.update('delivery_partners', dp.id, {
            is_busy: false,
            total_deliveries: dp.total_deliveries + 1,
            earnings_total: +(dp.earnings_total + 40.00).toFixed(2)
          });
        }
      }
    }

    socketHandler.emitOrderStatusChanged(updatedOrder);
    return updatedOrder;
  });
}

async function rejectDeliveryAssignment(assignmentId, partnerId, reason) {
  return await db.transaction(async (tx) => {
    const assignment = tx.findById('delivery_assignments', assignmentId);
    if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND: Assignment not found');

    const dp = tx.findById('delivery_partners', partnerId);
    if (dp) {
      tx.update('delivery_partners', dp.id, { is_busy: false });
    }

    tx.update('delivery_assignments', assignmentId, {
      status: 'REJECTED',
      rejection_reason: reason || 'Driver unavailable or declined request'
    });

    // DELIVER REASSIGNMENT WORKFLOW (REQ-09 - TEST 6)
    const previousRejections = tx.find('delivery_assignments', da => da.order_id === assignment.order_id && da.status === 'REJECTED').map(da => da.partner_id);

    const nextPartner = tx.findOne('delivery_partners', p => p.is_online && !p.is_busy && !previousRejections.includes(p.id));

    if (nextPartner) {
      tx.update('orders', assignment.order_id, { delivery_partner_id: nextPartner.id });
      tx.update('delivery_partners', nextPartner.id, { is_busy: true });

      const newAssignment = tx.insert('delivery_assignments', {
        id: `da_${Date.now()}`,
        order_id: assignment.order_id,
        partner_id: nextPartner.id,
        status: 'ASSIGNED',
        reassignment_count: (assignment.reassignment_count || 0) + 1
      });

      socketHandler.emitDeliveryReassigned(assignment.order_id, dp ? dp.user_id : 'Previous Partner', nextPartner.user_id);
      return { reassigned: true, nextPartnerId: nextPartner.id, newAssignment };
    } else {
      // Unassigned queue
      tx.update('orders', assignment.order_id, { delivery_partner_id: null });
      return { reassigned: false, message: 'No immediate partner available. Order placed in dispatch queue.' };
    }
  });
}

module.exports = {
  createOrder,
  cancelOrder,
  updateOrderStatus,
  rejectDeliveryAssignment
};
