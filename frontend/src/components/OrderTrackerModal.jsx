import React, { useState, useEffect } from 'react';
import { X, MapPin, Bike, Store, ShieldAlert, Star, Sparkles, Navigation, Compass } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

const STATE_PIPELINE = [
  { key: 'PLACED', label: 'Order Placed ✓', message: 'Your order has been submitted to the restaurant.', progress: 5 },
  { key: 'RESTAURANT_ACCEPTED', label: 'Accepted 🍳', message: 'Restaurant accepted your order.', progress: 18 },
  { key: 'PREPARING', label: 'Preparing 🍽️', message: 'Chef is currently preparing your food.', progress: 32 },
  { key: 'READY_FOR_PICKUP', label: 'Packed 📦', message: 'Your food is packed and ready for pickup.', progress: 48 },
  { key: 'DELIVERY_ASSIGNED', label: 'Rider Assigned 🛵', message: 'Rider is arriving at restaurant.', progress: 62 },
  { key: 'PICKED_UP', label: 'Picked Up 🛍️', message: 'Rider collected your fresh meal.', progress: 78 },
  { key: 'OUT_FOR_DELIVERY', label: 'On The Way 🛵', message: 'Your rider is heading to your dropoff address!', progress: 90 },
  { key: 'DELIVERED', label: 'Delivered 😋', message: 'Delivered! Enjoy your meal.', progress: 100 }
];

