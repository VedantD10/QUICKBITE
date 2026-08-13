import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { HeroFoodBackground } from './HeroFoodBackground';
import { Flame, Sparkles, ArrowRight, Star } from 'lucide-react';

export const LandingHero = ({ onOpenAuth }) => {
  const { quickLogin } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleQuickLogin = async (roleKey) => {
    setLoadingRole(roleKey);
    setErrorMsg(null);
    try {
      await quickLogin(roleKey);
    } catch (err) {
      console.error('Quick login error:', err);
      setErrorMsg(err.message || 'Login failed. Please verify backend server is running.');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden text-white animate-fade-in">
      {/* CINEMATIC ANIMATED FOOD BACKGROUND SLIDESHOW */}
      <HeroFoodBackground />

      {/* HERO CONTENT CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* HERO LEFT COLUMN - ZOMATO STYLE TYPOGRAPHY */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/30 border border-orange-500/50 backdrop-blur-md text-orange-300 text-xs font-black uppercase tracking-widest animate-bounce">
              <Flame className="w-4 h-4 text-orange-400 fill-current" />
              <span>India's #1 Food Delivery Platform 🇮🇳</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Quick<span className="text-orange-500">Bite</span>
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-amber-200 mt-2">
                Discover the best food & drinks near you
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 font-medium max-w-xl leading-relaxed">
              Order Amritsari Chole Bhature, Hyderabadi Biryani, Butter Chicken, Dosas & Sweets from 25+ top kitchens with live GPS tracking.
            </p>

            {/* ZOMATO STYLE VALUE BADGES */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white flex items-center gap-1.5">
                <span>⚡</span> 20 min Fast Delivery
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> 4.9 Foodie Rating
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-emerald-300 flex items-center gap-1.5">
                <span>🌿</span> 100% Fresh Daily
              </span>
            </div>

            {/* CTAS */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white font-black text-base shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all flex items-center gap-3 border border-orange-400"
              >
                <span>Browse Menu & Order Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CUSTOMER')}
                className="px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white font-extrabold text-sm shadow transition-all"
              >
                👋 Quick Customer Demo
              </button>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - GLASSMORPHISM DEMO LOGIN CARD */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-white/20 backdrop-blur-xl rounded-3xl p-7 shadow-2xl space-y-5 animate-scale-in relative z-30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Evaluator 1-Click Login</h3>
                <p className="text-xs text-slate-300">Test QuickBite live as any stakeholder</p>
              </div>
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
                ✕ {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(DEMO_USERS).map(([roleKey, info]) => (
                <button
                  type="button"
                  key={roleKey}
                  disabled={loadingRole !== null}
                  onClick={() => handleQuickLogin(roleKey)}
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/15 hover:border-orange-400 hover:bg-orange-500/20 text-left transition-all group flex items-center justify-between shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-black text-white group-hover:text-orange-300 transition-colors">
                      {info.label}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">{info.email}</div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-200 group-hover:text-orange-400 group-hover:border-orange-400 shadow-sm text-xs font-bold">
                    {loadingRole === roleKey ? '...' : '→'}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-white/10">
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs font-bold text-orange-400 hover:underline"
              >
                Or Sign Up with your own custom account →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
