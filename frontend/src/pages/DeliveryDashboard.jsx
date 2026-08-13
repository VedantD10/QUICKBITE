import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bike, MapPin, Store, Phone, ArrowRight, RefreshCw } from 'lucide-react';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [profile, setProfile] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, delRes, earnRes] = await Promise.all([
        api.getDeliveryProfile().catch(() => ({ success: false })),
        api.getAssignedDeliveries().catch(() => ({ success: false })),
        api.getEarnings().catch(() => ({ success: false }))
      ]);
      if (profRes && profRes.success) setProfile(profRes.data);
      if (delRes && delRes.success) setDeliveries(delRes.data || []);
      if (earnRes && earnRes.success) setEarnings(earnRes.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    const newStatus = !profile.is_online;
    try {
      const res = await api.toggleDeliveryStatus(newStatus);
      if (res.success) {
        setProfile(res.data);
        showToast(`✓ You are now ${newStatus ? 'ONLINE' : 'OFFLINE'}`, 'info');
      }
    } catch (err) {
      showToast(`Couldn't update online status. ${err.message}`, 'error');
    }
  };

  const handleAccept = async (assignmentId) => {
    try {
      const res = await api.acceptAssignment(assignmentId);
      if (res.success) {
        showToast('✓ Trip accepted! Drive to restaurant pickup.', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(`Couldn't accept delivery. ${err.message}`, 'error');
    }
  };

  const handleReject = async (assignmentId) => {
    if (!window.confirm('Reject this delivery assignment? System will reassign to the next available partner.')) return;
    try {
      const res = await api.rejectAssignment(assignmentId, 'Rider declined delivery request.');
      if (res.success) {
        showToast('✓ Trip declined. System is reassigning next partner.', 'info');
        fetchData();
      }
    } catch (err) {
      showToast(`Couldn't decline delivery. ${err.message}`, 'error');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const res = await api.updateDeliveryStatus(orderId, status);
      if (res.success) {
        showToast(`✓ Trip state updated to ${status.replace(/_/g, ' ')}`, 'success');
        fetchData();
      }
    } catch (err) {
      showToast(`Couldn't update trip status. ${err.message}`, 'error');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold">Loading Driver Fleet Console...</div>;
  if (!profile) return <div className="text-center py-20 text-slate-500 font-bold">No driver profile associated with this account.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* TASK-ORIENTED DRIVER HEADER */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Good morning, {user?.name?.split(' ')[0] || 'Aarav'} 👋</h1>
          <p className="text-xs text-slate-500 mt-1">{profile.vehicle_type} ({profile.vehicle_number}) • Rating: ★ {profile.rating}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleOnline}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all border ${
              profile.is_online
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
          >
            {profile.is_online ? 'You are ONLINE ● [ Go Offline ]' : 'You are OFFLINE ○ [ Go Online ]'}
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            title="Refresh Fleet Console"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TODAY'S DRIVER SUMMARY */}
      {earnings && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Today's Earnings</div>
            <div className="text-2xl font-black text-emerald-600">₹{earnings.earningsTotal ? earnings.earningsTotal.toFixed(2) : '0.00'}</div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Completed Trips</div>
            <div className="text-2xl font-black text-slate-900">{earnings.totalDeliveries || 0}</div>
          </div>
        </div>
      )}

      {/* CURRENT TRIP TASK QUEUE */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Current Trip Task</h2>

        {!deliveries.length ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
            <Bike className="w-12 h-12 mx-auto text-slate-400" />
            <div className="text-base font-bold text-slate-800">No active delivery assignments right now</div>
            <p className="text-xs text-slate-500">Stay online and active trips will pop up here for 1-click acceptance.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveries.map(del => (
              <div key={del.assignment_id || del.order_id} className="rounded-3xl bg-white border border-slate-200 p-6 space-y-6 shadow-md">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-base font-black text-slate-900">{del.order_number}</span>
                    <div className="text-xs text-orange-600 font-bold">Trip Payout: ₹40.00</div>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">
                    {del.order_status?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* TRIP STEP GUIDE */}
                <div className="space-y-4 text-xs">
                  {/* PICKUP NODE */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-600 font-bold">
                        <Store className="w-4 h-4" />
                        <span>1. PICK UP RESTAURANT</span>
                      </div>
                      <a href={`tel:${del.restaurant?.phone || '+919820011223'}`} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold">
                        <Phone className="w-3.5 h-3.5" /> Call Kitchen
                      </a>
                    </div>
                    <div className="text-sm font-black text-slate-900">{del.restaurant?.name || 'QuickBite Restaurant'}</div>
                    <div className="text-slate-500">{del.restaurant?.address || '12 Park Street'}</div>
                  </div>

                  {/* DROPOFF NODE */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <MapPin className="w-4 h-4" />
                        <span>2. DROPOFF CUSTOMER</span>
                      </div>
                      <a href={`tel:${del.customer?.phone || '+919898912345'}`} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold">
                        <Phone className="w-3.5 h-3.5" /> Call Customer
                      </a>
                    </div>
                    <div className="text-sm font-black text-slate-900">{del.customer?.name || 'Rahul Verma'}</div>
                    <div className="text-slate-500">{del.address?.flat_no || 'Flat 402'}, {del.address?.street || 'Linking Road'}</div>
                  </div>
                </div>

                {/* DOMINANT NEXT ACTION BUTTON */}
                <div className="pt-2">
                  {del.assignment_status === 'ASSIGNED' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAccept(del.assignment_id)}
                        className="py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow hover:bg-emerald-500 flex items-center justify-center gap-2"
                      >
                        <span>Accept Trip 🛵</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(del.assignment_id)}
                        className="py-3.5 rounded-2xl bg-rose-50 text-rose-700 font-bold text-sm border border-rose-200 hover:bg-rose-100"
                      >
                        Decline & Reassign
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(del.order_status) && (
                        <button
                          onClick={() => handleStatusUpdate(del.order_id, 'PICKED_UP')}
                          className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black text-sm shadow hover:bg-orange-500 flex items-center justify-center gap-2"
                        >
                          <span>Confirm Food Picked Up 🛍️</span>
                        </button>
                      )}

                      {del.order_status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleStatusUpdate(del.order_id, 'OUT_FOR_DELIVERY')}
                          className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow flex items-center justify-center gap-2 hover:bg-amber-400"
                        >
                          <span>Start Out for Delivery 🛵</span>
                        </button>
                      )}

                      {del.order_status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleStatusUpdate(del.order_id, 'DELIVERED')}
                          className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow hover:bg-emerald-500 flex items-center justify-center gap-2"
                        >
                          <span>Complete Delivery 🎉</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
