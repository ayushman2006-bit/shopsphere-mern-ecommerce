# ShopSphere — Project Explanation

This document explains the complete project in simple language. It is written so that you can confidently explain every major page, collection, route and function during a viva.

---

## 1. Project Overview

**ShopSphere** is a simple online shopping website built with the MERN stack. It has two types of users:

1. **Customer** — can browse products, search, register, log in, add items to a cart and place orders.
2. **Admin** — can add, edit and delete products, view all customer orders and update order statuses.

The goal of the project is to demonstrate a complete three-tier web application:

- A **React frontend** for the user interface
- An **Express/Node backend** for business logic and REST APIs
- A **MongoDB database** for storing users, products and orders

The project deliberately avoids advanced patterns such as Redux, TypeScript, microservices or payment gateways. Every file has a clear purpose and the code is kept beginner-friendly.

### Main pages

| Page | Route | What it does |
|---|---|---|
| Home | `/` | Hero section, categories and featured products |
| Products | `/products` | Full catalogue with search and category filter |
| Product Details | `/products/:id` | One product with quantity and Add to Cart |
| Cart | `/cart` | Cart items, quantity controls, total and Place Order |
| Login | `/login` | Email/password login |
| Register | `/register` | Create a customer account |
| My Orders | `/orders` | The logged-in customer's order history |
| Admin | `/admin` | Product management, order management and stats |
| Not Found | `*` | Friendly 404 page |

---

## 2. MERN Architecture

MERN stands for **MongoDB, Express, React and Node.js**.

```text
┌──────────────────────────────┐
│  Browser (React + Vite)      │
│  Pages, components, CSS      │
│  AuthContext, CartContext    │
└──────────────┬───────────────┘
               │ Axios HTTP requests (JSON)
               │ /api/...  +  JWT in Authorization header
               ▼
┌──────────────────────────────┐
│  Express.js API (Node.js)    │
│  Routes → middleware → logic │
│  JWT check, bcrypt, stock    │
└──────────────┬───────────────┘
               │ Mongoose models
               ▼
┌──────────────────────────────┐
│  MongoDB                     │
│  users, products, orders     │
└──────────────────────────────┘
```

### What each part does

- **MongoDB** stores the data as documents (JSON-like objects).
- **Mongoose** is the library that connects Node.js to MongoDB and defines the shape of each document (the models).
- **Express** receives HTTP requests, runs middleware and returns JSON responses.
- **React** displays the UI and sends requests with Axios.
- **Node.js** is the runtime that executes the backend JavaScript.

### Why this is a three-tier architecture

1. **Presentation tier** — React frontend
2. **Application tier** — Express backend
3. **Data tier** — MongoDB

The frontend never talks to MongoDB directly. It only calls the Express API. This keeps the database safe and lets the backend validate prices, stock and permissions.

---

## 3. Folder Structure

```text
shopsphere/
├── backend/
│   ├── config/db.js
│   ├── middleware/authMiddleware.js
│   ├── models/User.js
│   ├── models/Product.js
│   ├── models/Order.js
│   ├── routes/authRoutes.js
│   ├── routes/productRoutes.js
│   ├── routes/orderRoutes.js
│   ├── scripts/start-memory-db.js
│   ├── uploads/seed/*.jpg
│   ├── seed.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
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
│   │   ├── utils/format.js
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── PROJECT_EXPLANATION.md
├── README.md
├── docker-compose.yml
└── package.json
```

### Backend file responsibilities

| File | Responsibility |
|---|---|
| `server.js` | Creates the Express app, enables CORS/JSON, connects routes and starts the server |
| `config/db.js` | Connects Mongoose to MongoDB |
| `models/User.js` | User schema, bcrypt hashing, password comparison |
| `models/Product.js` | Product schema |
| `models/Order.js` | Order schema with an array of ordered products |
| `middleware/authMiddleware.js` | `protect` (logged in) and `adminOnly` (admin role) |
| `routes/authRoutes.js` | Register, login and current-user APIs |
| `routes/productRoutes.js` | Product listing, search, details and admin CRUD |
| `routes/orderRoutes.js` | Place order, my orders, all orders and status update |
| `seed.js` | Fills the database with demo users, products and one order |

