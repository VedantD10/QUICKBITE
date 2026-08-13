const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('qb_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({ success: false, message: 'Server communication error' }));

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Customer
  getRestaurants: (params = '') => request(`/restaurants${params}`),
  getRestaurantById: (id) => request(`/restaurants/${id}`),
  getRestaurantMenu: (id) => request(`/restaurants/${id}/menu`),
  getAddresses: () => request('/customer/addresses'),
  addAddress: (addressData) => request('/customer/addresses', { method: 'POST', body: JSON.stringify(addressData) }),
  placeOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrders: () => request('/orders'),
  clearOrderHistory: () => request('/orders/clear', { method: 'DELETE' }),
  getOrderById: (id) => request(`/orders/${id}`),
  cancelOrder: (id, reason) => request(`/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  rateOrder: (ratingData) => request('/ratings', { method: 'POST', body: JSON.stringify(ratingData) }),

  // Restaurant Owner
  getMyRestaurant: () => request('/restaurant/profile'),
  toggleRestaurantStatus: (id, status) => request(`/restaurants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addMenuItem: (itemData) => request('/menu/items', { method: 'POST', body: JSON.stringify(itemData) }),
  updateMenuItem: (id, itemData) => request(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(itemData) }),
  deleteMenuItem: (id) => request(`/menu/items/${id}`, { method: 'DELETE' }),
  getRestaurantOrders: (params = '') => request(`/restaurant/orders${params}`),
  updateOrderStatus: (id, status, notes) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  getRestaurantAnalytics: (params = '') => request(`/restaurant/analytics${params}`),

  // Delivery Partner
  getDeliveryProfile: () => request('/delivery/profile'),
  toggleDeliveryStatus: (is_online) => request('/delivery/status', { method: 'PATCH', body: JSON.stringify({ is_online }) }),
  getAssignedDeliveries: () => request('/deliveries/assigned'),
  acceptAssignment: (orderId) => request('/deliveries/accept', { method: 'POST', body: JSON.stringify({ orderId }) }),
  rejectAssignment: (orderId, reason) => request('/deliveries/reject', { method: 'POST', body: JSON.stringify({ orderId, reason }) }),
  updateDeliveryStatus: (orderId, status) => request(`/deliveries/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateDeliveryLocation: (locationData) => request('/delivery/location', { method: 'PATCH', body: JSON.stringify(locationData) }),
  getEarnings: () => request('/delivery/earnings'),

  // Admin
  getPendingRestaurants: () => request('/admin/restaurants/pending'),
  approveRestaurant: (id) => request(`/admin/restaurants/${id}/approve`, { method: 'PATCH' }),
  rejectRestaurant: (id, reason) => request(`/admin/restaurants/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getUsers: (params = '') => request(`/admin/users${params}`),
  suspendUser: (id, reason) => request(`/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getPlatformOrders: () => request('/admin/orders'),
  getComplaints: () => request('/admin/complaints'),
  resolveComplaint: (id, resolution) => request(`/admin/complaints/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution }) }),
  getAdminAnalytics: () => request('/admin/analytics')
};
