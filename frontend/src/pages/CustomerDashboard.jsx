import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Star, Clock, Utensils, ShoppingBag } from 'lucide-react';
import { HeroFoodBackground } from '../components/HeroFoodBackground';

export const CustomerDashboard = ({ onAddToCart, activeOrder, cartCount, cartTotal, onOpenCart, onTrackOrder }) => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);

  const cuisines = [
    { label: 'All', emoji: '🍽️' },
    { label: 'Biryani', emoji: '🍛' },
    { label: 'North Indian', emoji: '🍗' },
    { label: 'South Indian', emoji: '🔴' },
    { label: 'Street Food & Chaat', emoji: '🥪' },
    { label: 'Mughlai', emoji: '🍢' },
    { label: 'Chinese & Momos', emoji: '🥟' },
    { label: 'Sweets & Desserts', emoji: '🍰' }
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [search, selectedCuisine]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (selectedCuisine !== 'All') {
        query += `&cuisine=${encodeURIComponent(selectedCuisine)}`;
      }
      const res = await api.getRestaurants(query);
      if (res.success) {
        setRestaurants(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestaurant = async (rest) => {
    setSelectedRestaurant(rest);
    setMenu([]);
    setMenuLoading(true);
    try {
      const res = await api.getRestaurantMenu(rest.id);
      if (res.success) {
        setMenu(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* CINEMATIC ZOMATO STYLE CUSTOMER HERO BANNER */}
      <div className="relative min-h-[320px] sm:min-h-[380px] bg-slate-950 text-white overflow-hidden flex items-center justify-center p-6 shadow-xl">
        <HeroFoodBackground />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-600/30 border border-orange-500/50 backdrop-blur-md text-orange-300 text-xs font-black uppercase tracking-widest">
            🇮🇳 India's Favorite Food Delivery Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Craving Great Food, {user?.name?.split(' ')[0] || 'Rahul'}? 🍕🍛
          </h1>

          <p className="text-sm sm:text-base text-slate-200 font-medium max-w-xl mx-auto">
            Order Dum Biryanis, Butter Chicken, Dosas & Chaat from 25+ top regional kitchens.
          </p>

          {/* SEARCH BAR - ZOMATO HERO STYLE */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <Search className="absolute left-5 top-[58%] -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for biryani, butter chicken, dosas, sweets..."
              className="w-full pl-13 pr-4 py-4 rounded-2xl bg-white text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 shadow-2xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ACTIVE ORDER BANNER */}
        {activeOrder && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border border-orange-400 flex items-center justify-between shadow-xl shadow-orange-500/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black text-xl shadow-sm">
                🛵
              </div>
              <div>
                <div className="text-xs text-amber-100 font-bold uppercase tracking-wider">Order in Progress</div>
                <div className="text-base font-black text-white">Order #{activeOrder.order_number} • {activeOrder.status.replace(/_/g, ' ')}</div>
              </div>
            </div>
            <button
              onClick={() => onTrackOrder(activeOrder)}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-md hover:bg-slate-800 transition-all hover:scale-105"
            >
              Track Order Live 🛵
            </button>
          </div>
        )}

        {/* CUISINE CHIPS */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {cuisines.map(c => (
            <button
              key={c.label}
              onClick={() => setSelectedCuisine(c.label)}
              className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCuisine === c.label
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 shadow-sm'
              }`}
            >
              <span className="text-sm">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* POPULAR NEAR YOU SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Neighborhood Kitchens</span>
              <span className="text-sm text-slate-500 font-semibold">({restaurants.length})</span>
            </h2>
          </div>

          {loading ? (
            /* SKELETON LOADERS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="rounded-3xl bg-white border border-slate-200 h-64 p-4 space-y-4 shadow-sm">
                  <div className="w-full h-36 skeleton-loading rounded-2xl" />
                  <div className="w-3/4 h-4 skeleton-loading rounded" />
                  <div className="w-1/2 h-3 skeleton-loading rounded" />
                </div>
              ))}
            </div>
          ) : !restaurants.length ? (
            /* HUMAN EMPTY STATE */
            <div className="text-center py-16 text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <Utensils className="w-12 h-12 mx-auto text-slate-400" />
              <p className="font-extrabold text-slate-800 text-lg">No kitchens match your search</p>
              <p className="text-xs text-slate-500">Try another cuisine category or clear your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map(r => (
                <div
                  key={r.id}
                  onClick={() => handleOpenRestaurant(r)}
                  className="group rounded-3xl bg-white border border-slate-200 hover:border-orange-500/50 overflow-hidden shadow-sm card-hover cursor-pointer flex flex-col transition-all"
                >
                  {/* RESTAURANT IMAGE & RATING BADGE */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-amber-600 font-black text-xs flex items-center gap-1 border border-slate-200 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{r.rating} ({r.rating_count})</span>
                    </div>
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-xl font-black text-[10px] tracking-wide uppercase border ${
                      r.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {r.status === 'TEMPORARILY_UNAVAILABLE' ? 'Taking a Break' : r.status}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">{r.name}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">{r.tagline}</p>
                      <div className="text-xs text-orange-600 font-bold mt-2">
                        {Array.isArray(r.cuisine_types) ? r.cuisine_types.join(' • ') : r.cuisine_types}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>{r.avg_prep_time_mins} mins prep</span>
                      </div>
                      <div className="text-slate-800 font-bold">Min Order: ₹{r.min_order_amount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESTAURANT DETAIL MODAL WITH VIEWPORT FIXED POSITIONING */}
      {selectedRestaurant && (
        <div
          onClick={() => setSelectedRestaurant(null)}
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-in"
          >
            {/* HERO BANNER */}
            <div className="relative h-52 bg-slate-900 shrink-0">
              <img src={selectedRestaurant.banner_url || selectedRestaurant.image_url} alt={selectedRestaurant.name} className="w-full h-full object-cover opacity-80" />
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-900/80 text-white hover:bg-slate-900 transition-all z-10"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedRestaurant.name}</h2>
                  <p className="text-xs text-slate-200 font-medium mt-0.5">{selectedRestaurant.address}, {selectedRestaurant.city}</p>
                </div>
                <div className={`px-3 py-1 rounded-xl text-xs font-black border ${
                  selectedRestaurant.status === 'OPEN' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                }`}>
                  {selectedRestaurant.status === 'TEMPORARILY_UNAVAILABLE' ? 'Taking a Break' : selectedRestaurant.status}
                </div>
              </div>
            </div>

            {/* MENU DISHES BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {menuLoading ? (
                /* MENU SKELETON LOADERS */
                <div className="space-y-4">
                  <div className="w-32 h-4 skeleton-loading rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 h-28 skeleton-loading" />
                    ))}
                  </div>
                </div>
              ) : !menu.length ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Utensils className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-800">No dishes listed for this kitchen yet</p>
                  <p className="text-xs text-slate-500">Please check back soon!</p>
                </div>
              ) : (
                menu.map(cat => (
                  <div key={cat.id} className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 border-b border-slate-200 pb-1">{cat.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cat.items.map(item => (
                        <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3 justify-between shadow-sm hover:border-orange-300 transition-all">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                item.is_veg ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              </span>
                              <h4 className="font-black text-sm text-slate-900">{item.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2">{item.description}</p>
                            <div className="text-sm font-black text-orange-600 pt-1">₹{item.price.toFixed(2)}</div>
                            {item.stock_quantity <= 5 && item.stock_quantity > 0 && (
                              <div className="text-[10px] font-black text-amber-600">Only {item.stock_quantity} left in kitchen!</div>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-between">
                            <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-200 shadow-sm" />
                            <button
                              disabled={!item.is_available || item.stock_quantity <= 0 || selectedRestaurant.status !== 'OPEN'}
                              onClick={() => onAddToCart(item, selectedRestaurant)}
                              className="mt-2 px-3.5 py-1.5 rounded-xl bg-orange-600 text-white font-extrabold text-xs hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 transition-all hover:scale-105"
                            >
                              {!item.is_available || item.stock_quantity <= 0 ? 'Out of Stock' : 'Add +'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART PILL BUTTON FOR EASY ACCESS */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            onClick={onOpenCart}
            className="px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-sm shadow-2xl flex items-center gap-3 hover:scale-105 transition-all border border-orange-400"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
            <span>View Cart ({cartCount} item{cartCount > 1 ? 's' : ''})</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-black">₹{cartTotal ? cartTotal.toFixed(2) : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};
