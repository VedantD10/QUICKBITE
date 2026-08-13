import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { X, Bike, RefreshCw, ShoppingBag, Trash2, Star } from 'lucide-react';
import { RatingModal } from './RatingModal';

export const CustomerOrdersModal = ({ isOpen, onClose, onTrackOrder }) => {
  const { showToast } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your order history?')) return;
    setClearing(true);
    try {
      const res = await api.clearOrderHistory();
      if (res.success) {
        setOrders([]);
        showToast('✓ Order history cleared successfully', 'success');
      }
    } catch (err) {
      showToast(`Error clearing history: ${err.message}`, 'error');
    } finally {
      setClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto animate-scale-in">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
                🛍️
              </div>
              <div>
                <h3 className="text-xl font-black">My Order History</h3>
                <p className="text-xs text-amber-100">Track active orders & view past food deliveries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {orders.length > 0 && (
                <button
                  disabled={clearing}
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-white font-bold text-xs border border-rose-300/40 flex items-center gap-1.5 transition-all"
                  title="Clear order history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearing ? 'Clearing...' : 'Clear History'}</span>
                </button>
              )}
              <button onClick={fetchOrders} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CONTENT BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="text-center py-16 text-slate-500 font-bold">Loading your orders...</div>
            ) : !orders.length ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-400" />
                <div className="text-base font-black text-slate-800">Your order history is clean</div>
                <p className="text-xs text-slate-500">Order something delicious from our top neighborhood kitchens!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const isActive = !['COMPLETED', 'CANCELLED', 'RESTAURANT_REJECTED', 'DELIVERED'].includes(order.status);
                  const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';

                  return (
                    <div key={order.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 space-y-3 shadow-sm transition-all">
                      <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-base">{order.restaurant_name}</span>
                            <span className="text-xs text-slate-500 font-semibold">({order.order_number})</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{new Date(order.placed_at).toLocaleString()}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${
                          isActive ? 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse' :
                          isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">{order.items ? order.items.length : 1} item(s)</span>
                          <span className="text-slate-500 ml-2">• Paid via {order.payment_method || 'UPI'}</span>
                        </div>
                        <div className="text-sm font-black text-orange-600">₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        {isActive && (
                          <button
                            onClick={() => { onClose(); onTrackOrder(order); }}
                            className="px-4 py-2 rounded-xl bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-500 flex items-center gap-1.5"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Track Live 🛵</span>
                          </button>
                        )}
                        {isDelivered && (
                          <button
                            onClick={() => setSelectedOrderForRating(order)}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md hover:bg-amber-400 flex items-center gap-1.5"
                          >
                            <Star className="w-4 h-4 fill-current" />
                            <span>Rate Experience ⭐</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <RatingModal
        isOpen={Boolean(selectedOrderForRating)}
        onClose={() => setSelectedOrderForRating(null)}
        order={selectedOrderForRating}
        onRatingSubmitted={() => fetchOrders()}
      />
    </>
  );
};
