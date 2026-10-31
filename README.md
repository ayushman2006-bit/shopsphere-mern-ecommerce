# ShopSphere — MERN Online Shopping System

A simple, beginner-friendly online shopping website built with the **MERN stack** for a college Software Engineering Laboratory project. Customers can browse products, register, log in, manage a cart and place orders. Admins can add, edit and delete products and manage customer orders.

The code is intentionally small and readable. There are only **three database collections**, **three route files** and **no advanced state-management or UI libraries**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MongoDB + Mongoose |
| Backend | Node.js + Express.js |
| Frontend | React 18 + Vite |
| Styling | Plain CSS (`src/index.css`) |
| HTTP client | Axios |
| Routing | React Router DOM |
| Authentication | JWT + bcryptjs |
| State management | React Context API |

---

## Features

### Customer

- Home page with a hero section, categories and featured products
- Product catalogue with live search and category filter
- Product details page with quantity selection
- Add to cart, remove from cart, increase/decrease quantity
- Cart total calculation and persistent cart (localStorage)
- Register, login and logout
- JWT-protected "My Orders" page
- Place an order and view previous orders with status
- Responsive layout for mobile, tablet and desktop

### Admin

- Separate admin login using role-based authorization
- Dashboard with real counts for products, orders and sales
- Add new products
- Edit existing products (name, price, stock, image, category, description)
- Delete products
- View all customer orders
- Update order status (Pending / Shipped / Delivered / Cancelled)

---

## Folder Structure

```text
shopsphere/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js      # protect + adminOnly
│   ├── models/
│   │   ├── User.js                # name, email, password, role
│   │   ├── Product.js             # name, description, price, image, category, stock
│   │   └── Order.js               # userId, products, totalAmount, orderDate, status
│   ├── routes/
│   │   ├── authRoutes.js          # register, login, me
│   │   ├── productRoutes.js       # product CRUD + search
│   │   └── orderRoutes.js         # place order, my orders, admin orders
│   ├── scripts/
│   │   └── start-memory-db.js     # optional MongoDB for machines without MongoDB
│   ├── uploads/seed/              # 12 demo product images
│   ├── seed.js                    # inserts demo users, products and one order
│   ├── server.js                  # Express entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/                    # favicon + placeholder image
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # logged-in user + token
│   │   │   └── CartContext.jsx    # cart state + localStorage
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── NotFound.jsx
│   │   ├── utils/
│   │   │   └── format.js          # price + date formatting
│   │   ├── api.js                 # Axios instance + JWT header
│   │   ├── App.jsx                # all routes
│   │   ├── index.css              # all styling
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── vite.config.js             # /api proxy to Express
│   ├── .env.example
│   └── package.json
│
├── PROJECT_EXPLANATION.md         # viva / report explanation
├── docker-compose.yml             # optional MongoDB container
├── package.json                   # convenience scripts
└── README.md
```

---

## Requirements

- **Node.js 18 or newer**
- **npm**
- **MongoDB** — one of:
  - MongoDB installed and running locally on port `27017`
  - Docker (`docker compose up -d`)
  - MongoDB Atlas (paste the connection string in `.env`)
  - No MongoDB installed? Use the optional in-memory database (see below)

---

## Installation and Running

Open two terminals from the `shopsphere` folder.

### 1. Backend

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
npm install
npm run seed                # first time only: adds demo data
npm run dev
```

The API runs at **http://localhost:5000**.

Before starting, open `backend/.env` and set:

- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — `http://localhost:5173`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The frontend uses Vite's proxy, so `/api` requests are forwarded to `http://localhost:5000` automatically. No frontend environment variables are needed for local development.

### 3. Optional: run without installing MongoDB

If MongoDB is not installed on your machine, start the included in-memory database in a **third terminal**:

```bash
cd backend
npm run memory-db
```

Then run `npm run seed` and `npm run dev` as usual. The in-memory database uses port `27017`, so the normal `MONGODB_URI` works. **Data is lost when that terminal is closed**, so run `npm run seed` again after restarting it.

### 4. Optional: MongoDB with Docker

From the project root:

```bash
docker compose up -d
```

This starts MongoDB 7 on port `27017` with a persistent volume.

---

## Demo Accounts

