import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export const RatingModal = ({ isOpen, onClose, order, onRatingSubmitted }) => {
  const { showToast } = useSocket();
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.rateOrder({
        order_id: order.id,
        restaurant_rating: restaurantRating,
        delivery_rating: deliveryRating,
        review_text: reviewText
      });
      if (res.success) {
        showToast('🌟 Thank you for your review & feedback!', 'success');
        if (onRatingSubmitted) onRatingSubmitted(res.data);
        onClose();
      }
    } catch (err) {
      showToast(`Error submitting review: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl my-auto animate-scale-in">
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 fill-current text-amber-300" />
            <h3 className="text-lg font-black text-white">Rate Your Food & Delivery</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* RESTAURANT RATING */}
          <div className="space-y-2 text-center">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              How was the food from {order.restaurant_name || 'Kitchen'}?
            </label>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRestaurantRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-8 h-8 ${
                    star <= restaurantRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* DELIVERY RIDER RATING */}
          <div className="space-y-2 text-center border-t border-slate-100 pt-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              How was your rider's delivery speed & service?
            </label>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setDeliveryRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-8 h-8 ${
                    star <= deliveryRating ? 'fill-orange-500 text-orange-500' : 'text-slate-300'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* REVIEW TEXTAREA */}
          <div className="space-y-1.5 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-700">Share your thoughts & feedback (Optional)</label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us how delicious your food was..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs shadow-lg hover:scale-105 transition-all disabled:opacity-40"
          >
            {submitting ? 'Submitting Feedback...' : 'Submit Rating & Feedback 🌟'}
          </button>
        </form>
      </div>
    </div>
  );
};