### Frontend file responsibilities

| File | Responsibility |
|---|---|
| `main.jsx` | Mounts React and wraps the app in providers and the router |
| `App.jsx` | Defines all page routes and the shared navbar/footer |
| `api.js` | One Axios instance with the JWT header interceptor |
| `AuthContext.jsx` | Keeps the logged-in user and token |
| `CartContext.jsx` | Keeps cart items and saves them in localStorage |
| `components/` | Reusable UI pieces (navbar, footer, product card, route guards) |
| `pages/` | One component for each screen |
| `index.css` | All styling (plain CSS, no Tailwind) |

---

## 4. Database Collections

The project uses exactly **three collections**.

### 4.1 Users

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Automatically created by MongoDB |
| `name` | String | Required |
| `email` | String | Required, unique, lowercase |
| `password` | String | Required, hashed with bcrypt |
| `role` | String | `"user"` or `"admin"`, default `"user"` |
| `createdAt` / `updatedAt` | Date | Added by `timestamps: true` |

Example document:

```json
{
  "_id": "6710f0c2b5a4c31d2c9b1111",
  "name": "Demo Customer",
  "email": "customer@shopsphere.com",
  "password": "$2a$10$hashed-password...",
  "role": "user",
  "createdAt": "2026-10-31T08:00:00.000Z",
  "updatedAt": "2026-10-31T08:00:00.000Z"
}
```

**Important:** the password is never sent to the frontend. The schema's `toJSON` transform deletes it.

### 4.2 Products

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Required |
| `description` | String | Required |
| `price` | Number | Required, cannot be negative |
| `image` | String | URL or `/uploads/seed/...` path |
| `category` | String | Required, e.g. Electronics |
| `stock` | Number | Required, cannot be negative |
| `createdAt` / `updatedAt` | Date | Added automatically |

Example document:

```json
{
  "_id": "6710f0c2b5a4c31d2c9b2222",
  "name": "Aurora Wireless Headphones",
  "description": "Comfortable over-ear headphones...",
  "price": 2499,
  "image": "/uploads/seed/p01-1.jpg",
  "category": "Electronics",
  "stock": 25,
  "createdAt": "2026-10-31T08:00:00.000Z",
  "updatedAt": "2026-10-31T08:00:00.000Z"
}
```

### 4.3 Orders

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | References the `User` who placed the order |
| `products` | Array | Snapshot of ordered items |
| `products[].productId` | ObjectId | References `Product` |
| `products[].name` | String | Product name at the time of ordering |
| `products[].price` | Number | Price at the time of ordering |
| `products[].quantity` | Number | How many were bought |
| `products[].image` | String | Image path |
| `totalAmount` | Number | Calculated on the server |
| `orderDate` | Date | Defaults to the current date |
| `status` | String | `Pending`, `Shipped`, `Delivered` or `Cancelled` |

Example document:

```json
{
  "_id": "6710f0c2b5a4c31d2c9b3333",
  "userId": "6710f0c2b5a4c31d2c9b1111",
  "products": [
    {
      "productId": "6710f0c2b5a4c31d2c9b2222",
      "name": "Aurora Wireless Headphones",
      "price": 2499,
      "quantity": 1,
      "image": "/uploads/seed/p01-1.jpg"
    }
  ],
  "totalAmount": 2499,
  "orderDate": "2026-10-31T09:30:00.000Z",
  "status": "Pending"
}
```

### Why order products store a copy of name and price

If the admin later changes a product's price or deletes the product, the old order must still show what the customer actually paid. That is why each order item stores `name`, `price` and `image` as a snapshot.

### Relationships

```text
User 1 ───── many Order
Order many ───── many Product (through order.products)
```

