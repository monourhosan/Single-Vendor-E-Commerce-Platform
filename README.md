# ShopLagbe E-Commerce Platform

A production-quality full-stack e-commerce application built with **Laravel 13 (PHP 8.4)** on the backend and **Next.js 15 (App Router, TypeScript, Tailwind CSS, TanStack Query)** on the frontend. Integrated with **bKash Sandbox API**, **SSLCommerz Sandbox Gateway**, and **CarryBee Courier Logistics API**.

---

## Architecture Overview

```
project-root/
├── backend/                  # Laravel 13 API Application
│   ├── app/
│   │   ├── Http/Controllers/ # REST API & Gateway Callback Controllers
│   │   ├── Models/           # Eloquent Models (User, Product, Order, Payment, Delivery...)
│   │   ├── Services/         # Payment (bKash, SSLCommerz) & CarryBee Courier Services
│   │   ├── Jobs/             # Async Delivery Dispatch & Status Sync Workers
│   │   ├── Events/           # OrderCreated, PaymentCompleted
│   │   └── Listeners/        # CreateDeliveryAfterPayment, UpdateInventory
│   ├── config/               # Sanctum, Database, Payment & Service configs
│   ├── database/             # PostgreSQL Migrations & Realistic Seeders
│   ├── routes/               # API, Web, and Console routing
│   └── tests/                # Automated Feature & Unit Tests
│
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── app/
│   │   ├── page.tsx          # Storefront Product Catalog with Search & Filter
│   │   ├── products/[id]/    # Real-time Stock, Gallery, Add to Cart
│   │   ├── cart/             # Shopping Cart with Quantity Adjustments & Totals
│   │   ├── checkout/         # Form Validation & bKash / SSLCommerz / COD Selection
│   │   ├── payment/success/  # Order Confirmation & Live CarryBee Consignment Tracking
│   │   ├── payment/failure/  # Transaction Error Handling & Retry Mechanism
│   │   └── admin/            # Admin Portal: Dashboard, Products, Orders, Payments, Settings
│   ├── components/           # UI Library, Navigation, Cart Drawer, Modals, Badges
│   ├── hooks/                # useCart, useAuth, useToast
│   ├── services/             # Axios/Fetch API Client, Products, Orders, Payments, CarryBee
│   └── types/                # Strict TypeScript Definitions
│
├── docker/                   # Docker environment configs (PHP 8.4, Nginx, Node)
├── docker-compose.yml        # Multi-container orchestration (PHP, Postgres, Redis, Nginx, Node)
└── README.md
```

---

## Key Features

1. **Robust Inventory & Transaction Management**:
   - Concurrency-safe checkout with database row locking (`SELECT FOR UPDATE`).
   - Strict non-negative inventory constraint.
   - Comprehensive audit logging via `inventory_logs` table.
   - Automatic inventory rollback on failed or canceled payments.

2. **bKash Sandbox Payment Integration**:
   - Token Grant & Refresh API (`/token/grant`).
   - Payment Creation (`/create`) with merchant invoice.
   - Payment Execution (`/execute`) and Verification (`/payment/status`).
   - Automated callback controller handling success, cancel, and fail states.

3. **SSLCommerz Sandbox Payment Gateway**:
   - Dynamic session generation (`/gwprocess/v4/api.php`).
   - Gateway redirection & status callbacks (Success, Fail, Cancel).
   - Instant Payment Notification (IPN) validation with SSLCommerz transaction verification server.

4. **CarryBee Courier Delivery Automation**:
   - Event-driven delivery booking: `PaymentCompleted` triggers `CreateCarryBeeDeliveryJob`.
   - Automatic consignment generation, merchant order data dispatch, and tracking number assignment.
   - Background status synchronization job (`SyncDeliveryStatusJob`) scheduled hourly.
   - Customer-facing live tracking timeline.

5. **Customer Storefront & Admin Portal**:
   - High-conversion responsive storefront with search, category filtering, and cart drawer.
   - Admin panel with role-based Sanctum authentication.
   - Real-time widgets: Total Revenue, Orders, Active Products, Low Stock alerts, Delivery statuses.
   - Full Product CRUD with image preview, SKU generator, and stock manager.
   - Order management and manual CarryBee consignment booking triggers.
   - Gateway credential management via system settings.

