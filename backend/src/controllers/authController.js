const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required.'
      });
    }

    // Check duplicate email
    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'An account with this email address already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userRole = ['ADMIN', 'RESTAURANT', 'DELIVERY', 'CUSTOMER'].includes(role) ? role : 'CUSTOMER';

    const newUser = db.insert('users', {
      id: userId,
      name,
      email: email.toLowerCase(),
      phone: phone || '+1 800-555-0000',
      password_hash: passwordHash,
      role: userRole,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      is_active: true,
      is_suspended: false
    });

    // If delivery partner role, auto-create profile
    if (userRole === 'DELIVERY') {
      db.insert('delivery_partners', {
        id: `dp_${Date.now()}`,
        user_id: userId,
        vehicle_type: 'BIKE',
        vehicle_number: 'QB-RIDER-' + Math.floor(Math.random() * 9000 + 1000),
        license_number: 'DL-' + Math.floor(Math.random() * 9000000 + 1000000),
        is_online: true,
        is_busy: false,
        current_lat: 40.7128,
        current_lng: -74.0060,
        total_deliveries: 0,
        rating: 5.0,
        earnings_total: 0.00
      });
    }

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        avatar_url: newUser.avatar_url
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required.'
      });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password.'
      });
    }

    if (user.is_suspended) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: `Account is suspended. Reason: ${user.suspension_reason || 'Administrative hold.'}`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password.'
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
}

async function getMe(req, res) {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url
    }
  });
}

module.exports = {
  register,
  login,
  getMe
};
