-- QuickBite Food Delivery & Restaurant Operations Platform
-- Relational Database Schema Specification (MySQL / InnoDB 8.0+)
-- Author: QuickBite Engineering Team (VESA Skill Development Program - Project 2)

CREATE DATABASE IF NOT EXISTS quickbite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quickbite_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER', 'RESTAURANT', 'DELIVERY', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  avatar_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  suspension_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS restaurants (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  cuisine_types JSON NOT NULL, -- e.g. ["Italian", "Pizza", "Pastas"]
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Metropolis',
  pincode VARCHAR(10) NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 4.50,
  rating_count INT NOT NULL DEFAULT 0,
  avg_prep_time_mins INT NOT NULL DEFAULT 25,
  min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  image_url VARCHAR(255),
  banner_url VARCHAR(255),
  status ENUM('OPEN', 'CLOSED', 'TEMPORARILY_UNAVAILABLE') NOT NULL DEFAULT 'OPEN',
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  opening_time VARCHAR(10) NOT NULL DEFAULT '09:00',
  closing_time VARCHAR(10) NOT NULL DEFAULT '23:00',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_restaurants_status (status),
  INDEX idx_restaurants_owner (owner_id)
) ENGINE=InnoDB;

-- 3. MENU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS menu_categories (
  id VARCHAR(36) PRIMARY KEY,
  restaurant_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_categories_restaurant (restaurant_id)
) ENGINE=InnoDB;

-- 4. MENU ITEMS TABLE (Includes Atomic Inventory & Stock Constraints)
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(36) PRIMARY KEY,
  restaurant_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_veg BOOLEAN NOT NULL DEFAULT TRUE,
  is_spicy BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity INT NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
  INDEX idx_menu_items_restaurant (restaurant_id),
  INDEX idx_menu_items_category (category_id),
  INDEX idx_menu_items_available (is_available)
) ENGINE=InnoDB;

-- 5. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home', -- Home, Work, Other
  flat_no VARCHAR(100) NOT NULL,
  street VARCHAR(255) NOT NULL,
  landmark VARCHAR(255),
  city VARCHAR(100) NOT NULL DEFAULT 'Metropolis',
  pincode VARCHAR(10) NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- 6. DELIVERY PARTNERS TABLE
CREATE TABLE IF NOT EXISTS delivery_partners (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  vehicle_type ENUM('BIKE', 'SCOOTER', 'EV_BIKE', 'BICYCLE') NOT NULL DEFAULT 'BIKE',
  vehicle_number VARCHAR(50) NOT NULL,
  license_number VARCHAR(50) NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  is_busy BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat DECIMAL(10, 7) NOT NULL,
  current_lng DECIMAL(10, 7) NOT NULL,
  total_deliveries INT NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 4.80,
  earnings_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. ORDERS TABLE (Core Controlled State Machine Entity)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id VARCHAR(36) NOT NULL,
  restaurant_id VARCHAR(36) NOT NULL,
  delivery_partner_id VARCHAR(36),
  address_id VARCHAR(36) NOT NULL,
  status ENUM(
    'PLACED',
    'RESTAURANT_ACCEPTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'DELIVERY_ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RESTAURANT_REJECTED'
  ) NOT NULL DEFAULT 'PLACED',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
  surge_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('CARD', 'UPI', 'COD', 'WALLET') NOT NULL DEFAULT 'UPI',
  payment_status ENUM('PENDING', 'COMPLETED', 'REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  cancellation_reason TEXT,
  estimated_delivery_time TIMESTAMP,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_restaurant (restaurant_id),
  INDEX idx_orders_delivery (delivery_partner_id)
) ENGINE=InnoDB;

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  menu_item_id VARCHAR(36) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- 9. DELIVERY ASSIGNMENTS & REASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  partner_id VARCHAR(36) NOT NULL,
  status ENUM('ASSIGNED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'ASSIGNED',
  reassignment_count INT NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES delivery_partners(id),
  INDEX idx_assignments_order (order_id),
  INDEX idx_assignments_partner (partner_id)
) ENGINE=InnoDB;

-- 10. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id VARCHAR(36) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_history_order (order_id)
) ENGINE=InnoDB;

-- 11. RATINGS TABLE
CREATE TABLE IF NOT EXISTS ratings (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL UNIQUE,
  customer_id VARCHAR(36) NOT NULL,
  restaurant_id VARCHAR(36) NOT NULL,
  delivery_partner_id VARCHAR(36),
  restaurant_rating INT NOT NULL CHECK (restaurant_rating BETWEEN 1 AND 5),
  delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB;

-- 12. COMPLAINTS & DISPUTES TABLE
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('FOOD_QUALITY', 'DELIVERY_DELAY', 'WRONG_ITEM', 'RUDE_BEHAVIOR', 'OTHER') NOT NULL,
  status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  resolved_by_admin_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action_type VARCHAR(100) NOT NULL,
  resource_name VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36),
  ip_address VARCHAR(45),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action_type)
) ENGINE=InnoDB;
