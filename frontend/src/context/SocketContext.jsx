import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Bell, X, CheckCircle, ShieldAlert } from 'lucide-react';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const showToast = (message, type = 'info') => {
    if (!message || message.includes("Couldn't load")) return;

    const newNotif = { id: Date.now(), message, type, time: new Date().toLocaleTimeString() };
    setToast(newNotif);
    setNotifications(prev => [newNotif, ...prev.slice(0, 15)]);

    setTimeout(() => {
      setToast(prev => prev && prev.id === newNotif.id ? null : prev);
    }, 4000);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setToast(null);
  };

  useEffect(() => {
    let newSocket;
    try {
      newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        if (user) {
          newSocket.emit('join:room', { room: `user_${user.id}` });
          if (user.role === 'ADMIN') {
            newSocket.emit('join:room', { room: 'admin_channel' });
          }
        }
      });

      newSocket.on('order:created', (data) => {
        showToast(`🔔 New Order #${data.order_number || data.id} received!`, 'success');
      });

      newSocket.on('order:status_updated', (data) => {
        showToast(`📦 Order #${data.orderNumber || data.orderId} is now ${data.status.replace(/_/g, ' ')}`, 'info');
      });

      newSocket.on('delivery:assigned', () => {
        showToast(`🛵 New Delivery Trip Assignment available!`, 'success');
      });
    } catch (err) {
      console.warn('Socket.IO connection silent fallback:', err.message);
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, toast, notifications, showToast, clearNotifications }}>
      {children}
      {/* BEAUTIFUL FLOATING TOP-RIGHT GLASSMORPHISM TOAST POPUP */}
      {toast && (
        <div className="fixed top-20 right-6 z-[200] max-w-sm animate-scale-in">
          <div className="p-4 rounded-3xl bg-slate-900/90 text-white backdrop-blur-xl border border-white/20 shadow-2xl flex items-start gap-3">
            <div className={`p-2 rounded-2xl shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              toast.type === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               toast.type === 'error' ? <ShieldAlert className="w-5 h-5" /> :
               <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1 space-y-0.5 pt-0.5">
              <div className="text-xs font-black text-white">{toast.message}</div>
              <div className="text-[10px] text-slate-400 font-bold">{toast.time}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
