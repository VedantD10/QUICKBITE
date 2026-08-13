const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
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

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

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
      phone: '+91 99887 76655',
      password_hash: defaultPasswordHash,
      role: 'DELIVERY',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_delivery_02',
      name: 'Vikram Singh (Rider)',
      email: 'vikram.rider@quickbite.com',
      phone: '+91 97766 55443',
      password_hash: defaultPasswordHash,
      role: 'DELIVERY',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_customer_01',
      name: 'Rahul Verma',
      email: 'customer@quickbite.com',
      phone: '+91 98989 12345',
      password_hash: defaultPasswordHash,
      role: 'CUSTOMER',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    },
    {
      id: 'usr_customer_02',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@gmail.com',
      phone: '+91 98450 99887',
      password_hash: defaultPasswordHash,
      role: 'CUSTOMER',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      is_active: true,
      is_suspended: false
    }
  ];

  demoUsers.forEach(u => db.insert('users', u));

  // 2. CREATE DELIVERY PARTNERS WITH INDIAN VEHICLES
  const deliveryPartners = [
    {
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
    },
    {
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
    }
  ];

  deliveryPartners.forEach(dp => db.insert('delivery_partners', dp));

  // 3. CREATE INDIAN ADDRESSES
  const addresses = [
    {
      id: 'addr_01',
      user_id: 'usr_customer_01',
      label: 'Home',
      flat_no: 'Flat 402, Shivam Heights',
      street: 'Linking Road, Bandra West',
      landmark: 'Near Turner Road Junction',
      city: 'Mumbai',
      pincode: '400050',
      lat: 19.0600,
      lng: 72.8300,
      is_default: true
    },
    {
      id: 'addr_02',
      user_id: 'usr_customer_01',
      label: 'Office',
      flat_no: 'Unit 901, Cyber One Tower',
      street: 'BKC Bandra Kurla Complex',
      landmark: 'Opposite NSE Building',
      city: 'Mumbai',
      pincode: '400051',
      lat: 19.0650,
      lng: 72.8680,
      is_default: false
    }
  ];

  addresses.forEach(a => db.insert('addresses', a));

  // 4. CREATE 25+ AUTHENTIC INDIAN RESTAURANTS
  const restaurantTemplates = [
    {
      id: 'rest_01',
      owner_id: 'usr_owner_01',
      name: 'Royal Hyderabadi Biryani House',
      tagline: 'Authentic Dum Biryani, Mughlai Korma & Soft Rumali Roti',
      description: 'Slow-cooked in sealed clay handis with long-grain basmati rice, pure desi ghee, and saffron.',
      cuisine_types: ['Biryani', 'Mughlai', 'North Indian'],
      address: '12 Park Street, Colaba',
      city: 'Mumbai',
      pincode: '400005',
      lat: 18.9220,
      lng: 72.8330,
      phone: '+91 98200 99881',
      rating: 4.92,
      rating_count: 1240,
      avg_prep_time_mins: 25,
      min_order_amount: 199.00,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80',
      status: 'OPEN',
      is_approved: true,
      opening_time: '11:00',
      closing_time: '23:30'
    },
    {
      id: 'rest_02',
      owner_id: 'usr_owner_02',
      name: 'Punjab Da Pind Dhaba',
      tagline: 'Rich Butter Chicken, Amritsari Kulcha & Dal Makhani',
      description: 'Traditional Punjabi dhaba flavors made with handmade white butter, clay tandoor roties, and charcoal smoking.',
      cuisine_types: ['North Indian', 'Punjabi', 'Mughlai'],
      address: '45 Connaught Place, Inner Circle',
      city: 'New Delhi',
      pincode: '110001',
      lat: 28.6315,
      lng: 77.2167,
      phone: '+91 98111 88772',
      rating: 4.88,
      rating_count: 980,
      avg_prep_time_mins: 20,
      min_order_amount: 149.00,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
      status: 'OPEN',
      is_approved: true,
      opening_time: '12:00',
      closing_time: '23:00'
    },
    {
      id: 'rest_03',
      owner_id: 'usr_owner_01',
      name: 'Malgudi South Indian Tiffin Room',
      tagline: 'Crispy Butter Masala Dosa, Ghee Podi Idli & Filter Coffee',
      description: 'Authentic South Indian breakfast items prepared with fermented rice-lentil batter and fresh coconut chutney.',
      cuisine_types: ['South Indian', 'Breakfast'],
      address: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      lat: 12.9716,
      lng: 77.6412,
      phone: '+91 98450 11223',
      rating: 4.85,
      rating_count: 1540,
      avg_prep_time_mins: 15,
      min_order_amount: 99.00,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80',
      status: 'OPEN',
      is_approved: true,
      opening_time: '07:00',
      closing_time: '22:30'
    },
    {
      id: 'rest_04',
      owner_id: 'usr_owner_02',
      name: 'Chandni Chowk Chaat & Mithai Junction',
      tagline: 'Crispy Raj Kachori, Pani Puri, Kesar Jalebi & Rabri',
      description: 'Old Delhi famous street chaat and authentic Indian sweets made in pure desi ghee.',
      cuisine_types: ['Street Food & Chaat', 'Sweets & Desserts'],
      address: '210 Chandni Chowk Road',
      city: 'New Delhi',
      pincode: '110006',
      lat: 28.6506,
      lng: 77.2303,
      phone: '+91 98100 33445',
      rating: 4.82,
      rating_count: 2100,
      avg_prep_time_mins: 12,
      min_order_amount: 80.00,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=1200&q=80',
      status: 'OPEN',
      is_approved: true,
      opening_time: '10:00',
      closing_time: '22:00'
    },
    {
      id: 'rest_05',
      owner_id: 'usr_owner_01',
      name: 'Mumbai Cutting Chai & Vada Pav Club',
      tagline: 'Hot Batata Vada Pav, Spicy Misal Pav & Masala Cutting Chai',
      description: 'The soul of Mumbai street food — crispy fried garlic vada wrapped in soft pav with spicy red garlic chutney.',
      cuisine_types: ['Street Food & Chaat', 'Snacks'],
      address: '88 Shivaji Park, Dadar West',
      city: 'Mumbai',
      pincode: '400028',
      lat: 19.0280,
      lng: 72.8380,
      phone: '+91 98210 55667',
      rating: 4.90,
      rating_count: 3100,
      avg_prep_time_mins: 10,
      min_order_amount: 60.00,
      image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
      status: 'OPEN',
      is_approved: true,
      opening_time: '08:00',
      closing_time: '23:00'
    }
  ];

  // Populate 20 additional Indian eateries with diverse cuisine tags
  const indianEateries = [
    { name: 'Kolkata Kathi Roll Express', type: ['Street Food & Chaat', 'North Indian'], img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
    { name: 'Rajasthani Royal Thali Ghar', type: ['North Indian', 'Sweets & Desserts'], img: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Kashmiri Wazwan Delights', type: ['Mughlai', 'North Indian'], img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
    { name: 'Goan Coastal Fish Shack', type: ['South Indian', 'Seafood'], img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Indori Sarafa Night Poha Corner', type: ['Street Food & Chaat', 'Sweets & Desserts'], img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
    { name: 'Lucknowi Tunday Kababi', type: ['Mughlai', 'Biryani'], img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80' },
    { name: 'Gujarati Thali & Farsan House', type: ['North Indian', 'Sweets & Desserts'], img: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Darjeeling Steamed Momo Point', type: ['Chinese & Momos', 'Street Food & Chaat'], img: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80' }
  ];

  for (let i = 6; i <= 25; i++) {
    const template = indianEateries[(i - 6) % indianEateries.length];
    restaurantTemplates.push({
      id: `rest_${i < 10 ? '0' + i : i}`,
      owner_id: i % 2 === 0 ? 'usr_owner_01' : 'usr_owner_02',
      name: `${template.name} #${i}`,
      tagline: `Authentic ${template.type.join(', ')} Delicacies`,
      description: `Delicious chef-special Indian regional recipes prepared fresh with spices.`,
      cuisine_types: template.type,
      address: `Shop ${10 + i}, MG Road Metro Plaza`,
      city: i % 3 === 0 ? 'Mumbai' : (i % 2 === 0 ? 'New Delhi' : 'Bengaluru'),
      pincode: `4000${10 + i}`,
      lat: 19.0700 + (i * 0.002),
      lng: 72.8700 + (i * 0.002),
      phone: `+91 98000 ${10000 + i}`,
      rating: +(4.3 + (i % 7) * 0.1).toFixed(2),
      rating_count: 150 + i * 40,
      avg_prep_time_mins: 15 + (i % 3) * 5,
      min_order_amount: 100.00 + (i % 3) * 50,
      image_url: template.img,
      banner_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
      status: i === 24 ? 'TEMPORARILY_UNAVAILABLE' : (i === 25 ? 'CLOSED' : 'OPEN'),
      is_approved: i !== 23,
      opening_time: '09:00',
      closing_time: '23:00'
    });
  }

  restaurantTemplates.forEach(r => db.insert('restaurants', r));

  // 5. CREATE INDIAN DISHES & MENU ITEMS
  const menuData = [
    // Rest 1: Royal Hyderabadi Biryani House
    {
      restaurant_id: 'rest_01',
      category: 'Hyderabadi Dum Biryanis',
      items: [
        {
          id: 'item_01',
          name: 'Special Hyderabadi Chicken Dum Biryani',
          description: 'Marinated chicken cooked with long grain basmati rice, saffron, mint, and pure ghee. Served with Mirchi Ka Salan and Raita.',
          price: 349.00,
          is_veg: false,
          is_spicy: true,
          is_available: true,
          stock_quantity: 1, // CRITICAL FOR CONCURRENCY TEST 3!
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'item_02',
          name: 'Mutton Shahi Dum Biryani',
          description: 'Tender baby goat meat layered with fragrant spiced rice, caramelized onions, fried cashews, and rose water.',
          price: 449.00,
          is_veg: false,
          is_spicy: true,
          is_available: true,
          stock_quantity: 40,
          image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'item_03',
          name: 'Paneer Tikka Dum Biryani',
          description: 'Char-grilled cottage cheese cubes layered with spiced basmati rice and aromatic herbs.',
          price: 299.00,
          is_veg: true,
          is_spicy: false,
          is_available: true,
          stock_quantity: 25,
          image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=400&q=80'
        }
      ]
    },
    // Rest 2: Punjab Da Pind Dhaba
    {
      restaurant_id: 'rest_02',
      category: 'Tandoori & Gravies',
      items: [
        {
          id: 'item_04',
          name: 'Amritsari Butter Chicken',
          description: 'Tandoori grilled chicken tikka simmered in a velvety tomato, cream and cashew butter gravy.',
          price: 320.00,
          is_veg: false,
          is_spicy: false,
          is_available: true,
          stock_quantity: 35,
          image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'item_05',
          name: 'Dal Makhani (Slow Cooked Overnight)',
          description: 'Black lentils simmered overnight on slow charcoal coals topped with fresh white butter and cream.',
          price: 240.00,
          is_veg: true,
          is_spicy: false,
          is_available: true,
          stock_quantity: 50,
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'item_06',
          name: 'Butter Garlic Naan (Tandoor Baked)',
          description: 'Soft fluffy wheat bread baked in clay oven brushed with melted butter and fresh garlic.',
          price: 60.00,
          is_veg: true,
          is_spicy: false,
          is_available: true,
          stock_quantity: 100,
          image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80'
        }
      ]
    },
    // Rest 3: Malgudi South Indian Tiffin Room
    {
      restaurant_id: 'rest_03',
      category: 'South Indian Tiffin',
      items: [
        {
          id: 'item_07',
          name: 'Mysore Butter Masala Dosa',
          description: 'Golden crispy dosa smeared with red spicy garlic chutney, filled with potato masala and topped with Amul butter.',
          price: 130.00,
          is_veg: true,
          is_spicy: true,
          is_available: true,
          stock_quantity: 60,
          image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'item_08',
          name: 'Ghee Podi Button Idli (14 Pcs)',
          description: 'Mini steamed rice cakes tossed in aromatic gun powder spices and hot pure cow ghee.',
          price: 110.00,
          is_veg: true,
          is_spicy: true,
          is_available: true,
          stock_quantity: 45,
          image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80'
        }
      ]
    }
  ];

  let categoryCounter = 1;
  let itemCounter = 9;

  for (const group of menuData) {
    const catId = `cat_${categoryCounter++}`;
    db.insert('menu_categories', {
      id: catId,
      restaurant_id: group.restaurant_id,
      name: group.category,
      sort_order: 1
    });

    for (const item of group.items) {
      db.insert('menu_items', {
        ...item,
        category_id: catId,
        restaurant_id: group.restaurant_id
      });
    }
  }

  // Populate remaining restaurants with 4 Indian dishes each (total > 100 menu items)
  const remainingRestaurants = db.find('restaurants', r => !['rest_01', 'rest_02', 'rest_03'].includes(r.id));
  for (const r of remainingRestaurants) {
    const catId = `cat_${categoryCounter++}`;
    db.insert('menu_categories', {
      id: catId,
      restaurant_id: r.id,
      name: 'Chef Recommendations',
      sort_order: 1
    });

    const indianDishes = [
      { name: `${r.name} Special Deluxe Thali`, price: 280.00, veg: true },
      { name: `Paneer Tikka Butter Masala`, price: 260.00, veg: true },
      { name: `Crispy Samosa Chaat Platter`, price: 120.00, veg: true },
      { name: `Gulab Jamun with Rabri (2 Pcs)`, price: 90.00, veg: true }
    ];

    for (const iData of indianDishes) {
      const itemId = `item_${itemCounter < 10 ? '0' + itemCounter : itemCounter}`;
      itemCounter++;
      db.insert('menu_items', {
        id: itemId,
        restaurant_id: r.id,
        category_id: catId,
        name: iData.name,
        description: `Authentic regional recipe prepared with pure ingredients and spices.`,
        price: iData.price,
        is_veg: iData.veg,
        is_spicy: false,
        is_available: true,
        stock_quantity: 40,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'
      });
    }
  }

  console.log(`✅ QuickBite Indian database seeding completed successfully!`);
  console.log(`Summary: ${demoUsers.length} Indian Users, ${restaurantTemplates.length} Restaurants, ${db.find('menu_items', () => true).length} Dishes.`);
}

module.exports = seed;
