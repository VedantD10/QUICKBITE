import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Store, Clock, Plus, CheckCircle, Flame, BarChart3, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';

export const RestaurantDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Menu Item Form state
  const [newItemModal, setNewItemModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Chef Specials');
  const [itemStock, setItemStock] = useState('30');
  const [itemVeg, setItemVeg] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const restRes = await api.getMyRestaurant().catch(() => ({ success: false }));
      if (restRes.success && restRes.data) {
        const list = restRes.restaurants && restRes.restaurants.length ? restRes.restaurants : [restRes.data];
        setRestaurantsList(list);
        setRestaurant(list[0]);
        await loadRestaurantDetails(list[0].id);
      }
    } catch (err) {
      console.error('Restaurant dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantDetails = async (targetRestId) => {
    try {
      const [ordersRes, analyticsRes, menuRes] = await Promise.all([
        api.getRestaurantOrders(`?restaurant_id=${targetRestId}`).catch(() => ({ success: false })),
        api.getRestaurantAnalytics(`?restaurant_id=${targetRestId}`).catch(() => ({ success: false })),
        api.getRestaurantMenu(targetRestId).catch(() => ({ success: false }))
      ]);
      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data || {});
      if (menuRes.success) setMenu(menuRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchRestaurant = (targetRestId) => {
    const target = restaurantsList.find(r => r.id === targetRestId);
    if (target) {
      setRestaurant(target);
      loadRestaurantDetails(target.id);
    }
  };

  const handleToggleStatus = async (newStatus) => {
    if (!restaurant) return;
    try {
      const res = await api.toggleRestaurantStatus(restaurant.id, newStatus);
      if (res.success) {
        setRestaurant(res.data);
        showToast(`✓ Kitchen availability set to ${newStatus}`, 'success');
      }
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus, 'Status updated by kitchen owner');
      if (res.success) {
        showToast(`✓ Order status set to ${newStatus.replace(/_/g, ' ')}`, 'success');
        if (restaurant) loadRestaurantDetails(restaurant.id);
      }
    } catch (err) {
      showToast(`Error updating order: ${err.message}`, 'error');
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) {
      showToast('Item name and price are required', 'warning');
      return;
    }

    try {
      const res = await api.addMenuItem({
        restaurant_id: restaurant.id,
        name: itemName,
        price: parseFloat(itemPrice),
        category_name: itemCategory,
        stock_quantity: parseInt(itemStock || 30),
        is_veg: itemVeg,
        description: 'Prepared fresh in kitchen with spices.'
      });

      if (res.success) {
        showToast('✓ New dish added to kitchen menu!', 'success');
        setNewItemModal(false);
        setItemName('');
        setItemPrice('');
        if (restaurant) loadRestaurantDetails(restaurant.id);
      }
    } catch (err) {
      showToast(`Error adding dish: ${err.message}`, 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      const res = await api.deleteMenuItem(itemId);
      if (res.success) {
        showToast('✓ Dish removed from menu', 'info');
        if (restaurant) loadRestaurantDetails(restaurant.id);
      }
    } catch (err) {
      showToast(`Error deleting dish: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-500 font-bold">Loading Kitchen Operations Workspace...</div>;
  }

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <Store className="w-12 h-12 mx-auto text-orange-500" />
        <h2 className="text-xl font-black text-slate-900">No Kitchen Profile Associated</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">Please contact QuickBite admin or submit a new kitchen profile registration request.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* HEADER & KITCHEN STATUS CONTROL */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src={restaurant.image_url} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-100" />
          <div>
            <div className="flex items-center gap-3">
              {restaurantsList.length > 1 ? (
                <div className="relative">
                  <select
                    value={restaurant.id}
                    onChange={(e) => handleSwitchRestaurant(e.target.value)}
                    className="text-xl font-black text-slate-900 bg-orange-50 border border-orange-300 rounded-2xl px-3 py-1 pr-8 focus:outline-none cursor-pointer"
                  >
                    {restaurantsList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <h1 className="text-2xl font-black text-slate-900">{restaurant.name}</h1>
              )}
              <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                restaurant.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                {restaurant.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{restaurant.tagline}</p>
          </div>
        </div>

        {/* AVAILABILITY TOGGLES */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleStatus(restaurant.status === 'OPEN' ? 'TEMPORARILY_UNAVAILABLE' : 'OPEN')}
            className={`px-4.5 py-2.5 rounded-2xl font-extrabold text-xs shadow transition-all ${
              restaurant.status === 'OPEN' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {restaurant.status === 'OPEN' ? 'Pause Kitchen Orders ⏸' : 'Open Kitchen for Orders ⚡'}
          </button>

          <button
            onClick={() => loadRestaurantDetails(restaurant.id)}
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            title="Refresh Kitchen Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {[
            { key: 'orders', label: '📦 Active Orders', count: orders.filter(o => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)).length },
            { key: 'menu', label: '🍽️ Menu & Stock Management', count: null },
            { key: 'analytics', label: '📊 Kitchen Analytics', count: null }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'menu' && (
          <button
            onClick={() => setNewItemModal(true)}
            className="px-4 py-2 rounded-2xl bg-orange-600 text-white font-extrabold text-xs hover:bg-orange-500 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        )}
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {!orders.length ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-400" />
              <div className="text-base font-bold text-slate-800">No Orders in Kitchen Queue</div>
              <p className="text-xs text-slate-500">New customer orders will appear here automatically in real-time.</p>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-base">Order #{o.order_number}</span>
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(o.placed_at).toLocaleTimeString()}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-700">Customer: {o.customer_name} ({o.address?.city || 'Mumbai'})</div>
                    <div className="text-xs text-slate-500">
                      {o.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </div>
                  </div>

                  <div className="text-sm font-black text-slate-900">Total: ₹{o.total_amount?.toFixed(2)}</div>
                </div>

                {/* KITCHEN ACTION BUTTONS */}
                <div className="flex flex-wrap md:flex-col justify-end gap-2 shrink-0">
                  {o.status === 'PLACED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'RESTAURANT_ACCEPTED')}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow hover:bg-emerald-500"
                    >
                      Accept Order 🍳
                    </button>
                  )}
                  {o.status === 'RESTAURANT_ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'PREPARING')}
                      className="px-4 py-2 rounded-2xl bg-orange-600 text-white font-extrabold text-xs shadow hover:bg-orange-500"
                    >
                      Start Cooking 🍽️
                    </button>
                  )}
                  {o.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'READY_FOR_PICKUP')}
                      className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow hover:bg-indigo-500"
                    >
                      Mark Packed 📦
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {menu.map(cat => (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-orange-600 border-b border-slate-200 pb-2">{cat.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items?.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-sm text-slate-900">{item.name}</div>
                      <div className="text-xs text-orange-600 font-bold mt-0.5">₹{item.price?.toFixed(2)} • Stock: {item.stock_quantity}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</div>
            <div className="text-3xl font-black text-emerald-600">₹{analytics.totalRevenue?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</div>
            <div className="text-3xl font-black text-orange-600">{analytics.totalOrders || 0}</div>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Order Value</div>
            <div className="text-3xl font-black text-slate-900">₹{analytics.averageOrderValue?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      )}

      {/* ADD NEW DISH MODAL */}
      {newItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add New Dish</h3>
              <button onClick={() => setNewItemModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Dish Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full mt-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="250"
                    className="w-full mt-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Stock Qty</label>
                  <input
                    type="number"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    placeholder="30"
                    className="w-full mt-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-orange-600 text-white font-black text-xs hover:bg-orange-500 shadow-md"
              >
                Add Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
