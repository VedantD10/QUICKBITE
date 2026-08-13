import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { RefreshCw, Trash2, ShieldAlert, CheckCircle, Store, Users, ShoppingBag, AlertTriangle, BarChart2 } from 'lucide-react';

export const AdminDashboard = () => {
  const { showToast } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // User search & filters
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [userRoleFilter, userSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [anRes, restRes, userRes, cmpRes, ordRes] = await Promise.all([
        api.getAdminAnalytics().catch(() => ({ success: false })),
        api.getPendingRestaurants().catch(() => ({ success: false })),
        api.getUsers(`?role=${userRoleFilter}&search=${userSearch}`).catch(() => ({ success: false })),
        api.getComplaints().catch(() => ({ success: false })),
        api.getPlatformOrders().catch(() => ({ success: false }))
      ]);
      if (anRes && anRes.success) setAnalytics(anRes.data);
      if (restRes && restRes.success) setPendingRestaurants(restRes.data);
      if (userRes && userRes.success) setUsers(userRes.data);
      if (cmpRes && cmpRes.success) setComplaints(cmpRes.data);
      if (ordRes && ordRes.success) setOrders(ordRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRestaurant = async (id) => {
    try {
      const res = await api.approveRestaurant(id);
      if (res.success) {
        showToast('✓ Restaurant approved for live ordering!', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(`Couldn't approve restaurant. ${err.message}`, 'error');
    }
  };

  const handleSuspendUser = async (userId, currentSuspended) => {
    const actionText = currentSuspended ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionText} this user account?`)) return;
    try {
      const res = await api.suspendUser(userId, 'Administrative action');
      if (res.success) {
        showToast(`✓ User account status updated`, 'info');
        fetchData();
      }
    } catch (err) {
      showToast(`Couldn't update user status. ${err.message}`, 'error');
    }
  };

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to clear ALL platform order history?')) return;
    setClearing(true);
    try {
      const res = await api.clearOrderHistory();
      if (res.success) {
        setOrders([]);
        showToast('✓ Platform order history reset cleanly', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(`Error resetting orders: ${err.message}`, 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Operations & Governance</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">QuickBite Platform Management & Partner Verification Desk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={clearing}
            onClick={handleClearAllOrders}
            className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'Clearing...' : 'Clear All Orders 🗑️'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all"
            title="Refresh Platform Console"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ADMIN WORKSPACE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'overview', label: '📊 Overview', count: null },
          { key: 'restaurants', label: '🏪 Restaurant Approvals', count: pendingRestaurants.length },
          { key: 'users', label: '👥 User Accounts', count: users.length },
          { key: 'orders', label: '📦 Orders Desk', count: orders.length },
          { key: 'complaints', label: '⚠️ Complaints & Care', count: complaints.length }
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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-bold">Loading Platform Governance Console...</div>
      ) : (
        <div className="space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Platform Revenue</div>
                <div className="text-3xl font-black text-emerald-600">₹{analytics.totalPlatformRevenue?.toFixed(2) || '0.00'}</div>
                <div className="text-[11px] text-slate-400 font-medium">10% Platform Commission Collected</div>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</div>
                <div className="text-3xl font-black text-orange-600">{analytics.totalOrders || 0}</div>
                <div className="text-[11px] text-slate-400 font-medium">Across all regional cities</div>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Kitchens</div>
                <div className="text-3xl font-black text-slate-900">{analytics.approvedRestaurants || 0}</div>
                <div className="text-[11px] text-slate-400 font-medium">{pendingRestaurants.length} pending review</div>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Customers & Drivers</div>
                <div className="text-3xl font-black text-indigo-600">{users.length || 0}</div>
                <div className="text-[11px] text-slate-400 font-medium">Registered accounts</div>
              </div>
            </div>
          )}

          {/* RESTAURANT APPROVALS TAB */}
          {activeTab === 'restaurants' && (
            <div className="space-y-4">
              {!pendingRestaurants.length ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
                  <div className="text-base font-bold text-slate-800">All Kitchen Profiles Reviewed</div>
                  <p className="text-xs text-slate-500">No pending restaurant registration requests.</p>
                </div>
              ) : (
                pendingRestaurants.map(r => (
                  <div key={r.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-lg">{r.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{r.tagline}</p>
                      <div className="text-xs text-slate-400">{r.address}, {r.city} • Phone: {r.phone}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRestaurant(r.id)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow hover:bg-emerald-500 transition-all"
                      >
                        Approve Kitchen ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="RESTAURANT">Restaurant Owner</option>
                  <option value="DELIVERY">Delivery Partner</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100" />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email} • {u.role}</div>
                      </div>
                    </div>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleSuspendUser(u.id, u.is_suspended)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          u.is_suspended ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {u.is_suspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS DESK TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {!orders.length ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-400" />
                  <div className="text-base font-bold text-slate-800">No Orders in System</div>
                  <p className="text-xs text-slate-500">The platform order queue is clean.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-slate-900">{o.restaurant_name} • Order #{o.order_number}</div>
                        <div className="text-slate-500 mt-0.5">{new Date(o.placed_at).toLocaleString()} • Amount: ₹{o.total_amount}</div>
                      </div>
                      <span className="px-3 py-1 rounded-xl font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
