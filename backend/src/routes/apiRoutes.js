const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const restaurantController = require('../controllers/restaurantController');
const deliveryController = require('../controllers/deliveryController');
const adminController = require('../controllers/adminController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// ==========================================
// 2. CUSTOMER & DISCOVERY ROUTES
// ==========================================
router.get('/restaurants', customerController.getRestaurants);
router.get('/restaurants/:id', customerController.getRestaurantById);
router.get('/restaurants/:id/menu', customerController.getRestaurantMenu);

router.get('/customer/addresses', authenticateToken, requireRole('CUSTOMER'), customerController.getAddresses);
router.post('/customer/addresses', authenticateToken, requireRole('CUSTOMER'), customerController.addAddress);

router.post('/orders', authenticateToken, requireRole('CUSTOMER'), customerController.placeOrder);
router.get('/orders', authenticateToken, customerController.getOrders);
router.delete('/orders/clear', authenticateToken, customerController.clearOrderHistory);
router.get('/orders/:id', authenticateToken, customerController.getOrderById);
router.patch('/orders/:id/cancel', authenticateToken, requireRole('CUSTOMER', 'ADMIN'), customerController.cancelOrder);
router.post('/ratings', authenticateToken, requireRole('CUSTOMER'), customerController.rateOrder);

// ==========================================
// 3. RESTAURANT OWNER ROUTES
// ==========================================
router.get('/restaurant/profile', authenticateToken, requireRole('RESTAURANT'), restaurantController.getMyRestaurant);
router.post('/restaurants', authenticateToken, requireRole('RESTAURANT'), restaurantController.registerRestaurant);
router.patch('/restaurants/:id/status', authenticateToken, requireRole('RESTAURANT', 'ADMIN'), restaurantController.toggleStatus);

router.post('/menu/items', authenticateToken, requireRole('RESTAURANT'), restaurantController.addMenuItem);
router.patch('/menu/items/:id', authenticateToken, requireRole('RESTAURANT'), restaurantController.updateMenuItem);
router.delete('/menu/items/:id', authenticateToken, requireRole('RESTAURANT'), restaurantController.deleteMenuItem);

router.get('/restaurant/orders', authenticateToken, requireRole('RESTAURANT'), restaurantController.getRestaurantOrders);
router.patch('/orders/:id/status', authenticateToken, requireRole('RESTAURANT', 'DELIVERY', 'ADMIN'), restaurantController.updateOrderStatus);
router.get('/restaurant/analytics', authenticateToken, requireRole('RESTAURANT'), restaurantController.getAnalytics);

// ==========================================
// 4. DELIVERY PARTNER ROUTES
// ==========================================
router.get('/delivery/profile', authenticateToken, requireRole('DELIVERY'), deliveryController.getMyProfile);
router.get('/deliveries/assigned', authenticateToken, requireRole('DELIVERY'), deliveryController.getAssignedDeliveries);
router.post('/deliveries/accept', authenticateToken, requireRole('DELIVERY'), deliveryController.acceptAssignment);
router.post('/deliveries/reject', authenticateToken, requireRole('DELIVERY'), deliveryController.rejectAssignment);
router.patch('/deliveries/:orderId/status', authenticateToken, requireRole('DELIVERY'), deliveryController.updateDeliveryStatus);
router.patch('/delivery/location', authenticateToken, requireRole('DELIVERY', 'ADMIN'), deliveryController.updateLocation);
router.patch('/delivery/status', authenticateToken, requireRole('DELIVERY'), deliveryController.toggleDriverStatus);
router.get('/delivery/earnings', authenticateToken, requireRole('DELIVERY'), deliveryController.getEarnings);

// ==========================================
// 5. PLATFORM ADMIN ROUTES
// ==========================================
router.get('/admin/restaurants/pending', authenticateToken, requireRole('ADMIN'), adminController.getPendingRestaurants);
router.patch('/admin/restaurants/:id/approve', authenticateToken, requireRole('ADMIN'), adminController.approveRestaurant);
router.patch('/admin/restaurants/:id/reject', authenticateToken, requireRole('ADMIN'), adminController.rejectRestaurant);

router.get('/admin/users', authenticateToken, requireRole('ADMIN'), adminController.getUsers);
router.patch('/admin/users/:id/suspend', authenticateToken, requireRole('ADMIN'), adminController.suspendUser);

router.get('/admin/orders', authenticateToken, requireRole('ADMIN'), adminController.getPlatformOrders);
router.get('/admin/complaints', authenticateToken, requireRole('ADMIN'), adminController.getComplaints);
router.patch('/admin/complaints/:id/resolve', authenticateToken, requireRole('ADMIN'), adminController.resolveComplaint);
router.get('/admin/analytics', authenticateToken, requireRole('ADMIN'), adminController.getPlatformAnalytics);

module.exports = router;
