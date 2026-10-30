# ShopSphere

A production-quality MERN e-commerce application with a customer storefront and a full administrator console. ShopSphere covers the complete shopping lifecycle: browsing, search and filters, cart and wishlist, coupon-aware checkout, simulated online payments or cash on delivery, order tracking, cancellation, reviews and live store analytics.

The UI is inspired by modern Indian marketplaces — a light, spacious layout with indigo/blue accents, responsive grids, skeleton loaders, empty and error states, toast feedback and subtle motion.

---

## Table of contents

- [Demo accounts](#demo-accounts)
- [Feature highlights](#feature-highlights)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [MongoDB setup](#mongodb-setup)
- [Environment variables](#environment-variables)
- [Seed data](#seed-data)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [API overview](#api-overview)
- [Business rules](#business-rules)
- [Security](#security)
- [Admin setup](#admin-setup)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Demo accounts

These accounts are created by `npm run seed` in development. The seed script refuses to use development defaults when `NODE_ENV=production`.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@shopsphere.com` | `Admin@12345` |
| Customer | `customer@shopsphere.com` | `Customer@123` |
| Customer | `priya@example.com` | `Customer@123` |
| Customer | `rohan@example.com` | `Customer@123` |

> Change these credentials (or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_CUSTOMER_PASSWORD`) before deploying anywhere public.

---

## Feature highlights

### Customer storefront

- Register, log in, log out, persistent JWT sessions and protected routes.
- Profile editing, saved address, phone update and password change.
- Home page with hero, category tiles, featured products, best sellers, new arrivals and trust sections — all powered by live API data.
- Catalogue with keyword search, category/brand/price/rating filters, sorting, in-stock toggle and pagination.
- Product details with image gallery, stock state, highlights, specifications, related products and reviews.
- One review per customer per product, with edit and delete support and automatic verified-purchase badges.
- Persistent server-side cart with stock validation, quantity controls, save-for-later and clear-cart confirmation.
- Wishlist with save, remove and move-to-cart.
- Checkout with address form, server-validated coupons, delivery calculation, COD or simulated online payment.
- Order confirmation, order history with status filters, order details, tracking timeline, customer cancellation and buy-again.
- Branded 404 page, loading skeletons, empty states and error states with retry actions.
- Guest cart support that merges into the account cart after login.

### Administrator console

- Dashboard with live database statistics, revenue chart (7/30 days), recent orders, best sellers, low-stock products and catalogue mix.
- Product management: create, edit, delete, search, filter, image upload, URL images, stock updates and low/out-of-stock badges.
- Category management: create, edit and delete, with protection against deleting categories that still contain products.
- Order management: filters by status/payment status, keyword search, full order inspection, fulfilment transitions and cancellation with stock restoration.
- Customer management: search, role filters, block/unblock, role assignment, order history and saved address inspection.
- Server-side role enforcement on every admin endpoint (the UI guard is only a convenience).
- Self-protection: administrators cannot block themselves or change their own role.

### Platform

- REST API with centralized error handling and consistent JSON envelopes.
- JWT authentication, bcrypt password hashing and role-based authorization.
- Helmet, CORS allow-list, request rate limiting, Mongo operator sanitisation, upload type/size validation.
- Server-side price, discount, shipping and coupon recalculation — the client never decides what an order costs.
- Atomic conditional stock decrements with rollback on failure.
- Responsive, accessible UI with keyboard-friendly controls, focus states, ARIA labels and reduced-motion support.
- Fully working buttons and links; no placeholder screens or fabricated dashboard numbers.

---

## Tech stack

**Frontend**

- React 18 + Vite 5
- React Router 6
- Tailwind CSS 3
- Axios
- Context API (`AuthContext`, `CartContext`, `WishlistContext`)
- Lucide React icons
- React Hot Toast
- Playwright for end-to-end tests

**Backend**

- Node.js 18+ and Express 4
- MongoDB with Mongoose 8
- JWT (`jsonwebtoken`) and bcrypt (`bcryptjs`)
- Multer 2 for image uploads
- express-validator
- Helmet, CORS, compression, morgan
- express-rate-limit
- Node's built-in test runner + Supertest for API tests
- `mongodb-memory-server` for tests and an optional ephemeral demo database

---

## Quick start

### Prerequisites

- Node.js **18 or newer** (Node 20 LTS recommended)
- npm 9+
- MongoDB 6/7 running locally, a MongoDB Atlas cluster, or Docker

### 1. Install dependencies

```bash
git clone https://github.com/ayushman2006-bit/shopsphere-mern-ecommerce.git
cd shopsphere-mern-ecommerce

npm install
npm run install:all
```

`npm install` installs the root helper (`concurrently`). `npm run install:all` installs `backend/` and `frontend/` dependencies.

### 2. Configure the backend

```bash
# macOS / Linux
cp backend/.env.example backend/.env

# Windows PowerShell
Copy-Item backend/.env.example backend/.env
```

Generate a JWT secret and paste it into `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set at least:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shopsphere
JWT_SECRET=<your long random secret>
CLIENT_URL=http://localhost:5173
```

The frontend works with the Vite proxy out of the box. No frontend `.env` is required for local development.

### 3. Start MongoDB

Use one of the [MongoDB setup options](#mongodb-setup).

### 4. Seed the database

```bash
npm run seed
```

This clears the ShopSphere collections and creates 6 categories, 35 products, 4 users, 12 orders, 10 reviews, plus wishlist and cart demo data.

### 5. Run the application

```bash
npm run dev
```

- Storefront: <http://localhost:5173>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

Or run the two processes separately:

```bash
npm run dev:backend
npm run dev:frontend
```

---

## MongoDB setup

### Option A — local MongoDB (recommended)

Install MongoDB Community Server and start it as a service. The default connection string is:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shopsphere
```

No manual database creation is needed; MongoDB creates `shopsphere` on first write.

### Option B — Docker

The repository includes a `docker-compose.yml` with MongoDB 7 and a persistent volume:

```bash
docker compose up -d mongo
```

### Option C — MongoDB Atlas

1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Create a database user and allow your IP address.
3. Copy the driver connection string and add the database name:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/shopsphere?retryWrites=true&w=majority
```

### Option D — ephemeral in-memory MongoDB (demo / offline)

A helper starts a real MongoDB server in memory on port 27017:

```bash
npm run memory-db --prefix backend
```

In a second terminal:

```bash
npm run seed
npm run dev
```

Data disappears when the helper stops. You can also set `USE_MEMORY_DB=true` in `backend/.env` to let the API start its own in-memory database, but a separately seeded database will not be shared with that process — use the helper above when you want seeded demo data.

---

## Environment variables

### `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `production` or `test`. Defaults to development. |
| `PORT` | No | API port. Defaults to `5000`. |
| `MONGODB_URI` | **Yes** | MongoDB connection string. |
| `USE_MEMORY_DB` | No | `true` starts an in-memory MongoDB inside the API process. |
| `CLIENT_URL` | **Yes** | Comma-separated allowed frontend origins. |
| `JWT_SECRET` | **Yes** | Long random secret used to sign JWTs. |
| `JWT_EXPIRES_IN` | No | Token lifetime. Defaults to `7d`. |
| `API_URL` | No | Public API origin used when building image URLs. |
| `SEED_ADMIN_NAME` | No | Seed administrator name. |
| `SEED_ADMIN_EMAIL` | Production | Seed administrator email. |
| `SEED_ADMIN_PASSWORD` | Production | Seed administrator password. |
| `SEED_CUSTOMER_PASSWORD` | No | Password for seeded demo customers. |
| `AUTH_RATE_LIMIT_MAX` | No | Login attempts per IP per 15 minutes. Defaults to `50`. |
| `REGISTER_RATE_LIMIT_MAX` | No | Registrations per IP per hour. Defaults to `20`. |
| `API_RATE_LIMIT_MAX` | No | General API requests per IP per 15 minutes. Defaults to `1500`. |

### `frontend/.env` (optional)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `https://api.example.com/api`. Leave empty to use the Vite proxy. |
| `VITE_API_ORIGIN` | API origin used to resolve `/uploads/...` images in production. |

---

## Seed data

`npm run seed` is idempotent in the sense that it clears ShopSphere collections first, then recreates demo data:

- 6 categories: Electronics, Fashion, Home & Kitchen, Books, Sports, Accessories
- 35 products with two local images each (`backend/uploads/seed/`)
- 4 users: 1 administrator and 3 customers
- 12 orders across Pending, Processing, Shipped, Delivered and Cancelled states
- 10 reviews with ratings and verified-purchase flags
- Wishlist and cart demo entries

Product images are committed under `backend/uploads/seed/`, so the demo works without external image hosting. User-uploaded images go to `backend/uploads/products/` and are gitignored.

---

## Available scripts

From the repository root:

| Command | Description |
| --- | --- |
| `npm run install:all` | Install backend and frontend dependencies. |
| `npm run dev` | Run the API and Vite dev server together. |
| `npm run dev:backend` | Run only the API with Nodemon. |
| `npm run dev:frontend` | Run only the Vite dev server. |
| `npm run seed` | Reset and seed the database. |
| `npm run build` | Build the frontend for production. |
| `npm start` | Start the API without Nodemon. |
| `npm test` | Run the backend API test suite. |
| `npm run test:e2e` | Run the Playwright end-to-end suite. |

From `backend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon. |
| `npm start` | Start the API with Node. |
| `npm run seed` | Seed the database. |
| `npm run memory-db` | Start an ephemeral MongoDB on port 27017. |
| `npm test` | Run 15 Supertest API tests. |

From `frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm run test:e2e` | Run Playwright (17 tests). |

---

## Testing

### Backend API tests

```bash
npm test
```

The suite starts an isolated in-memory MongoDB and covers 15 areas: health, auth, profile/password, product filtering, admin authorization, cart stock rules, coupons, checkout totals and stock decrement, order history and admin transitions, duplicate-review prevention, cancellation and stock restoration, wishlist flows, product CRUD, user management and dashboard statistics.

### End-to-end tests

Playwright tests run against an already-running stack (API on `5000`, Vite on `5173`) with seeded data. They are not started by Playwright's `webServer` option.

```bash
# 1. Start MongoDB, the API and the frontend
npm run dev

# 2. Install the browser once
npx playwright install chromium

# 3. Run the suite
npm run test:e2e
```

Coverage (17 tests):

- **Storefront:** home sections, catalogue search/filter/sort/pagination, product gallery, guest wishlist redirect, guest add-to-cart, 404.
- **Authentication:** invalid credentials, protected-route redirect and return, login/logout, registration, customer denial on `/admin`.
- **Shopping:** online payment with coupon, tracking and cancellation; COD order with status filters, buy-again and clear-cart confirmation; wishlist move-to-cart.
- **Admin:** live dashboard, product CRUD and stock, category create/delete protection, order fulfilment transitions, user role/block management and self-protection.

Reports are written to `frontend/playwright-report/`; traces, screenshots and videos on failure go to `frontend/test-results/`. Both are gitignored.

> The E2E suite performs several logins. Rate limits are per IP and stored in memory. If you run the suite repeatedly, restart the API to reset the counters, or raise `AUTH_RATE_LIMIT_MAX` / `REGISTER_RATE_LIMIT_MAX` in `backend/.env`.

---

## Project structure

```text
shopsphere/
├── backend/
│   ├── config/db.js                 # Mongoose connection + optional memory DB
│   ├── controllers/                 # Request handlers for every resource
│   ├── middleware/                  # auth, admin, errors, validation, uploads, limits, sanitisation
│   ├── models/                      # User, Product, Category, Order, Review, Cart, Wishlist
│   ├── routes/                      # Express routers mounted under /api
│   ├── scripts/start-memory-db.js   # Ephemeral MongoDB for demos/CI
│   ├── tests/api.test.js            # 15 Supertest integration tests
│   ├── uploads/seed/                # Committed demo product images
│   ├── utils/                       # ApiError, coupons, JWT helper, slugify, async wrapper
│   ├── app.js                       # Express app and middleware pipeline
│   ├── server.js                    # Database connection + HTTP server
│   ├── seed.js                      # Demo data reset/seed script
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/                      # Static assets (logo, placeholder)
│   ├── src/
│   │   ├── components/              # Shared UI (navbar, cards, modals, states, chart…)
│   │   ├── context/                 # Auth, Cart and Wishlist providers
│   │   ├── hooks/                   # Debounce, body-scroll lock, scroll-to-top
│   │   ├── layouts/                 # Storefront and admin shells
│   │   ├── pages/                   # Customer pages
│   │   ├── pages/admin/             # Admin dashboard and management pages
│   │   ├── services/                # Axios API clients per resource
│   │   ├── utils/                   # Formatting, image helpers, constants
│   │   ├── App.jsx                  # Route tree and providers
│   │   ├── main.jsx
│   │   └── index.css                # Tailwind layers and design tokens
│   ├── tests/e2e/                   # Playwright specs and helpers
│   ├── playwright.config.js
│   ├── vite.config.js               # /api and /uploads dev proxy
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── API.md                       # Full endpoint reference
│   └── SCHEMA.md                    # Collections, relationships and indexes
├── docker-compose.yml               # MongoDB 7 service
├── package.json                     # Root convenience scripts
└── README.md
```

---

## Data model

Seven collections are used. See [`docs/SCHEMA.md`](docs/SCHEMA.md) for full field lists, indexes and lifecycle rules.

| Model | Purpose | Key relationships |
| --- | --- | --- |
| `User` | Customers and administrators, hashed passwords, role, block state, saved address | Referenced by orders, reviews, cart, wishlist |
| `Category` | Catalogue grouping with unique name/slug | One category → many products |
| `Product` | Price, discount, stock, images, ratings, flags, sold count | Belongs to a category; referenced by carts, wishlists, orders, reviews |
| `Order` | Immutable item snapshots, address, payment, totals, status timeline | Belongs to a user; items reference products |
| `Review` | Rating, title, comment, verified-purchase flag | One per user per product (unique compound index) |
| `Cart` | One persistent cart per user with product/quantity items | Belongs to a user |
| `Wishlist` | One wishlist per user with product references | Belongs to a user |

Order items store a snapshot of name, image and unit price, so later catalogue edits do not rewrite historical orders.

---

## API overview

Full request/response documentation is in [`docs/API.md`](docs/API.md).

Base URL: `http://localhost:5000/api`

Authentication uses a bearer token:

```http
Authorization: Bearer <jwt>
```

Responses use a consistent envelope with a `success` flag plus the resource key(s) for that endpoint:

```json
{ "success": true, "products": [], "page": 1, "pages": 3, "total": 35 }
```

Errors return an appropriate HTTP status and:

```json
{ "success": false, "message": "Human-readable explanation" }
```

Validation errors may include an `errors` array.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`, `POST /auth/logout` |
| Products | `GET /products`, `GET /products/meta/filters`, `GET /products/:id`, `GET /products/:id/related`, `GET /products/:productId/reviews`, `POST /products/:productId/reviews`, admin create/update/stock/delete |
| Categories | `GET /categories`, `GET /categories/:id`, admin create/update/delete |
| Cart | `GET /cart`, `POST /cart`, `POST /cart/merge`, `PUT /cart/:productId`, `DELETE /cart/:productId`, `DELETE /cart` |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`, `POST /wishlist/:productId/move-to-cart` |
| Orders | `POST /orders`, `GET /orders/my`, `GET /orders/:id`, `PUT /orders/:id/cancel` |
| Reviews | `PUT /reviews/:id`, `DELETE /reviews/:id` |
| Coupons | `GET /coupons`, `POST /coupons/validate` |
| Uploads | `POST /uploads` (admin, multipart field `images`, max 6 files × 5 MB) |
| Admin | `GET /admin/stats`, users list/detail/block/role, orders list/status |

---

## Business rules

### Pricing and shipping

- Selling price is `discountPrice` when present and lower than `price`, otherwise `price`.
- Orders above **₹999** ship free; otherwise delivery is **₹49**.
- All totals are recalculated on the server at checkout. Client-supplied prices are ignored.

### Coupons

| Code | Benefit | Minimum subtotal |
| --- | --- | --- |
| `SAVE10` | 10% off, capped at ₹500 | ₹499 |
| `WELCOME100` | ₹100 off | ₹999 |
| `FREESHIP` | Free delivery | ₹499 |

Coupons are defined server-side in `backend/utils/coupons.js`.

### Payments

- `COD`: order is placed with payment status `Pending`.
- `Online`: explicitly simulated (`ShopSphere Pay (simulated)`), marked `Paid` with a `SIM-...` transaction ID. No real payment gateway is contacted.

### Order status flow

```text
Pending → Processing → Shipped → Delivered
   │           │
   └───────────┴──→ Cancelled
```

- Customers may cancel only `Pending` or `Processing` orders.
- Administrators may cancel `Pending` or `Processing` orders.
- `Delivered` and `Cancelled` are terminal.
- Cancelling restores product stock and reverses `soldCount`; paid orders become `Refunded`.
- Every transition appends to the order's `statusHistory`.

### Stock

- Adding to cart validates available stock.
- Checkout reserves stock with an atomic conditional `findOneAndUpdate` per item, preventing overselling under concurrency.
- If any reservation fails, previously reserved quantities are rolled back.

---

## Security

- Passwords are hashed with bcrypt (cost 12) and never returned by the API.
- JWTs are signed with `JWT_SECRET`; protected routes validate the token and load the current user.
- Admin routes require both authentication and the `admin` role on the server.
- Request bodies are validated with express-validator.
- Mongo operator injection is sanitised before controllers run.
- CORS uses an explicit origin allow-list (with localhost exceptions only outside production).
- Helmet sets security headers; responses are compressed.
- Rate limits cover login, registration and the API as a whole.
- Uploads are restricted by MIME type, extension and size (6 files, 5 MB each; JPG/PNG/WEBP/GIF).
- Blocked accounts are rejected at authentication time.
- Order, cart, wishlist and review queries are scoped to the authenticated user unless the caller is an administrator.
- No production credentials are hardcoded; the seed script requires explicit admin credentials when `NODE_ENV=production`.

---

## Admin setup

1. Seed the database: `npm run seed`.
2. Sign in at `/login` with the administrator account.
3. You are redirected to `/admin`.

The seeded administrator is intended for local development only. To create your own:

```env
# backend/.env
SEED_ADMIN_NAME=Your Name
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=<a strong unique password>
```

Then run `npm run seed`. Alternatively, register a normal account and promote it from **Admin → Customers → View → Account role** using an existing administrator.

Admin capabilities are available at:

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard |
| `/admin/products` | Product CRUD, images and stock |
| `/admin/categories` | Category CRUD |
| `/admin/orders` | Order search, inspection and fulfilment |
| `/admin/users` | Customer search, roles and blocking |

---

## Deployment notes

### Backend

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, the production `MONGODB_URI` and the deployed frontend origin in `CLIENT_URL`.
- Run `npm start` (or a process manager such as PM2) behind HTTPS.
- Persist `backend/uploads/` on a volume, or move uploads to object storage.
- Set `API_URL` to the public API origin so relative image paths resolve correctly.

### Frontend

- Build with `npm run build`; deploy `frontend/dist/` to any static host.
- Set `VITE_API_URL` and `VITE_API_ORIGIN` at build time if the API is on a different origin.
- Configure the host to rewrite unknown routes to `index.html` (SPA routing).

### Database

- Use MongoDB Atlas or a managed MongoDB instance with backups.
- Create indexes by starting the API once; Mongoose declares them at model load.
- Do not run the seed script against production unless you intend to reset the demo data.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `MONGODB_URI is not configured` | Copy `backend/.env.example` to `backend/.env`. |
| `ECONNREFUSED 127.0.0.1:27017` | Start MongoDB, Docker Mongo, or `npm run memory-db --prefix backend`. |
| Login works but cart does not update | Make sure the API is running and `CLIENT_URL` includes the frontend origin. |
| Images 404 | Confirm `backend/uploads/seed/` exists and the API serves `/uploads`. |
| `Too many authentication attempts` | Wait 15 minutes, restart the API, or raise `AUTH_RATE_LIMIT_MAX`. |
| Playwright cannot launch Chromium | Run `npx playwright install chromium` in `frontend/`. |
| E2E tests cannot find seeded products | Run `npm run seed` and keep the same database running. |
| Admin route redirects to home | The signed-in account must have the `admin` role. |

---

## License

MIT