`Order.userId` is a reference to `User`. In the admin API, `populate('userId', 'name email')` replaces the id with the customer's name and email.

---

## 5. How Frontend Communicates with Backend

### Step 1 — Axios instance

`frontend/src/api.js` creates one Axios object:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
```

During development, `baseURL` is `/api`. Vite forwards `/api` to `http://localhost:5000` using the proxy in `vite.config.js`:

```js
server: {
  port: 5173,
  proxy: {
    '/api': 'http://localhost:5000',
    '/uploads': 'http://localhost:5000',
  },
}
```

This avoids CORS problems during development and also lets product images load from the backend.

### Step 2 — Attach the JWT

An Axios interceptor runs before every request:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Step 3 — A page makes a request

Example from `Products.jsx`:

```js
api.get('/products', { params: { search, category } })
  .then((response) => setProducts(response.data))
  .catch(() => setError('Could not load products.'));
```

### Step 4 — The backend responds with JSON

```json
[
  {
    "_id": "6710...",
    "name": "Aurora Wireless Headphones",
    "price": 2499,
    "category": "Electronics",
    "stock": 25
  }
]
```

React stores the array in state and renders one `ProductCard` per product.

### Request/response cycle in one line

```text
React event → Axios request → Express route → Mongoose query → MongoDB
            ← JSON response ← res.json() ← query result ←
```

---

## 6. Important API Routes

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Route | Body | Access | Result |
|---|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Public | Creates a user and returns `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | Public | Checks the password and returns `{ token, user }` |
| GET | `/auth/me` | — | Logged in | Returns the user belonging to the token |

### Products

| Method | Route | Body / Query | Access | Result |
|---|---|---|---|---|
| GET | `/products` | `?search=`, `?category=` | Public | Array of products |
| GET | `/products/categories` | — | Public | Array of category names |
| GET | `/products/:id` | — | Public | One product |
| POST | `/products` | Product fields | Admin | Creates a product |
| PUT | `/products/:id` | Product fields | Admin | Updates a product |
| DELETE | `/products/:id` | — | Admin | Deletes a product |

### Orders

| Method | Route | Body | Access | Result |
|---|---|---|---|---|
| POST | `/orders` | `{ items: [{ productId, quantity }] }` | Logged in | Creates an order |
| GET | `/orders/my` | — | Logged in | Current user's orders |
| GET | `/orders` | — | Admin | All orders with customer info |
| PUT | `/orders/:id/status` | `{ status }` | Admin | Updates the status |

### Example request

```http
POST /api/orders
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "items": [
    { "productId": "6710...", "quantity": 2 },
    { "productId": "6711...", "quantity": 1 }
  ]
}
```

### Example response

```json
{
  "_id": "6712...",
  "userId": "6710...",
  "products": [
    { "productId": "6710...", "name": "Headphones", "price": 2499, "quantity": 2 }
  ],
  "totalAmount": 4998,
  "status": "Pending",
  "orderDate": "2026-10-31T09:30:00.000Z"
}
```

---

## 7. How Login Works

### Registration

1. The user fills the register form (`Register.jsx`).
2. React sends `POST /api/auth/register` with name, email and password.
3. `authRoutes.js` checks that all fields exist and the password is at least 6 characters.
4. It checks whether the email is already used.
5. `User.create()` saves the user. Before saving, the Mongoose `pre('save')` hook hashes the password:

```js
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

6. The backend creates a JWT with `jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
7. It returns `{ token, user }`. The password is removed by the schema's `toJSON` transform.

### Login

1. React sends `POST /api/auth/login` with email and password.
2. The backend finds the user by email.
3. `user.matchPassword(password)` calls `bcrypt.compare()`:

```js
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
```

4. If the password is wrong, the API returns `401 Invalid email or password`.
5. If it is correct, the API returns a new JWT and the user object.

### What the frontend stores

`AuthContext.login()` saves:

```js
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

and updates React state:

```js
setUser(user);
```

