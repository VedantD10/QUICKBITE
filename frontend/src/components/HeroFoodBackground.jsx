import React, { useState, useEffect } from 'react';

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1920&q=80',
    title: 'Amritsari Chole Bhature & Lassi'
  },
  {
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1920&q=80',
    title: 'Royal Hyderabadi Dum Biryani'
  },
  {
    url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=1920&q=80',
    title: 'Butter Chicken & Garlic Naan'
  },
  {
    url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1920&q=80',
    title: 'Crispy Masala Dosa & Sambhar'
  },
  {
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1920&q=80',
    title: 'Authentic Indian Sweets & Desserts'
  }
];

export const HeroFoodBackground = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {HERO_IMAGES.map((img, idx) => (
        <div
          key={img.url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIdx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
          }`}
          style={{ transition: 'opacity 1.2s ease-in-out, transform 6s ease-out' }}
        >
          <img
            src={img.url}
            alt={img.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* CINEMATIC ZOMATO DARK GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90 backdrop-blur-[1px]" />
    </div>
  );
};
