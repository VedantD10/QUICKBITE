const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Pre-computed bcrypt hash for 'password123' (10 salt rounds) for instant synchronous zero-overhead seeding
const DEFAULT_PASSWORD_HASH = '$2b$10$P2JIdOPWi6wsWma2QBtIfODRX5ttd66.qOL0acJJEY7Xrt4reHTr2';

function seed() {
  console.log('🇮🇳 Seeding QuickBite with authentic Indian Restaurants, Dishes, Users & Locations...');

  // Reset database arrays
  db.data = {
    users: [],
    restaurants: [],
    menu_categories: [],
    menu_items: [],
    addresses: [],
    delivery_partners: [],
    orders: [],
    order_items: [],
    delivery_assignments: [],
    order_status_history: [],
    ratings: [],
    complaints: [],
    audit_logs: []
  };

  const defaultPasswordHash = DEFAULT_PASSWORD_HASH;

  // 1. CREATE DEMO USERS WITH AUTHENTIC INDIAN NAMES
  const demoUsers = [
    {
      id: 'usr_admin_01',
      name: 'Rajesh Kumar (Platform Admin)',
      email: 'admin@quickbite.com',
      phone: '+91 98765 43210',
      password_hash: defaultPasswordHash,
      role: 'ADMIN',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_owner_01',
      name: 'Chef Sanjeev Kapoor',
      email: 'owner@quickbite.com',
      phone: '+91 98200 11223',
      password_hash: defaultPasswordHash,
      role: 'RESTAURANT',
      avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_owner_02',
      name: 'Priya Sharma (Punjab Dhaba)',
      email: 'priya@spicecraft.com',
      phone: '+91 98111 22334',
      password_hash: defaultPasswordHash,
      role: 'RESTAURANT',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_delivery_01',
      name: 'Aarav Patel (Rider)',
      email: 'delivery@quickbite.com',
      phone: '+91 97654 32109',
      password_hash: defaultPasswordHash,
      role: 'DELIVERY',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_delivery_02',
      name: 'Vikram Singh (Rider)',
      email: 'vikram@quickbite.com',
      phone: '+91 97111 44556',
      password_hash: defaultPasswordHash,
      role: 'DELIVERY',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_customer_01',
      name: 'Rahul Verma',
      email: 'customer@quickbite.com',
      phone: '+91 91234 56789',
      password_hash: defaultPasswordHash,
      role: 'CUSTOMER',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_customer_02',
      name: 'Ananya Roy',
      email: 'ananya@gmail.com',
      phone: '+91 99887 76655',
      password_hash: defaultPasswordHash,
      role: 'CUSTOMER',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    }
  ];

  demoUsers.forEach(u => db.insert('users', u));

  // 2. CREATE DELIVERY PARTNER PROFILES
  db.insert('delivery_partners', {
    id: 'dp_01',
    user_id: 'usr_delivery_01',
    vehicle_type: 'BIKE',
    vehicle_number: 'MH-02-BK-4091',
    license_number: 'DL-9920194881',
    is_online: true,
    is_busy: false,
    current_lat: 19.0760,
    current_lng: 72.8777,
    total_deliveries: 420,
    rating: 4.94,
    earnings_total: 18450.00
  });

  db.insert('delivery_partners', {
    id: 'dp_02',
    user_id: 'usr_delivery_02',
    vehicle_type: 'SCOOTER',
    vehicle_number: 'KA-01-SC-8812',
    license_number: 'DL-8827361902',
    is_online: true,
    is_busy: false,
    current_lat: 19.0800,
    current_lng: 72.8800,
    total_deliveries: 280,
    rating: 4.88,
    earnings_total: 12200.00
  });

  // 3. CREATE DEMO CUSTOMER ADDRESSES
  db.insert('addresses', {
    id: 'addr_01',
    customer_id: 'usr_customer_01',
    label: 'Home',
    street: 'Flat 402, Sunshine Heights, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip_code: '400050',
    lat: 19.0596,
    lng: 72.8295,
    is_default: true
  });

  // 4. CREATE 25 AUTHENTIC INDIAN RESTAURANTS
  const restaurantTemplates = [
    { id: 'rest_01', name: 'Royal Hyderabadi Biryani House', city: 'Mumbai', cuisines: ['Biryani', 'Mughlai', 'Hyderabadi'], rating: 4.9, prepTime: 25, priceForTwo: 450, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_02', name: 'Amritsari Dhaba & Kulcha Junction', city: 'Delhi NCR', cuisines: ['North Indian', 'Punjabi', 'Street Food & Chaat'], rating: 4.8, prepTime: 20, priceForTwo: 350, ownerId: 'usr_owner_02', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_03', name: 'Madras Tiffin Center & Dosa Express', city: 'Bangalore', cuisines: ['South Indian', 'Street Food & Chaat'], rating: 4.9, prepTime: 15, priceForTwo: 250, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_04', name: 'Purani Dilli Kebabs & Mughlai Handi', city: 'Delhi NCR', cuisines: ['Mughlai', 'North Indian', 'Biryani'], rating: 4.8, prepTime: 30, priceForTwo: 550, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_05', name: 'Saffron Great Punjab Restaurant', city: 'Chandigarh', cuisines: ['North Indian', 'Punjabi'], rating: 4.7, prepTime: 25, priceForTwo: 500, ownerId: 'usr_owner_02', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_06', name: 'Calcutta Kathi Rolls & Street Beats', city: 'Kolkata', cuisines: ['Street Food & Chaat', 'Bengali'], rating: 4.8, prepTime: 15, priceForTwo: 200, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_07', name: 'Banyan Tree South Tiffin Room', city: 'Chennai', cuisines: ['South Indian'], rating: 4.9, prepTime: 18, priceForTwo: 300, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_08', name: 'Dragon Wok Chinese & Dumpling Bar', city: 'Mumbai', cuisines: ['Chinese & Momos'], rating: 4.6, prepTime: 22, priceForTwo: 400, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_09', name: 'Haldiram Sweets & Mithai Bhavan', city: 'Jaipur', cuisines: ['Sweets & Desserts', 'Street Food & Chaat'], rating: 4.9, prepTime: 10, priceForTwo: 250, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_10', name: 'Lucknowi Dum Pukht Awadhi Rasoi', city: 'Lucknow', cuisines: ['Biryani', 'Mughlai'], rating: 4.9, prepTime: 35, priceForTwo: 600, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_11', name: 'Kashmir Valley Wazwan & Rogan Josh', city: 'Srinagar', cuisines: ['North Indian', 'Mughlai'], rating: 4.8, prepTime: 30, priceForTwo: 700, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_12', name: 'Chowpatty Chaat Corner & Pav Bhaji', city: 'Mumbai', cuisines: ['Street Food & Chaat'], rating: 4.7, prepTime: 12, priceForTwo: 180, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_13', name: 'Naga Spice Hut & Himalayan Momos', city: 'Guwahati', cuisines: ['Chinese & Momos'], rating: 4.8, prepTime: 20, priceForTwo: 320, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_14', name: 'Gujarat Thali Rasoi & Farsan', city: 'Ahmedabad', cuisines: ['North Indian', 'Sweets & Desserts'], rating: 4.9, prepTime: 20, priceForTwo: 350, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_15', name: 'Goan Shack Seafood & Fish Curry', city: 'Panaji', cuisines: ['South Indian', 'Street Food & Chaat'], rating: 4.7, prepTime: 25, priceForTwo: 650, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_16', name: 'Indore Sarafa Bazaar Night Street Treats', city: 'Indore', cuisines: ['Street Food & Chaat', 'Sweets & Desserts'], rating: 4.9, prepTime: 15, priceForTwo: 220, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_17', name: 'Malabar Coastal Spice House', city: 'Kochi', cuisines: ['South Indian'], rating: 4.8, prepTime: 25, priceForTwo: 480, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_18', name: 'Rajasthani Royal Ghoomar Thali', city: 'Udaipur', cuisines: ['North Indian', 'Sweets & Desserts'], rating: 4.9, prepTime: 25, priceForTwo: 500, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_19', name: 'Tibetan Monastery Momo House', city: 'Dharamshala', cuisines: ['Chinese & Momos'], rating: 4.8, prepTime: 15, priceForTwo: 240, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_20', name: 'Benares Ghat Kachori & Rabri Bhandar', city: 'Varanasi', cuisines: ['Street Food & Chaat', 'Sweets & Desserts'], rating: 4.9, prepTime: 10, priceForTwo: 160, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_21', name: 'Chettinad Spicy Claypot Kitchen', city: 'Madurai', cuisines: ['South Indian'], rating: 4.8, prepTime: 22, priceForTwo: 380, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_22', name: 'Agra Petha & Bedmi Puri Bhavan', city: 'Agra', cuisines: ['Street Food & Chaat', 'Sweets & Desserts'], rating: 4.7, prepTime: 12, priceForTwo: 200, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_23', name: 'Old Delhi Karim Kebab House', city: 'Delhi NCR', cuisines: ['Mughlai', 'Biryani'], rating: 4.9, prepTime: 28, priceForTwo: 550, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_24', name: 'Kolhapur Mutton Rassa & Tandoor', city: 'Kolhapur', cuisines: ['North Indian', 'Punjabi'], rating: 4.8, prepTime: 25, priceForTwo: 420, ownerId: 'usr_owner_02', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
    { id: 'rest_25', name: 'Darjeeling Tea & Bakery House', city: 'Darjeeling', cuisines: ['Sweets & Desserts', 'Chinese & Momos'], rating: 4.9, prepTime: 15, priceForTwo: 300, ownerId: 'usr_owner_01', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' }
  ];

  restaurantTemplates.forEach(t => {
    db.insert('restaurants', {
      id: t.id,
      name: t.name,
      owner_id: t.ownerId,
      description: `Famous for authentic ${t.cuisines.join(', ')} recipes prepared with pure desi ghee and hand-ground spices.`,
      phone: '+91 98000 11122',
      email: `${t.id}@quickbite.com`,
      street: `Shop ${Math.floor(Math.random() * 50 + 1)}, Main Food Street`,
      city: t.city,
      state: 'India',
      zip_code: '400001',
      lat: 19.0760 + (Math.random() - 0.5) * 0.05,
      lng: 72.8777 + (Math.random() - 0.5) * 0.05,
      cuisine_types: t.cuisines,
      is_approved: true,
      status: 'OPEN',
      rating: t.rating,
      review_count: Math.floor(Math.random() * 500 + 100),
      avg_prep_time_minutes: t.prepTime,
      price_for_two: t.priceForTwo,
      banner_image_url: t.image
    });
  });

  // 5. CREATE AUTHENTIC DISH CATEGORIES & MENU ITEMS
  const dishTemplates = [
    { name: 'Special Hyderabadi Mutton Dum Biryani', price: 349, veg: false, restId: 'rest_01' },
    { name: 'Chicken Dum Biryani (Clay Handi)', price: 299, veg: false, restId: 'rest_01' },
    { name: 'Paneer Tikka Dum Biryani', price: 269, veg: true, restId: 'rest_01' },
    { name: 'Mirchi Ka Salan & Raita', price: 99, veg: true, restId: 'rest_01' },
    { name: 'Amritsari Chole Bhature (2 Pcs)', price: 160, veg: true, restId: 'rest_02' },
    { name: 'Butter Amritsari Stuffed Kulcha', price: 120, veg: true, restId: 'rest_02' },
    { name: 'Dal Makhani (Desi Ghee)', price: 220, veg: true, restId: 'rest_02' },
    { name: 'Masala Butter Milk (Chaas)', price: 40, veg: true, restId: 'rest_02' },
    { name: 'Crispy Butter Masala Dosa', price: 130, veg: true, restId: 'rest_03' },
    { name: 'Steamed Mysore Rava Idli (4 Pcs)', price: 90, veg: true, restId: 'rest_03' },
    { name: 'Medu Vada with Coconut Chutney', price: 80, veg: true, restId: 'rest_03' },
    { name: 'Filter Coffee (Pure Peery)', price: 45, veg: true, restId: 'rest_03' },
    { name: 'Mutton Seekh Kebab (Purani Dilli)', price: 320, veg: false, restId: 'rest_04' },
    { name: 'Old Delhi Galouti Kebab', price: 340, veg: false, restId: 'rest_04' },
    { name: 'Tandoori Chicken (Full)', price: 450, veg: false, restId: 'rest_04' },
    { name: 'Butter Chicken (Grand Punjab Recipe)', price: 360, veg: false, restId: 'rest_05' },
    { name: 'Paneer Butter Masala', price: 280, veg: true, restId: 'rest_05' },
    { name: 'Garlic Butter Naan (2 Pcs)', price: 70, veg: true, restId: 'rest_05' },
    { name: 'Kolkata Double Egg Chicken Roll', price: 140, veg: false, restId: 'rest_06' },
    { name: 'Paneer Kathi Roll', price: 120, veg: true, restId: 'rest_06' },
    { name: 'Ghee Podi Masala Dosa', price: 150, veg: true, restId: 'rest_07' },
    { name: 'Schezwan Chicken Fried Rice', price: 210, veg: false, restId: 'rest_08' },
    { name: 'Steamed Chicken Momos (8 Pcs)', price: 160, veg: false, restId: 'rest_08' },
    { name: 'Gulab Jamun (Pure Desi Ghee 2 Pcs)', price: 80, veg: true, restId: 'rest_09' },
    { name: 'Kesar Rasgulla (2 Pcs)', price: 75, veg: true, restId: 'rest_09' },
    { name: 'Awadhi Mutton Biryani', price: 380, veg: false, restId: 'rest_10' }
  ];

  restaurantTemplates.forEach(rest => {
    const cat1 = db.insert('menu_categories', {
      id: `cat_${rest.id}_01`,
      restaurant_id: rest.id,
      name: 'Chef Specials & Bestsellers',
      sort_order: 1
    });

    const cat2 = db.insert('menu_categories', {
      id: `cat_${rest.id}_02`,
      restaurant_id: rest.id,
      name: 'Breads & Accompaniments',
      sort_order: 2
    });

    const restDishes = dishTemplates.filter(d => d.restId === rest.id);
    const itemsToSeed = restDishes.length > 0 ? restDishes : [
      { name: `${rest.name} Signature Dish`, price: 249, veg: true, restId: rest.id },
      { name: `Special Thali Combo`, price: 299, veg: true, restId: rest.id },
      { name: `Desi Ghee Sweet Delicacy`, price: 120, veg: true, restId: rest.id },
      { name: `Refreshing Regional Beverage`, price: 60, veg: true, restId: rest.id }
    ];

    itemsToSeed.forEach((item, iIdx) => {
      db.insert('menu_items', {
        id: `item_${rest.id}_${iIdx + 1}`,
        restaurant_id: rest.id,
        category_id: iIdx % 2 === 0 ? cat1.id : cat2.id,
        name: item.name,
        description: `Authentic regional recipe prepared with pure ingredients and hand-ground spices.`,
        price: item.price,
        is_veg: item.veg,
        is_spicy: false,
        is_available: true,
        stock_quantity: 50,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'
      });
    });
  });

  console.log(`✅ QuickBite Indian database seeding completed successfully!`);
  console.log(`Summary: ${demoUsers.length} Indian Users, ${restaurantTemplates.length} Restaurants, ${db.find('menu_items', () => true).length} Dishes.`);
}

module.exports = seed;
