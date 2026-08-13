import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export const CartDrawer = ({ isOpen, onClose, cart, restaurant, onUpdateQty, onClearCart, onOrderSuccess }) => {
  const { showToast } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = +(subtotal * 0.08).toFixed(2);
  const deliveryFee = 40.00;
  const total = +(subtotal + tax + deliveryFee).toFixed(2);

  const handleCheckout = async () => {
    if (!cart.length || !restaurant) return;

    setLoading(true);
    setError(null);

    try {
      const itemsPayload = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity
      }));

      const res = await api.placeOrder({
        restaurantId: restaurant.id,
        items: itemsPayload,
        paymentMethod
      });

      if (res.success) {
        showToast('🎉 Order placed! Your food is being prepared.', 'success');
        onClearCart();
        onClose();
        if (onOrderSuccess) onOrderSuccess(res.data);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Your order could not be placed. Your cart is still safe.');
      showToast(`Couldn't place order. ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        {/* DRAWER HEADER */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
              {restaurant && <p className="text-xs text-orange-600 font-medium">{restaurant.name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CART CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900">Order Notice</div>
                <div className="text-xs mt-1 text-rose-700">{error}</div>
              </div>
            </div>
          )}

          {!cart.length ? (
            /* HUMAN EMPTY STATE */
            <div className="text-center py-20 text-slate-500 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-400" />
              <p className="font-bold text-slate-800">Your cart is waiting</p>
              <p className="text-xs text-slate-500">Find something delicious to add from our top restaurants!</p>
            </div>
          ) : (
            <>
              {/* ITEM LIST */}
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                      </div>
                      <div className="text-xs text-orange-600 font-semibold mt-1">₹{item.price.toFixed(2)}</div>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 px-2">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Option</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'CARD', 'COD'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        paymentMethod === method
                          ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* BILL BREAKDOWN */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Taxes (8%)</span>
                  <span className="font-semibold text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-orange-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DRAWER FOOTER */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-white">
            <button
              disabled={loading}
              onClick={handleCheckout}
              className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Checking Stock & Placing Order...' : (
                <>
                  <span>Continue to checkout • ₹{total.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
