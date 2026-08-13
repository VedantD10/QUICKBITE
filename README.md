# QuickBite — Food Delivery & Restaurant Operations Platform
## VESA Skill Development Program (Project 2)

QuickBite is a multi-role, full-stack food delivery and restaurant operations platform connecting Customers, Restaurant Owners, Delivery Partners, and Platform Administrators.

---

## 🌟 Key Platform Capabilities

- **Customer Experience**: Restaurant discovery with cuisine filters, menu browsing, atomic stock cart checkout, live Socket.IO order status pipeline tracker, delivery map simulation, and star ratings.
- **Restaurant Owner KDS Workspace**: Real-time Kitchen Display System (KDS), availability toggle (`OPEN`, `CLOSED`, `TEMPORARILY_UNAVAILABLE`), status transition controls, item-level stock inventory toggles, and revenue analytics.
- **Delivery Partner Application**: Driver dispatch workspace, online/offline toggle, assignment accept/reject overlay with **automatic reassignment engine**, step-by-step trip route guidance, and earnings ledger.
- **Platform Administrator Console**: Command center with GMV KPIs, restaurant onboarding approval queue, user & fraud management with account suspension controls, and customer complaints/disputes desk with refund logging.
- **Concurrency & Inventory Protection**: Atomic database transaction locking preventing negative stock when two users order the last item simultaneously.
- **Controlled Order State Machine**: Strict backend state transition rules (`PLACED` → `RESTAURANT_ACCEPTED` → `PREPARING` → `READY_FOR_PICKUP` → `DELIVERY_ASSIGNED` → `PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED` → `COMPLETED`).
- **Real-Time WebSockets**: Socket.IO authenticated rooms emitting instant order updates, kitchen alerts, driver dispatch notifications, and stock out warnings.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | SPA architecture with Lucide Icons & Tailwind CSS design system |
| **Backend** | Node.js + Express.js | Modular REST API micro-backend with domain controllers & services |
| **Database** | Embedded SQL-JSON Engine | ACID transaction safety, mutex locks, and `schema.sql` MySQL export |
| **Real-Time** | Socket.IO | Room-based WebSocket broadcasting |
| **Security** | JWT + BcryptJS | Secret-signed bearer tokens, 24h expiration, and RBAC middleware |

---

## 🔑 Pre-Configured Demo Accounts (1-Click Evaluator Login)

| Role | Email | Password | Workspaces / Focus Area |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@quickbite.com` | `password123` | Restaurant discovery, cart, checkout, live order tracking |
| **Restaurant Owner** | `owner@quickbite.com` | `password123` | KDS order queue, status toggle, menu stock control |
| **Delivery Partner** | `delivery@quickbite.com` | `password123` | Driver dispatch, trip steps, accept/reject, earnings |
| **Platform Admin** | `admin@quickbite.com` | `password123` | Command center, GMV analytics, approvals, user suspension |

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
node src/server.js
```
*Backend runs on `http://localhost:5000` with auto-seeded database.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend app runs on `http://localhost:3000`.*

---

## 🧪 Running Automated Edge-Case Test Suite
```bash
cd backend
node test_suite.js
```

### Verified Test Matrix
1. **TEST 1**: Customer cancels before preparation → **PASS (Stock restored)**
2. **TEST 2**: Customer cancels after preparation → **PASS (HTTP 400 Rejected by backend)**
3. **TEST 3**: Simultaneous order of last stock item → **PASS (Atomic protection, no negative stock)**
4. **TEST 4**: Restaurant temporarily unavailable → **PASS (New orders blocked)**
5. **TEST 5**: Out of stock item checkout → **PASS (Validation fails safely)**
6. **TEST 6**: Delivery partner rejects assignment → **PASS (Auto-reassigned to next partner)**
7. **TEST 7**: Customer accesses Admin API → **PASS (HTTP 403 Forbidden)**
8. **TEST 8**: Unauthenticated API call → **PASS (HTTP 401 Unauthorized)**

---

## 📁 Repository Structure
```
quickbite-platform/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js)
│   │   ├── controllers/ (auth, customer, restaurant, delivery, admin)
│   │   ├── middleware/ (auth.js)
│   │   ├── services/ (orderService.js)
│   │   ├── socket/ (socketHandler.js)
│   │   ├── utils/ (seedData.js)
│   │   └── server.js
│   └── test_suite.js
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, CartDrawer, OrderTrackerModal)
│   │   ├── context/ (AuthContext, SocketContext)
│   │   ├── pages/ (Customer, Restaurant, Delivery, Admin dashboards)
│   │   ├── services/ (api.js)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── schema.sql
└── README.md
```