### How protected routes work

The frontend uses `ProtectedRoute` and `AdminRoute` to hide pages:

```jsx
if (!user) return <Navigate to="/login" replace />;
if (user.role !== 'admin') return <Navigate to="/" replace />;
```

The backend also checks every protected request — the frontend guard alone is not security.

`protect` middleware:

```js
const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id);
```

`adminOnly` middleware:

```js
if (req.user && req.user.role === 'admin') return next();
res.status(403).json({ message: 'Admin access only' });
```

### Why JWT is called "stateless"

The server does not store sessions. The token itself proves who the user is. Logging out only removes the token from the browser.

### Page refresh

On refresh, `AuthContext` reads the saved token and calls `GET /api/auth/me`. If the token is valid, the user stays logged in. If it is expired or invalid, the token is removed.

---

## 8. How Adding to Cart Works

The cart is **not stored in MongoDB**. It is stored in React state and `localStorage`, because a cart is temporary and does not need a database collection.

### Cart state

`CartContext.jsx` creates:

```js
const [cartItems, setCartItems] = useState(() => {
  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : [];
});
```

Every change is saved:

```js
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cartItems));
}, [cartItems]);
```

### Add to cart

When the user clicks **Add to Cart** on a product card or details page:

```js
addToCart(product, quantity);
```

`addToCart`:

1. Looks for the product in the cart by `_id`.
2. If it exists, increases the quantity (but never above `stock`).
3. If it does not exist, adds a new object:

```js
{
  _id, name, price, image, stock, quantity
}
```

Only the fields needed for display are stored. The backend will re-check the real price and stock when the order is placed.

### Quantity controls

- `increaseQuantity(id)` adds 1, capped at `item.stock`.
- `decreaseQuantity(id)` removes 1, and removes the item if the quantity reaches 0.
- `removeFromCart(id)` removes the item completely.
- `clearCart()` empties the cart after a successful order.

### Total price

```js
const totalPrice = cartItems.reduce(
  (total, item) => total + item.price * item.quantity,
  0
);
```

The cart badge in the navbar shows `totalItems`, which is the sum of all quantities.

### Why the cart survives refresh

`localStorage` is part of the browser. Even if the user refreshes or closes the tab, the cart JSON remains until it is cleared.

---

## 9. How an Order Is Placed

### Step 1 — Customer clicks Place Order

`Cart.jsx` checks whether the user is logged in. If not, it redirects to `/login?redirect=/cart`. After login, the user returns to the cart.

### Step 2 — Frontend sends only ids and quantities

```js
await api.post('/orders', {
  items: cartItems.map((item) => ({
    productId: item._id,
    quantity: item.quantity,
  })),
});
```

The browser does **not** send the total. This prevents a user from changing the price in developer tools.

### Step 3 — Backend recalculates everything

`POST /api/orders` in `orderRoutes.js`:

1. Requires a valid JWT (`protect`).
2. Checks that `items` is a non-empty array.
3. For every item:
   - Finds the product in MongoDB.
   - Checks that the quantity is a positive whole number.
   - Checks that enough stock is available.
   - Adds `product.price * quantity` to `totalAmount`.
   - Stores a snapshot of the product (id, name, price, quantity, image).
4. Reduces stock with `$inc: { stock: -quantity }`.
5. Creates the order:

```js
const order = await Order.create({
  userId: req.user._id,
  products: orderProducts,
  totalAmount,
});
```

6. Returns `201` with the saved order.

### Step 4 — Frontend clears the cart and redirects

```js
clearCart();
navigate('/orders', { state: { message: 'Order placed successfully!' } });
```

### Step 5 — My Orders page

`GET /api/orders/my` returns only orders where `userId` equals the logged-in user's id:

```js
Order.find({ userId: req.user._id }).sort({ orderDate: -1 });
```

The page displays the order id, date, items, total and status badge.

### Step 6 — Admin updates the status

In the admin dashboard, the status dropdown calls:

