# QuickBite Real-Time Communication Flow

## Socket.IO Room Channels
1. `user_${userId}`: Receives personal order status updates, delivery trip offers, and location updates.
2. `restaurant_${restaurantId}`: Receives incoming kitchen order alerts (`order:created`).
3. `order_${orderId}`: Receives live GPS rider coordinates during active delivery (`delivery:location_updated`).
4. `admin_channel`: System-wide operations stream receiving platform orders and disputes.
