import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ShoppingBag, LogOut, UtensilsCrossed, LogIn, Bell, X, Trash2 } from 'lucide-react';

export const Navbar = ({ cartCount, onOpenCart, onOpenOrders, onOpenAuth }) => {
  const { user, quickLogin, logout } = useAuth();
  const { notifications, clearNotifications } = useSocket();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);

  const handleRoleSwitch = async (roleKey) => {
    setSwitchingRole(roleKey);
    try {
      await quickLogin(roleKey);
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-sm transition-all">
      {/* EVALUATOR QUICK ACCESS TOOLBAR */}
      <div className="bg-amber-50/90 px-4 py-1.5 border-b border-amber-200/60 flex items-center justify-between text-[11px] text-slate-700">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="text-orange-600 font-bold">Evaluator Quick Switch:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {Object.keys(DEMO_USERS).map(roleKey => (
            <button
              type="button"
              key={roleKey}
              disabled={switchingRole !== null}
              onClick={() => handleRoleSwitch(roleKey)}
              className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                user?.role === roleKey
                  ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-slate-700 border-amber-300/80 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {switchingRole === roleKey ? '...' : (
                roleKey === 'CUSTOMER' ? 'Customer' :
                roleKey === 'RESTAURANT' ? 'Restaurant' :
                roleKey === 'DELIVERY' ? 'Rider' : 'Admin'
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Quick<span className="text-orange-600">Bite</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-extrabold tracking-widest text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Neighborhood Kitchens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* NOTIFICATION BELL ICON BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 space-y-3 z-50 animate-scale-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="text-xs font-black text-slate-900">Notifications ({notifications.length})</div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                        title="Clear all notifications"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                    <button type="button" onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {!notifications.length ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">{n.message}</div>
                        <div className="text-[10px] text-slate-400">{n.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user?.role === 'CUSTOMER' && (
            <>
              <button
                type="button"
                onClick={onOpenOrders}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200"
              >
                My Orders
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline text-xs">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <img
                src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuickBite'}
                alt={user.name}
                className="w-9 h-9 rounded-full border-2 border-orange-400 bg-amber-50"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-black text-slate-900">{user.name}</div>
                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