export const OrderTrackerModal = ({ isOpen, onClose, order: initialOrder, onRefreshOrder, onOpenRating }) => {
  const { socket, showToast } = useSocket();
  const [currentOrder, setCurrentOrder] = useState(initialOrder);
  const [cancelling, setCancelling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isGpsSimulating, setIsGpsSimulating] = useState(false);

  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  const currentStepIndex = STATE_PIPELINE.findIndex(s => s.key === currentOrder?.status);
  const safeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 0;
  const currentStep = STATE_PIPELINE[safeStepIdx];

  const isCancelled = currentOrder?.status === 'CANCELLED' || currentOrder?.status === 'RESTAURANT_REJECTED';
  const isDelivered = currentOrder?.status === 'DELIVERED' || currentOrder?.status === 'COMPLETED';
  const canCancel = ['PLACED', 'RESTAURANT_ACCEPTED'].includes(currentOrder?.status);

  // DERIVE EXACT SYNCHRONIZED GPS PROGRESS & COORDINATES DIRECTLY FROM STATUS
  const riderProgress = currentStep.progress;
  const riderLat = +(19.0760 - (riderProgress / 100) * (19.0760 - 19.0596)).toFixed(4);
  const riderLng = +(72.8777 - (riderProgress / 100) * (72.8777 - 72.8295)).toFixed(4);
  const distanceRemaining = +((1 - riderProgress / 100) * 3.2).toFixed(1);
  const speedKm = isDelivered ? 0 : riderProgress > 50 ? 34 : 22;

  // LIVE AUTO-POLLING WHILE TRACKER IS OPEN
  useEffect(() => {
    if (!isOpen || !currentOrder?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getOrderById(currentOrder.id);
        if (res.success && res.data) {
          setCurrentOrder(res.data);
        }
      } catch (err) {
        // Silent background sync
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, currentOrder?.id]);

  // LISTEN FOR LIVE RIDER GPS LOCATION SOCKET EVENTS
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleLocationUpdate = (data) => {
      if (data && data.orderId === currentOrder?.id && data.status) {
        setCurrentOrder(prev => prev ? { ...prev, status: data.status } : prev);
      }
    };

    socket.on('delivery:location_updated', handleLocationUpdate);
    return () => socket.off('delivery:location_updated', handleLocationUpdate);
  }, [socket, isOpen, currentOrder?.id]);

  // SYNCHRONIZED REALISTIC RIDE SIMULATOR LOOP
  useEffect(() => {
    if (!isOpen || !isGpsSimulating || isDelivered || isCancelled) return;

    const interval = setInterval(async () => {
      const nextIdx = currentStepIndex + 1;
      if (nextIdx >= STATE_PIPELINE.length) {
        setIsGpsSimulating(false);
        return;
      }

      const nextStatus = STATE_PIPELINE[nextIdx].key;
      try {
        const res = await api.updateOrderStatus(currentOrder.id, nextStatus, 'Live synchronized ride simulation');
        if (res.success) {
          setCurrentOrder(prev => ({ ...prev, status: nextStatus }));
          if (onRefreshOrder) onRefreshOrder();
          if (nextStatus === 'DELIVERED') {
            setIsGpsSimulating(false);
            showToast('🎉 Order delivered successfully!', 'success');
          }
        }
      } catch (err) {
        setIsGpsSimulating(false);
      }
    }, 3000); // Smooth 3-second step progression

    return () => clearInterval(interval);
  }, [isOpen, isGpsSimulating, currentStepIndex, currentOrder?.id, isDelivered, isCancelled, onRefreshOrder, showToast]);

  if (!isOpen || !currentOrder) return null;

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await api.cancelOrder(currentOrder.id, 'Customer requested cancellation from tracker.');
      if (res.success) {
        showToast('✓ Order cancelled successfully', 'info');
        setCurrentOrder(prev => ({ ...prev, status: 'CANCELLED' }));
        if (onRefreshOrder) onRefreshOrder();
      }
    } catch (err) {
      showToast(`Couldn't cancel order. ${err.message}`, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleAdvanceStep = async () => {
    if (isDelivered || isCancelled) return;
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= STATE_PIPELINE.length) return;

    const nextStatus = STATE_PIPELINE[nextIdx].key;
    setSimulating(true);
    try {
      const res = await api.updateOrderStatus(currentOrder.id, nextStatus, 'Manual step advance simulation');
      if (res.success) {
        setCurrentOrder(prev => ({ ...prev, status: nextStatus }));
        showToast(`⚡ Order status & GPS advanced to: ${STATE_PIPELINE[nextIdx].label}`, 'success');
        if (onRefreshOrder) onRefreshOrder();
      } else {
        showToast(res.message || 'Status update failed', 'warning');
      }
    } catch (err) {
      showToast(`Simulation error: ${err.message}`, 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl my-auto animate-scale-in">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Live Order & GPS Tracker</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
                {currentOrder.order_number}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">Placed at {new Date(currentOrder.placed_at).toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGpsSimulating(!isGpsSimulating)}
              disabled={isDelivered || isCancelled}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs shadow flex items-center gap-1.5 transition-all disabled:opacity-40 ${
                isGpsSimulating ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Toggle synchronized live order progression & rider map ride"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isGpsSimulating ? 'Auto-Advancing 🛵' : 'Simulate GPS Ride'}</span>
            </button>

            <button
              onClick={handleAdvanceStep}
              disabled={simulating || isDelivered || isCancelled}
              title="Advance status & rider pin by 1 step"
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{simulating ? 'Updating...' : 'Advance Step ⚡'}</span>
            </button>

            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATE MACHINE PIPELINE TRACKER */}
        <div className="p-6 space-y-6">
          {isCancelled ? (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 mx-auto text-rose-600" />
              <h4 className="text-base font-bold text-rose-900">Order Cancelled</h4>
              <p className="text-xs text-rose-700">{currentOrder.cancellation_reason || 'This order was cancelled.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-orange-700 font-bold uppercase tracking-wider">Current Status</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{currentStep.message}</div>
                </div>
                <span className="text-sm font-black text-orange-600">
                  {isDelivered ? 'Delivered! 😋' : distanceRemaining > 0 ? `~ ${Math.ceil(distanceRemaining * 3)} mins` : 'Arrived!'}
                </span>
              </div>

              {/* PROGRESS PIPELINE BAR */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-2">
                {STATE_PIPELINE.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isCompleted = idx < currentStepIndex || isDelivered;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5 text-center">
                      <div className={`w-full h-2.5 rounded-full transition-all ${
                        isCompleted ? 'bg-emerald-500' :
                        isActive ? 'bg-orange-600 animate-pulse shadow-sm shadow-orange-500/50' : 'bg-slate-200'
                      }`} />
                      <span className={`text-[9.5px] font-bold leading-tight ${
                        isActive ? 'text-orange-600 font-extrabold' :
                        isCompleted ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANIMATED GPS DELIVERY TRACKER MAP SIMULATION */}
          <div className="space-y-2">
            <div className="relative h-48 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ff5e14_1px,transparent_1px)] [background-size:18px_18px]" />
              
              {/* GPS HUD COORD OVERLAY */}
              <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-bold text-slate-400 z-10">
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-md">
                  <Compass className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span>GPS: {riderLat}° N, {riderLng}° E</span>
                </div>
                <div className="bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-md text-emerald-400">
                  ⚡ {speedKm} km/h • {isDelivered ? '0.0' : distanceRemaining} km remaining
                </div>
              </div>

              {/* ROUTE LINE & RIDER PIN */}
              <div className="relative z-10 w-full px-10 flex items-center justify-between text-white mt-4">
                {/* RESTAURANT NODE */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-orange-500/80 flex items-center justify-center text-orange-400 shadow-xl">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 truncate max-w-[100px]">{currentOrder.restaurant_name}</span>
                </div>

                {/* RIDER MOVING ROUTE LINE */}
                <div className="flex-1 px-4 relative flex items-center">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700"
                      style={{ width: `${isDelivered ? 100 : riderProgress}%` }}
                    />
                  </div>
                  
                  {/* MOVING RIDER ICON */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 text-orange-500 transition-all duration-700 ease-out"
                    style={{ left: `${isDelivered ? 92 : Math.min(88, Math.max(5, riderProgress))}%` }}
                  >
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xl ring-4 ring-orange-500/20 animate-bounce flex items-center justify-center">
                      <Bike className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* CUSTOMER DESTINATION NODE */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 flex items-center justify-center text-emerald-400 shadow-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">Your Address</span>
                </div>
              </div>
            </div>
          </div>

          {/* DELIVERY RIDER CARD */}
          {currentOrder.delivery_partner && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentOrder.delivery_partner.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{currentOrder.delivery_partner.phone || '+91 98201 12345'}</span>
                    <span>•</span>
                    <span className="flex items-center text-amber-600 font-bold">★ 4.9</span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${currentOrder.delivery_partner.phone || '+919820112345'}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-500"
              >
                Call Rider
              </a>
            </div>
          )}

          {/* ACTIONS & CANCELLATION CONTROL */}
          <div className="pt-2 flex items-center justify-between">
            {canCancel ? (
              <button
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order (Allowed)'}
              </button>
            ) : !isCancelled && !isDelivered ? (
              <div className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Cancellation locked: Kitchen has started preparing (REQ-04)</span>
              </div>
            ) : isDelivered ? (
              <button
                onClick={() => onOpenRating && onOpenRating(currentOrder)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow flex items-center gap-2"
              >
                <Star className="w-4 h-4 fill-current" />
                <span>Rate Experience</span>
              </button>
            ) : null}

            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 border border-slate-200">
              Close Tracker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