---

## Getting Started (Docker Setup)

### 1. Clone & Prepare Environment Files
```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

### 2. Launch All Services with Docker Compose
```bash
docker compose up -d --build
```
This boots up:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **PostgreSQL 16**: `localhost:5432` (`shoplagbe_db` / `shoplagbe_user` / `shoplagbe_secure_password`)
- **Redis 7**: `localhost:6379`
- **Queue Worker**: Background job processing

### 3. Run Database Migrations & Seed Sample Data
```bash
docker compose exec php php artisan migrate --seed
```

---

## Local Development (Without Docker)

### Backend Setup:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
# In a separate terminal for queue workers:
php artisan queue:work
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## Default Credentials

### Admin Login
- **URL**: http://localhost:3000/admin/login
- **Email**: `admin@shoplagbe.com`
- **Password**: `admin123456`

### Customer Demo Account
- **Email**: `customer@shoplagbe.com`
- **Password**: `customer123456`

---

## Sandbox Test Credentials

### bKash Sandbox:
- **Sandbox Number**: `01770618575` / `01770618576`
- **OTP**: `123456`
- **PIN**: `12121`

### SSLCommerz Sandbox:
- **Test Cards / Net Banking / Mobile Banking**: Provided on the SSLCommerz sandbox payment redirect page.

---

## Webhook Endpoints & Real-time Integration

The platform provides end-to-end webhook handlers for payment gateways and courier logistics:

| Integration | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **bKash** | `/api/payment/bkash/callback` | GET/POST | Customer redirect callback from bKash checkout |
| **bKash** | `/api/payment/bkash/webhook` | POST | Asynchronous merchant payment confirmation |
| **SSLCommerz** | `/api/payment/sslcommerz/ipn` | POST | Instant Payment Notification with server verification |
| **SSLCommerz** | `/api/payment/sslcommerz/success` | POST | Authorization success callback |
| **SSLCommerz** | `/api/payment/sslcommerz/fail` | POST | Card/bank authorization failure callback |
| **SSLCommerz** | `/api/payment/sslcommerz/cancel` | POST | Customer cancellation callback |
| **CarryBee** | `/api/deliveries/webhook/carrybee` | POST | Consignment status transitions (`picked_up`, `in_transit`, `delivered`, `returned`) |

### In-App Webhook Simulator & Diagnostics:
Navigate to **Admin Portal -> Settings -> Webhooks & Testing** (`/admin/settings`) to:
- Copy webhook URLs directly for gateway configuration.
- Trigger instant 1-click test webhooks (SSLCommerz IPN, CarryBee Delivery Sync, bKash Webhook) and inspect live execution payloads and HTTP 200 responses.

---

## Database Seeders

Running `php artisan migrate --seed` executes:
1. **UserSeeder**:
   - Admin account: `admin@shoplagbe.com` / `admin123456`
   - Customer account: `customer@shoplagbe.com` / `customer123456`
2. **ProductSeeder**:
   - 12 comprehensive products with SKU, prices in BDT, inventory quantities, and HD imagery.
3. **SettingSeeder**:
   - Business branding, shipping rates (inside/outside Dhaka), bKash sandbox credentials, SSLCommerz credentials, and CarryBee API settings.
4. **OrderSeeder**:
   - Realistic orders across all lifecycle states (`shipped`, `delivered`, `processing`, `pending`, `cancelled`).
   - Associated payment transactions (bKash & SSLCommerz) with full audit payloads.
   - CarryBee courier consignments and tracking timelines.
   - Complete `inventory_logs` audit trail.

---

## Automated Tests

Run backend test suite:
```bash
cd backend
php artisan test
```
Tests cover:
- Authentication & Authorization
- Product Management & Querying
- Concurrency-safe Inventory & Row Locking
- Order Creation & Checkout Flow
- bKash & SSLCommerz Payment Callbacks
- CarryBee Courier Delivery Dispatch

