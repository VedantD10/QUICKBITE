import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { X, Lock, Mail, User, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { api } from '../services/api';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, quickLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('customer@quickbite.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.register({ name, email, password, role });
        if (res.success) {
          await login(email, password);
        }
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (roleKey) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(roleKey);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        {/* MODAL HEADER */}
        <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">{isRegister ? 'Create QuickBite Account' : 'Welcome to QuickBite'}</h3>
              <p className="text-xs text-amber-100">{isRegister ? 'Sign up for instant food ordering' : 'Log in to continue to your dashboard'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DEMO ACCOUNTS QUICK SWITCHER */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">1-Click Demo Evaluator Login:</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DEMO_USERS).map(([roleKey, info]) => (
              <button
                type="button"
                key={roleKey}
                onClick={() => handleDemoSelect(roleKey)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-500 text-left transition-all shadow-sm hover:shadow"
              >
                <div className="text-xs font-black text-slate-900">{roleKey}</div>
                <div className="text-[10px] text-slate-500 truncate">{info.label.split('(')[1]?.replace(')', '') || info.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AUTH FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              ✕ {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Verma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@quickbite.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="CUSTOMER">Customer (Order Food)</option>
                <option value="RESTAURANT">Restaurant Owner (KDS & Menu)</option>
                <option value="DELIVERY">Delivery Partner (Rider App)</option>
                <option value="ADMIN">Platform Admin (Operations Console)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Log In Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