Created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopsphere.com` | `Admin@12345` |
| Customer | `customer@shopsphere.com` | `Customer@123` |

The customer account already has one sample order. You can also register a new account from the website; new accounts always get the `user` role.

> These are development/demo credentials only. Change them in `backend/.env` before seeding if you deploy the project.

---

## Available Scripts

### Backend (`cd backend`)

| Command | What it does |
|---|---|
| `npm run dev` | Starts Express with Nodemon (auto-restart) |
| `npm start` | Starts Express normally |
| `npm run seed` | Clears the database and inserts demo data |
| `npm run memory-db` | Starts an optional in-memory MongoDB on port 27017 |

### Frontend (`cd frontend`)

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Previews the production build |

### Project root

| Command | What it does |
|---|---|
| `npm run install:all` | Installs backend and frontend dependencies |
| `npm run seed` | Runs the backend seed script |
| `npm run dev:backend` | Starts the backend |
| `npm run dev:frontend` | Starts the frontend |
| `npm run build` | Builds the frontend |

---

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Check that the API is running |
| POST | `/auth/register` | Public | Create a customer account |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/auth/me` | Logged in | Get the current user from the token |
| GET | `/products` | Public | List products (`?search=`, `?category=`) |
| GET | `/products/categories` | Public | List category names |
| GET | `/products/:id` | Public | Get one product |
| POST | `/products` | Admin | Add a product |
| PUT | `/products/:id` | Admin | Edit a product |
| DELETE | `/products/:id` | Admin | Delete a product |
| POST | `/orders` | Logged in | Place an order |
| GET | `/orders/my` | Logged in | Get the current user's orders |
| GET | `/orders` | Admin | Get all orders |
| PUT | `/orders/:id/status` | Admin | Update an order's status |

Protected routes require this header:

```http
Authorization: Bearer <jwt-token>
```

Full request/response examples are in [`PROJECT_EXPLANATION.md`](./PROJECT_EXPLANATION.md).

---

## How the Main Parts Work

1. **Authentication** — The backend hashes passwords with bcrypt before saving. Login returns a JWT. The frontend stores the token in `localStorage` and Axios attaches it to every request. The `protect` middleware verifies the token, and `adminOnly` checks the user's role.
2. **Cart** — The cart lives in React Context and `localStorage`. It does not need a database collection. The cart is sent to the server only when the user places an order.
3. **Orders** — The browser sends product ids and quantities. The backend reads the real prices from MongoDB, calculates the total, checks stock, reduces stock and saves the order.
4. **Database** — Only three collections are used: `users`, `products` and `orders`.

---

## Testing Performed

The simplified version was tested end-to-end:

- Registration, duplicate email rejection and login with correct/incorrect passwords
- JWT-protected `/auth/me` and `/orders/my`
- Product listing, search and category filtering
- Product add, edit and delete through the admin account
- Customer blocked from admin product routes (403)
- Add to cart, change quantity, remove from cart and total calculation
- Guest checkout redirect to login and return to cart
- Order placement, server-side total, stock reduction and order history
- Admin viewing all orders and updating an order status
- Responsive layout at mobile and desktop widths
- Production frontend build (`npm run build`)

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | Start MongoDB, start `npm run memory-db`, or check `MONGODB_URI` in `backend/.env` |
| `EADDRINUSE` on port 5000 | Stop the other process or change `PORT` in `backend/.env` |
| Frontend shows "Could not load products" | Make sure the backend is running on port 5000 |
| `401 Please log in first` | Log in again; the token may have expired |
| `403 Admin access only` | Log in with the seeded admin account |
| Product images do not appear | Make sure the backend is running so `/uploads` is served, and run `npm run seed` |
| Need a clean database | Run `npm run seed` again (it clears users, products and orders) |
| Port 5173 already in use | Stop the other Vite process |

---

## Limitations

This is a learning project, not a commercial store:

- No payment gateway — orders are recorded directly
- Cart is stored in the browser, not in MongoDB
- No product image upload form — the admin enters an image URL (seed images are included)
- No email verification, password reset or reviews
- No automated test files are included; the app was verified end-to-end during development

For a complete explanation of the architecture, database, routes and code flow, read **[PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md)**.
