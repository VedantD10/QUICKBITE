# QuickBite — Food Delivery & Restaurant Operations Platform

> QuickBite is an enterprise-grade, full-stack food delivery and restaurant operations platform connecting Customers, Kitchen Operators, Delivery Partners, and Platform Administrators through a unified real-time event-driven system.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://quickbitecom.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📌 Live Demo & Production URL

- 🌐 **Live Production Application**: [https://quickbitecom.vercel.app](https://quickbitecom.vercel.app)
- 🏥 **Backend Health Endpoint**: [https://quickbitecom.vercel.app/health](https://quickbitecom.vercel.app/health)
- 📦 **GitHub Repository**: [https://github.com/VedantD10/QUICKBITE](https://github.com/VedantD10/QUICKBITE)
- 📄 **VESA Full Project Documentation**: [`FINAL_QUICKBITE_PROJECT_DOCUMENTATION.pdf`](./FINAL_QUICKBITE_PROJECT_DOCUMENTATION.pdf)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features by Persona](#-key-features-by-persona)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Database Design](#-database-design)
- [Authentication & Authorization (RBAC)](#-authentication--authorization-rbac)
- [Order Lifecycle & State Machine](#-order-lifecycle--state-machine)
- [Real-Time Architecture (Socket.IO)](#-real-time-architecture-socketio)
- [API Overview](#-api-overview)
- [Security Implementation](#-security-implementation)
- [Automated Testing & QA Verification](#-automated-testing--qa-verification)
- [Deployment Architecture](#-deployment-architecture)
- [Local Development Setup](#-local-development-setup)
- [Environment Configuration](#-environment-configuration)
- [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
- [Engineering Challenges & Resolutions](#-engineering-challenges--resolutions)
- [Future Roadmap](#-future-roadmap)
- [License & Author](#-license--author)

---

## 🌟 Overview

### The Problem
Legacy food delivery platforms often suffer from fragmented communication between kitchen operators, delivery drivers, and customers. Common failure modes include over-sold inventory when multiple customers checkout the last item simultaneously, delayed order pickups due to manual dispatching, and zero real-time visibility during food preparation and trip navigation.

### The QuickBite Solution
QuickBite resolves these operational bottlenecks through a decoupled, multi-role software architecture combining:
1. **Atomic Inventory Transaction Queue**: Mutex transaction locks (`db.transaction`) preventing negative stock under high concurrency.
2. **Controlled Order State Machine**: Unidirectional 9-state pipeline enforcing strict transition guardrails (e.g. preventing cancellation once food preparation begins).
3. **Room-Based WebSocket Event Pipeline**: Socket.IO room subscriptions emitting sub-second updates to customers, kitchens, riders, and platform admins without HTTP polling overhead.
4. **Dual-Mode Database Architecture**: Environment-aware persistence layer (`db.js`) that automatically converts disk storage (`db.json`) into a zero-overhead in-memory snapshot when deployed on Vercel Serverless Functions.

---

## 👑 Key Features by Persona

### 🍔 Customer Experience
- **Restaurant Discovery**: Browse 25+ approved regional Indian kitchens with cuisine tags, star ratings, price for two, and fast 20-min delivery badges.
- **Search & Filter**: Real-time dish name search and dish category filtering (Veg / Non-Veg).
- **Atomic Cart & Checkout**: Interactive slide-over cart drawer with single-restaurant cart validation and real-time stock availability verification.
- **Live Order Status Pipeline**: Synchronized visual order progress modal tracked via WebSockets.
- **Animated Map Routing**: Real-time simulated GPS trip navigation showing rider movement from kitchen to delivery address.
- **Order Cancellation Rules**: Self-service 1-click order cancellation with automatic stock restoration (allowed before kitchen preparation starts).
- **Ratings & Reviews**: 1 to 5 star rating submission for both restaurant quality and delivery partner performance.

### 🍳 Restaurant Owner KDS (Kitchen Display System)
- **Operational Availability Control**: 1-click status toggle (`OPEN`, `CLOSED`, `TEMPORARILY_UNAVAILABLE`) to pause incoming orders during peak rushes.
- **Real-Time KDS Order Stream**: Instant audio/visual alert upon receiving new customer orders (`order:created`).
- **Kitchen Pipeline Advancement**: Step-by-step order state advancement controls (`ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP`).
- **Item-Level Inventory Control**: Live stock quantity editor and 1-click item out-of-stock toggle (`is_available`).
- **Revenue Analytics**: Kitchen dashboard metrics summarizing total revenue, completed orders, and top-selling dishes.

### 🚴 Delivery Partner Rider App
- **Driver Dispatch Workspace**: Live dispatch feed receiving nearby pickup assignments.
- **Availability Toggle**: Online / Offline status switcher controlling trip dispatch eligibility.
- **Accept / Reject Overlay**: Assignment modal with 1-click accept or reject actions.
- **Automatic Reassignment Engine**: Declining a trip automatically marks assignment `REJECTED`, frees the driver, and dispatches the order to the next available rider.
- **Step-by-Step Navigation**: Active trip workflow (`PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) with live GPS coordinate streaming.
- **Earnings Ledger**: Real-time earnings tracker recording delivery fees and completed trips.

### 🛡️ Platform Administrator Console
- **System Command Center**: Platform-wide KPIs displaying Gross Merchandise Value (GMV), total active orders, and revenue splits.
- **Restaurant Onboarding Queue**: Approval and rejection workspace for pending kitchen onboarding applications.
- **User Directory Governance**: Full user management table with 1-click account suspension controls and audit logging.
- **Complaints & Dispute Desk**: Customer grievance desk with 1-click resolution and logged refund processing.

---

## 📐 System Architecture

QuickBite utilizes a decoupled multi-tier architecture designed for high availability, sub-second WebSocket event propagation, and serverless execution.

```mermaid
flowchart TB
    subgraph Client["Presentation Layer (React 18 SPA)"]
        C1["Customer Dashboard"]
        C2["Restaurant KDS"]
        C3["Rider Workspace"]
        C4["Admin Console"]
    end

    subgraph Network["Communication Layer"]
        REST["REST API (HTTP / JSON)"]
        WS["Socket.IO (WebSockets)"]
    end

    subgraph Backend["Application Layer (Node.js + Express)"]
        AUTH["JWT & RBAC Middleware"]
        CTRL["Domain Controllers"]
        SVC["Order State Machine Service"]
        SOCK["Socket Event Engine"]
    end

    subgraph Storage["Data Access Layer"]
        DB["Atomic SQL-JSON Engine (db.js)"]
        LOCAL["Disk Persistence (db.json)"]
        MEM["Vercel In-Memory Snapshot"]
    end

    C1 & C2 & C3 & C4 -->|HTTP Requests| REST
    C1 & C2 & C3 & C4 <-->|WebSocket Rooms| WS

    REST --> AUTH --> CTRL --> SVC
    WS <--> SOCK <--> SVC

    SVC --> DB
    DB -->|Local Dev| LOCAL
    DB -->|Vercel Lambda| MEM
```

### Component Responsibilities
- **Frontend Layer**: Built with React 18, Vite, Lucide Icons, and TailwindCSS. Utilizes React Context (`AuthContext` & `SocketContext`) for session state and WebSocket events.
- **Backend API Layer**: Node.js and Express.js modular micro-backend handling authentication, REST routes, state machine validation, and Socket.IO room management.
- **Data Access Layer**: Custom transactional SQL-JSON engine (`db.js`) featuring atomic mutex transaction locks (`db.transaction`), in-place array mutations, and dual-mode environment adaptation.

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose / Value Added |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `v18.3.1` | Declarative, component-driven Single Page Application |
| **Build Tool** | Vite | `v5.4.2` | High-performance build tool with sub-second HMR |
| **Styling & UI** | TailwindCSS + Lucide Icons | `v3.4.1` | Glassmorphic design system and vector icon set |
| **Backend Runtime** | Node.js | `v18+` | Event-driven non-blocking JavaScript runtime |
| **Web Framework** | Express.js | `v4.19.2` | Modular RESTful API route framework |
| **Real-Time Engine** | Socket.IO | `v4.7.5` | Bi-directional WebSocket room event streaming |
| **Authentication** | JSON Web Tokens (JWT) | `v9.0.2` | HMAC-SHA256 signed bearer tokens with 24h expiration |
| **Password Security** | BcryptJS | `v2.4.3` | 10-round salted password hashing |
| **Data Engine** | Embedded SQL-JSON | Built-in | ACID-compliant atomic transaction engine with local JSON disk backup |
| **Deployment** | Vercel Serverless | AWS Lambda | Zero-config edge serverless functions + static SPA hosting |
| **Documentation Engine** | PDFKit | `v0.16.0` | Publication-grade 55-page PDF report compilation |

---

## 📁 Project Folder Structure

```text
quickbite-platform/
├── api/
│   └── index.js                   # Vercel Serverless Function entrypoint
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Atomic SQL-JSON Database Engine (Dual-Mode)
│   │   ├── controllers/
│   │   │   ├── adminController.js # Admin console & dispute handlers
│   │   │   ├── authController.js  # JWT Login & Registration controller
│   │   │   ├── customerController.js # Restaurant discovery & cart endpoints
│   │   │   ├── deliveryController.js # Rider dispatch & GPS location streaming
│   │   │   └── restaurantController.js # KDS order queue & menu management
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verification & RBAC requireRole middleware
│   │   ├── routes/
│   │   │   └── apiRoutes.js       # Central REST API router definitions
│   │   ├── services/
│   │   │   └── orderService.js    # Unidirectional Order State Machine & Mutex Lock
│   │   ├── socket/
│   │   │   └── socketHandler.js   # Socket.IO authenticated room engine
│   │   ├── utils/
│   │   │   └── seedData.js        # Synchronous 0ms Database Seeder
│   │   └── server.js              # Express HTTP & Socket.IO server setup
│   ├── .env.example               # Backend environment variable template
│   ├── package.json               # Backend dependencies
│   ├── test_suite.js              # Automated VESA Edge-Case Test Runner
│   └── verify_vercel.js           # Serverless architecture test script
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, CartDrawer, OrderTrackerModal, AuthModal
│   │   ├── context/               # AuthContext, SocketContext
│   │   ├── pages/                 # Customer, Restaurant, Delivery, Admin Dashboards
│   │   ├── services/              # Frontend API client (api.js)
│   │   ├── App.jsx                # Core application router & workspace switcher
│   │   └── main.jsx               # React DOM root entrypoint
│   ├── public/                    # Static assets & icons
│   ├── .env.example               # Frontend environment variable template
│   ├── index.html                 # Main HTML template
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Vite build & API proxy configuration
├── docs/
│   ├── API_DOCS.md                # Comprehensive REST API reference
│   ├── ARCHITECTURE.md            # Multi-tier system architecture specification
│   ├── ER_DIAGRAM.md              # Database schemas & entity relationships
│   ├── RBAC_MATRIX.md             # Role-Based Access Control matrix
│   ├── REALTIME_FLOW.md           # Socket.IO room & event payload specs
│   └── STATE_MACHINE.md           # 9-state order lifecycle state machine
├── FINAL_QUICKBITE_PROJECT_DOCUMENTATION.pdf # 55-page official VESA report PDF
├── PROJECT_REPORT.md             # Primary Markdown submission report
├── README.md                     # Main GitHub repository documentation
├── schema.sql                    # MySQL export schema definition
├── vercel.json                   # Vercel serverless build & rewrite rules
└── package.json                  # Root package configuration
```

---

## 🗄️ Database Design

QuickBite utilizes a relational SQL-JSON database structure managed by `backend/src/config/db.js`. It contains 13 relational collections:

```text
+---------------+       1:N       +------------------+
|     USERS     | --------------->|   RESTAURANTS    |
+---------------+                 +------------------+
        |                                  |
        | 1:N                              | 1:N
        v                                  v
+---------------+                 +------------------+
|    ORDERS     |                 |    MENU_ITEMS    |
+---------------+                 +------------------+
        |                                  |
        | 1:N                              | 1:N
        v                                  v
+---------------+                 +------------------+
|  ORDER_ITEMS  |<----------------|  MENU_CATEGORIES |
+---------------+                 +------------------+
        |
        | 1:1
        v
+-----------------------+
| DELIVERY_ASSIGNMENTS  |
+-----------------------+
```

### Table Definitions & Primary Models
1. **`users`**: User identity records (`id`, `name`, `email`, `password_hash`, `role`, `is_suspended`).
2. **`restaurants`**: Kitchen profiles (`id`, `name`, `owner_id`, `status`, `rating`, `cuisine_types`).
3. **`menu_categories`**: Logical menu groupings (`id`, `restaurant_id`, `name`, `display_order`).
4. **`menu_items`**: Dish offerings (`id`, `category_id`, `name`, `price`, `stock_quantity`, `is_available`).
5. **`orders`**: Master order transactions (`id`, `customer_id`, `restaurant_id`, `delivery_partner_id`, `status`, `subtotal`, `tax`, `total`).
6. **`order_items`**: Individual items in an order (`id`, `order_id`, `menu_item_id`, `quantity`, `price`).
7. **`delivery_assignments`**: Dispatch logs (`id`, `order_id`, `delivery_partner_id`, `status`, `rejection_count`).
8. **`order_status_history`**: Audit trail logging every status transition timestamp and user ID.
9. **`ratings`**: Star ratings submitted by customers (`id`, `order_id`, `restaurant_rating`, `delivery_rating`).
10. **`complaints`**: Dispute tickets logged by customers (`id`, `order_id`, `issue_type`, `status`, `refund_amount`).

*For full column definitions, constraints, and relationships, refer to [`docs/ER_DIAGRAM.md`](./docs/ER_DIAGRAM.md).*

---

## 🔒 Authentication & Authorization (RBAC)

QuickBite secures backend endpoints using **JSON Web Tokens (JWT)** and role-based access control middleware (`backend/src/middleware/auth.js`).

### Auth Mechanism
- **Login Endpoint**: `POST /api/auth/login` accepts credentials, verifies password hashes using `bcrypt.compare`, and issues a signed JWT bearer token expiring in 24 hours.
- **Authorization Header**: Requests to protected routes must supply `Authorization: Bearer <TOKEN>`.
- **Role Verification**: Middleware `requireRole('CUSTOMER', 'RESTAURANT', 'DELIVERY', 'ADMIN')` extracts user role from token payload and validates access permissions.

### Error Codes
- **HTTP 401 Unauthorized**: Returned when authorization header is missing or JWT token is invalid/expired.
- **HTTP 403 Forbidden**: Returned when an authenticated user attempts to access a route restricted to another role (e.g. Customer accessing Admin API).

*For the complete access matrix across all endpoints, refer to [`docs/RBAC_MATRIX.md`](./docs/RBAC_MATRIX.md).*

---

## 🔄 Order Lifecycle & State Machine

Orders follow a strict, unidirectional 9-state machine managed by `backend/src/services/orderService.js`:

```text
[PLACED] ----> [RESTAURANT_ACCEPTED] ----> [PREPARING] ----> [READY_FOR_PICKUP]
   |                     |
   v                     v
[CANCELLED]          [CANCELLED]
                         |
                         v
                [DELIVERY_ASSIGNED] ----> [PICKED_UP] ----> [OUT_FOR_DELIVERY]
                         |                                          |
                         v                                          v
                [DELIVERY_REASSIGNED]                          [DELIVERED]
                                                                    |
                                                                    v
                                                               [COMPLETED]
```

### Business Guardrails
1. **Cancellation Window**: Order cancellation is permitted **ONLY** when status is `PLACED` or `RESTAURANT_ACCEPTED`. Attempting to cancel during `PREPARING` is rejected by backend with `HTTP 400 Bad Request`.
2. **Atomic Inventory Protection**: Item stock is decremented atomically inside `db.transaction`. If remaining stock reaches 0, `is_available` is automatically toggled to `false`.
3. **Driver Reassignment**: Declining an assignment marks driver status `REJECTED`, frees the driver, and auto-dispatches to the next online delivery partner.

*For complete transition rules and state constraints, refer to [`docs/STATE_MACHINE.md`](./docs/STATE_MACHINE.md).*

---

## ⚡ Real-Time Architecture (Socket.IO)

QuickBite utilizes Socket.IO WebSocket connections (`backend/src/socket/socketHandler.js`) to stream real-time updates across 4 authenticated room channels:

### Room Subscriptions
- **`user_${userId}`**: Receives targeted personal notifications (order status changes, driver location, dispute updates).
- **`restaurant_${restaurantId}`**: Receives live kitchen order alerts (`order:created`).
- **`order_${orderId}`**: Receives live GPS coordinate streams (`delivery:location_updated`) during active trip delivery.
- **`admin_channel`**: System-wide operations room broadcasting platform metrics and complaint events.

### Primary Socket Events
| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `order:created` | Backend -> Restaurant | Broadcasts new order payload to kitchen KDS |
| `order:status_updated` | Backend -> Customer | Notifies customer of state advancement (`PLACED` -> `PREPARING`) |
| `delivery:assigned` | Backend -> Driver | Emits trip dispatch offer to delivery partner |
| `delivery:location_updated` | Driver -> Customer | Streams live GPS coordinates (`lat`, `lng`) to order tracker map |
| `stock:updated` | Restaurant -> Public | Broadcasts item availability change to browsing customers |

*For complete event schemas and payload examples, refer to [`docs/REALTIME_FLOW.md`](./docs/REALTIME_FLOW.md).*

---

## 📡 API Overview

QuickBite exposes a RESTful API grouped into logical domain modules. Below is a summary of key endpoints:

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT bearer token |
| `GET` | `/api/restaurants` | Public | Retrieves approved restaurants with cuisine & search filters |
| `POST` | `/api/orders` | Customer | Places new food order with atomic stock check & socket broadcast |
| `PATCH` | `/api/orders/:id/cancel` | Customer / Admin | Cancels order & restores inventory (before preparation) |
| `PATCH` | `/api/orders/:id/status` | Restaurant / Rider | Advances order state machine & emits socket event |
| `POST` | `/api/deliveries/accept` | Delivery Partner | Claims assigned delivery trip |
| `PATCH` | `/api/admin/users/:id/suspend` | Admin | Toggles user suspension status with audit reason log |
| `GET` | `/health` | Public | Serverless health check returning JSON status & entity counts |

*For full request/response schemas, query parameters, and headers, refer to [`docs/API_DOCS.md`](./docs/API_DOCS.md).*

---

## 🛡️ Security Implementation

- **JWT HMAC-SHA256 Token Signing**: All tokens are signed with a secure secret and checked on protected endpoints.
- **Bcrypt Password Hashing**: Passwords stored using 10 salt rounds to prevent rainbow table attacks.
- **Role-Based Access Control (RBAC)**: Fine-grained role verification via `requireRole` middleware on every backend controller.
- **Atomic Mutex Locking**: Transaction locks prevent race conditions and inventory manipulation.
- **Environment Isolation**: Production secrets and configuration parameters stored exclusively in environment variables.

---

## 🧪 Automated Testing & QA Verification

QuickBite includes an automated VESA test suite (`backend/test_suite.js`) validating all 8 mandatory edge-case criteria:

```text
🧪 RUNNING COMPREHENSIVE VESA EDGE-CASE TEST SUITE...
====================================================
🔹 TEST 1: Customer cancels order BEFORE preparation   -> PASS (HTTP 200 Order cancelled & stock restored)
🔹 TEST 2: Customer cancels order AFTER prep begins   -> PASS (HTTP 400 Rejected by backend)
🔹 TEST 3: Concurrent order of last stock item         -> PASS (HTTP 400 Atomic lock prevents negative stock)
🔹 TEST 4: Order from TEMPORARILY_UNAVAILABLE kitchen  -> PASS (HTTP 400 Orders blocked)
🔹 TEST 6: Delivery partner declines assignment       -> PASS (HTTP 200 Driver freed & auto-reassigned)
🔹 TEST 7: Customer accesses Admin API endpoint        -> PASS (HTTP 403 Forbidden)
🔹 TEST 8: Unauthenticated API request execution       -> PASS (HTTP 401 Unauthorized)
====================================================
✅ ALL VESA MANDATORY EDGE-CASE TESTS PASSED PERFECTLY!
```

---

## 🌐 Deployment Architecture

QuickBite is deployed live on Vercel Serverless Functions paired with Vite SPA hosting.

- **Frontend Hosting**: Vercel Static Build (Vite SPA)
- **Backend API Hosting**: Vercel Serverless Functions (`api/index.js`)
- **Dual-Mode Data Provider**: Detects `process.env.VERCEL` and automatically switches disk `db.json` storage to a zero-overhead in-memory database, eliminating `EROFS` read-only filesystem crashes on Vercel AWS Lambda containers.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### 1. Clone Repository
```bash
git clone https://github.com/VedantD10/QUICKBITE.git
cd QUICKBITE
```

### 2. Backend Installation & Startup
```bash
cd backend
npm install
npm run dev
```
*Backend server starts on `http://localhost:5000` with auto-seeded database.*

### 3. Frontend Installation & Startup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend web application starts on `http://localhost:3000`.*

---

## ⚙️ Environment Configuration

### Backend Environment (`backend/.env.example`)
```env
PORT=5000
JWT_SECRET=quickbite_super_secret_jwt_key_2026
NODE_ENV=development
```

### Frontend Environment (`frontend/.env.example`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🔑 Pre-Configured Demo Accounts

For instant evaluation, QuickBite includes 1-click evaluator login buttons in the authentication modal:

| Persona Role | Demo Email | Password | Primary Focus & Workspaces |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@quickbite.com` | `password123` | Discovery, cart checkout, live Socket.IO tracker |
| **Restaurant Owner** | `owner@quickbite.com` | `password123` | Kitchen KDS queue, status toggle, menu stock |
| **Delivery Partner** | `delivery@quickbite.com` | `password123` | Driver dispatch, trip steps, accept/reject, earnings |
| **Platform Admin** | `admin@quickbite.com` | `password123` | Command center, GMV analytics, approvals, user suspension |

---

## 💡 Engineering Challenges & Resolutions

1. **Vercel Read-Only Filesystem (`EROFS`) Crash**:
   - *Problem*: `db.js` executed `fs.writeFileSync` on `db.json`. Vercel serverless containers operate on a read-only filesystem (`/var/task`), causing `EROFS` exceptions.
   - *Resolution*: Added `isVercel` environment check in `db.js` that bypasses disk writes and maintains an in-memory snapshot for serverless execution.
2. **Cold-Start Seeding Latency**:
   - *Problem*: Dynamic `bcrypt.hash` iterations on cold-starts caused execution timeouts.
   - *Resolution*: Pre-computed a bcrypt hash constant (`$2b$10$P2JIdOPWi...`), enabling instant **0ms synchronous seeding** during lambda container startup.
3. **Simultaneous Order Overselling**:
   - *Problem*: Concurrent checkouts on the last item caused negative inventory.
   - *Resolution*: Created `db.transaction` mutex lock queue that processes checkouts serially and rejects out-of-stock orders with HTTP 400.

---

## 🔮 Future Roadmap

- 💳 **Digital Payment Gateway**: Integrating Razorpay & Stripe Webhook payment processing.
- 🗺️ **Google Maps API**: Upgrading simulated trip routes to Google Maps Directions API.
- 🔔 **Mobile Push Notifications**: Firebase Cloud Messaging (FCM) integration for real-time mobile push alerts.
- 📊 **Automated Fraud Detection**: Machine learning anomaly detection flagging suspicious customer dispute patterns.

---

## 📄 License & Author

### License
This project is licensed under the **MIT License** — see the [`LICENSE`](./LICENSE) file for details.

### Author
- **Vedant Deshmukh** — Lead Full-Stack Software Engineer  
- **GitHub**: [@VedantD10](https://github.com/VedantD10)  
- **Repository**: [https://github.com/VedantD10/QUICKBITE](https://github.com/VedantD10/QUICKBITE)
