let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO [id=${socket.id}]`);

    // Join authenticated room
    socket.on('join:room', (data) => {
      const { room } = data;
      if (room) {
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Customer / Driver live location stream
    socket.on('delivery:location_update', (data) => {
      const { orderId, customerId, lat, lng, speed, etaMinutes } = data;
      if (orderId) {
        const payload = {
          orderId,
          lat,
          lng,
          speed: speed || 28,
          etaMinutes: etaMinutes || 12,
          timestamp: new Date().toISOString()
        };
        io.to(`order_${orderId}`).emit('delivery:location_updated', payload);
        if (customerId) {
          io.to(`user_${customerId}`).emit('delivery:location_updated', payload);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from Socket.IO [id=${socket.id}]`);
    });
  });
}

function getIO() {
  return ioInstance;
}

// Helper methods to emit real-time events to targeted rooms
function emitOrderCreated(order, restaurantId) {
  if (!ioInstance) return;
  ioInstance.to(`restaurant_${restaurantId}`).emit('order:created', order);
  ioInstance.to('admin_channel').emit('order:created', order);
}

function emitOrderStatusChanged(order) {
  if (!ioInstance) return;
  const payload = {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    updatedAt: new Date().toISOString()
  };

  ioInstance.to(`user_${order.customer_id}`).emit('order:status_updated', payload);
  ioInstance.to(`order_${order.id}`).emit('order:status_updated', payload);
  ioInstance.to(`restaurant_${order.restaurant_id}`).emit('order:status_updated', payload);
  ioInstance.to('admin_channel').emit('order:status_updated', payload);
}

function emitDeliveryAssigned(assignment, partnerUserId) {
  if (!ioInstance) return;
  ioInstance.to(`user_${partnerUserId}`).emit('delivery:assigned', assignment);
  ioInstance.to('admin_channel').emit('delivery:assigned', assignment);
}

function emitDeliveryReassigned(orderId, oldPartnerName, newPartnerUserId) {
  if (!ioInstance) return;
  ioInstance.to(`user_${newPartnerUserId}`).emit('delivery:assigned', { orderId });
  ioInstance.to('admin_channel').emit('delivery:reassigned', {
    orderId,
    message: `Delivery reassigned from ${oldPartnerName} to next available partner.`
  });
}

function emitRestaurantStatusChanged(restaurantId, status) {
  if (!ioInstance) return;
  ioInstance.emit('restaurant:status_changed', { restaurantId, status });
}

function emitMenuItemUpdated(restaurantId, item) {
  if (!ioInstance) return;
  ioInstance.emit('menu:item_updated', { restaurantId, item });
}

function emitDriverLocationUpdate(customerId, locationData) {
  if (!ioInstance) return;
  ioInstance.to(`user_${customerId}`).emit('delivery:location_updated', locationData);
}

module.exports = {
  initSocket,
  getIO,
  emitOrderCreated,
  emitOrderStatusChanged,
  emitDeliveryAssigned,
  emitDeliveryReassigned,
  emitRestaurantStatusChanged,
  emitMenuItemUpdated,
  emitDriverLocationUpdate
};