```js
api.put(`/orders/${orderId}/status`, { status });
```

The backend allows only:

```text
Pending → Shipped → Delivered
Pending → Cancelled
```

The dropdown can set any of the four valid statuses. The model's `enum` rejects anything else.

### Stock safety

The server checks stock before saving the order, so a customer cannot order more than is available. If two customers order at the same moment, a real store would use a database transaction; this learning project keeps the logic simple with a check followed by an update.

---

## 10. How to Run the Project

### Prerequisites

- Node.js 18+
- npm
- MongoDB (local, Docker or Atlas), **or** the included in-memory option

### First-time setup

```bash
cd shopsphere

# Backend
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
npm install
npm run seed
npm run dev
```

The backend runs at **http://localhost:5000**.

```bash
# In a second terminal
cd shopsphere/frontend
npm install
npm run dev
```

The website runs at **http://localhost:5173**.

### If MongoDB is not installed

Open a third terminal:

```bash
cd shopsphere/backend
npm run memory-db
```

Then run the seed and backend commands as usual. This starts a temporary MongoDB on port `27017`. Data disappears when the terminal is closed.

### If MongoDB is installed locally

Make sure the MongoDB service is running, then use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shopsphere
```

### If using Docker

```bash
cd shopsphere
docker compose up -d
```

### If using MongoDB Atlas

Create a free cluster, copy the connection string and put it in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopsphere
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopsphere.com` | `Admin@12345` |
| Customer | `customer@shopsphere.com` | `Customer@123` |

### Useful commands

| Command | Where | Purpose |
|---|---|---|
| `npm run seed` | `backend/` | Reset and fill the database |
| `npm run dev` | `backend/` | Start the API with Nodemon |
| `npm start` | `backend/` | Start the API normally |
| `npm run memory-db` | `backend/` | Start temporary MongoDB |
| `npm run dev` | `frontend/` | Start React with Vite |
| `npm run build` | `frontend/` | Build for production |

### Quick test after starting

1. Open `http://localhost:5173`.
2. Click **Products** and search for "Headphones".
3. Open a product and click **Add to Cart**.
4. Open the cart and click **Login to Place Order**.
5. Log in as the customer and place the order.
6. Open **My Orders** to see it.
7. Log out and log in as the admin.
8. Open **Admin** to add a product or update an order status.

---

## Quick Viva Answers

**Why did you use MongoDB?**
Because products, users and orders are naturally document-shaped, and MongoDB works well with JavaScript and Mongoose.

**Why three collections?**
The assignment requires Users, Products and Orders. Categories are a field on Product, and the cart is temporary browser state, so they do not need separate collections.

**Where is the cart stored?**
In React Context and `localStorage`. It is sent to the backend only when an order is placed.

**How are passwords protected?**
They are hashed with bcrypt in a Mongoose `pre('save')` hook. The original password is never stored.

**How does the backend know who is logged in?**
The frontend sends a JWT in the `Authorization: Bearer <token>` header. The `protect` middleware verifies it and loads the user.

**How do you prevent a customer from opening the admin page?**
Two layers: `AdminRoute` hides the page in React, and `adminOnly` middleware checks the role on the server. The server check is the real security.

**How is the order total calculated?**
On the server, using the current product prices from MongoDB. The frontend only sends product ids and quantities.

**What happens to stock after an order?**
The backend checks stock, then reduces it with `$inc: { stock: -quantity }`.

**What happens if a product is deleted later?**
The order keeps its own copy of the product name, price and image, so the order history still displays correctly.

**Why is there no payment gateway?**
The assignment only requires order placement. Payments are intentionally out of scope.

---

## Summary

ShopSphere demonstrates a complete, understandable MERN workflow:

```text
Register/Login → JWT → Browse products → Add to cart
→ Place order → Server validates price + stock
→ Order saved in MongoDB → Customer sees order → Admin updates status
```

Every major function is small enough to read in one sitting, and every database collection has a clear purpose.
