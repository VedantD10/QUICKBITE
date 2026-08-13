import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { LandingHero } from './components/LandingHero';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './services/api';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      fetchLatestOrder();
    }
  }, [user]);

  const fetchLatestOrder = async () => {
    try {
      const res = await api.getOrders();
      if (res.success && res.data.length > 0) {
        const latest = res.data[0];
        if (!['COMPLETED', 'CANCELLED', 'RESTAURANT_REJECTED'].includes(latest.status)) {
          setActiveOrder(latest);
        } else {
          setActiveOrder(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrackOrder = (order) => {
    const targetOrder = order || activeOrder;
    if (targetOrder) {
      setTrackedOrder(targetOrder);
      setIsTrackerOpen(true);
    }
  };

  const handleAddToCart = (item, restaurant) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      if (!window.confirm(`Your cart contains items from '${cartRestaurant.name}'. Clear cart to order from '${restaurant.name}'?`)) {
        return;
      }
      setCart([]);
    }

    setCartRestaurant(restaurant);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setCartRestaurant(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex items-center justify-center font-bold text-sm">
        Initializing QuickBite Platform Workspace...
      </div>
    );
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="pb-16">
        {!user && (
          <div className="space-y-12">
            <LandingHero onOpenAuth={() => setIsAuthOpen(true)} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <CustomerDashboard
                onAddToCart={handleAddToCart}
                activeOrder={null}
                cartCount={cartCount}
                cartTotal={cartTotal}
                onOpenCart={() => setIsCartOpen(true)}
                onTrackOrder={handleTrackOrder}
              />
            </div>
          </div>
        )}

        {user?.role === 'CUSTOMER' && (
          <CustomerDashboard
            onAddToCart={handleAddToCart}
            activeOrder={activeOrder}
            cartCount={cartCount}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartOpen(true)}
            onTrackOrder={handleTrackOrder}
          />
        )}

        {user?.role === 'RESTAURANT' && <RestaurantDashboard />}

        {user?.role === 'DELIVERY' && <DeliveryDashboard />}

        {user?.role === 'ADMIN' && <AdminDashboard />}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        restaurant={cartRestaurant}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
        onOrderSuccess={(order) => {
          setActiveOrder(order);
          setTrackedOrder(order);
          setIsTrackerOpen(true);
          fetchLatestOrder();
        }}
      />

      <CustomerOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onTrackOrder={handleTrackOrder}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        order={trackedOrder || activeOrder}
        onRefreshOrder={fetchLatestOrder}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
