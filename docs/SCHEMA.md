# ShopSphere data model

ShopSphere uses seven MongoDB collections through Mongoose. This document explains each collection, its relationships, indexes and the rules that keep the data consistent.

## Entity relationships

```text
User ──< Order >── Product >── Category
 │        │
 │        └── orderItems[] (snapshot of product name/image/price)
 │
 ├──< Review >── Product      (unique: one review per user per product)
 ├──1 Cart >── Product
 └──1 Wishlist >── Product
```

- A **User** has at most one **Cart** and one **Wishlist**.
- A **Category** has many **Products**.
- An **Order** belongs to a User and contains item snapshots that reference Products.
- A **Review** belongs to a User and a Product; the pair is unique.

All collections use Mongoose timestamps (`createdAt`, `updatedAt`) unless noted.

---

## User

`backend/models/User.js`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | Required, trimmed, 2–80 characters. |
| `email` | String | Required, unique, lowercase, trimmed, valid email format. |
| `password` | String | Required, minimum 6 characters, `select: false`, hashed by a `pre('save')` hook with bcrypt cost 12. |
| `phone` | String | Optional, max 20 characters. |
| `address` | Address subdocument | Optional saved shipping address. |
| `role` | String | `customer` or `admin`; defaults to `customer`. |
| `isBlocked` | Boolean | Defaults to `false`; blocked users cannot log in. |
| `lastLoginAt` | Date | Updated on successful login. |

**Address subdocument:** `fullName`, `phone`, `street`, `city`, `state`, `postalCode`, `country` (default `India`). `_id` is disabled.

**Methods and serialisation:**

- `comparePassword(candidate)` uses bcrypt comparison.
- `toJSON` removes `password` and `__v`.
- Passwords are never included in API responses.

**Indexes:** unique `email`, `role`.

---

## Category

`backend/models/Category.js`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | Required, unique, trimmed, max 80 characters. |
| `slug` | String | Unique, generated from the name. |
| `description` | String | Optional, max 500 characters. |
| `image` | String | Optional image path or URL. |

**Behaviour:** the slug is generated in a `pre('validate')` hook. A category cannot be deleted while products reference it; the API returns `409`.

**Indexes:** unique `name`, unique `slug`.

---

## Product

`backend/models/Product.js`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | Required, trimmed, max 160 characters. |
| `slug` | String | Unique, generated from the name; suffixes are added on collision. |
| `description` | String | Required, max 5000 characters. |
| `shortDescription` | String | Optional, max 300 characters. |
| `price` | Number | Required, non-negative. |
| `discountPrice` | Number | Optional, non-negative; cleared when greater than or equal to `price`. |
| `finalPrice` | Number | Derived selling price (`discountPrice ?? price`), indexed. |
| `images` | [String] | At least one image required. |
| `category` | ObjectId → Category | Required, indexed. |
| `brand` | String | Defaults to `ShopSphere`, max 80 characters. |
| `stock` | Number | Required, whole number, non-negative, default 0. |
| `ratings` | Number | Average rating, 0–5, default 0. |
| `numReviews` | Number | Review count, default 0. |
| `highlights` | [String] | Up to 200 characters each. |
| `isFeatured` | Boolean | Default `false`. |
| `isTrending` | Boolean | Default `false`. |
| `soldCount` | Number | Incremented on purchase, decremented on cancellation. |

**Virtual:** `discountPercent` = rounded percentage off when a valid discount price exists.

**Derived fields:** a `pre('validate')` hook sets `slug`, clears invalid discounts and sets `finalPrice`.

**Indexes:**

- Unique `slug`
- Text index on `name`, `description`, `brand`
- Compound `{ category, finalPrice }`
- `createdAt`
- `finalPrice`

**Image storage:** seed images live in `backend/uploads/seed/` and are committed. Admin uploads are written to `backend/uploads/products/` and served from `/uploads/...`.

---

## Order

`backend/models/Order.js`

| Field | Type | Rules |
| --- | --- | --- |
| `orderNumber` | String | Unique, generated as `SS-YYYYMMDD-XXXXXX`. |
| `user` | ObjectId → User | Required, indexed. |
| `orderItems` | [OrderItem] | At least one item. |
| `shippingAddress` | Address subdocument | All fields required except `country`, which defaults to `India`. |
| `paymentMethod` | String | `COD` or `Online`. |
| `paymentStatus` | String | `Pending`, `Paid`, `Refunded`, `Failed`; default `Pending`. |
| `paymentResult` | Object | `transactionId`, `provider`, `paidAt` for online payments. |
| `itemsPrice` | Number | Sum of item snapshots before discount/shipping. |
| `discountAmount` | Number | Coupon discount, default 0. |
| `shippingPrice` | Number | 0 or 49 depending on subtotal/coupon. |
| `totalPrice` | Number | Server-calculated grand total. |
| `couponCode` | String | Applied code, or empty. |
| `orderStatus` | String | `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`; default `Pending`, indexed. |
| `statusHistory` | [StatusEntry] | `status`, `date`, `note`. |
| `cancelReason` | String | Up to 300 characters. |
| `deliveredAt` | Date | Set when delivered. |
| `cancelledAt` | Date | Set when cancelled. |

**OrderItem subdocument** (`_id: false`):

| Field | Type | Notes |
| --- | --- | --- |
| `product` | ObjectId → Product | Reference for stock restoration. |
| `name` | String | Snapshot at purchase time. |
| `image` | String | Snapshot at purchase time. |
| `price` | Number | Unit price snapshot. |
| `quantity` | Number | At least 1. |

Snapshots mean historical orders remain accurate if a product is renamed, repriced or deleted.

**Indexes:** unique `orderNumber`, `user`, `orderStatus`, `{ user, createdAt }`, `createdAt`.

**Status transitions:**

```text
Pending → Processing → Shipped → Delivered
   │           │
   └───────────┴──→ Cancelled
```

`Delivered` and `Cancelled` are terminal. Cancellation restores stock, reverses `soldCount`, refunds paid orders and appends history.

---

## Review

`backend/models/Review.js`

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → User | Required, indexed. |
| `product` | ObjectId → Product | Required, indexed. |
| `rating` | Number | Required, 1–5. |
| `title` | String | Optional, max 120 characters. |
| `comment` | String | Required, trimmed, 3–1000 characters. |
| `isVerifiedPurchase` | Boolean | Set when the user has an order containing the product in `Processing`, `Shipped` or `Delivered` state. |

**Indexes:**

- Unique compound `{ user, product }` — enforces one review per customer per product.
- `{ product, createdAt }`

**Rating recalculation:** after create, update or delete, the product's `ratings` (average) and `numReviews` (count) are recomputed from the review collection.

---

## Cart

`backend/models/Cart.js`

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → User | Required, unique. |
| `items` | [CartItem] | Product reference and quantity. |

**CartItem subdocument** (`_id: false`): `product` (ObjectId → Product, required) and `quantity` (Number, at least 1).

**Indexes:** unique `user`.

**Rules:**

- One cart per user.
- Adding or updating validates stock and rejects quantities above available stock.
- The API returns populated product data plus computed `totalItems`, `subtotal`, `shippingEstimate` and `freeShippingThreshold`.
- Placing an order reads and clears this cart.

---

## Wishlist

`backend/models/Wishlist.js`

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → User | Required, unique. |
| `products` | [ObjectId → Product] | Saved products. |

**Indexes:** unique `user`.

**Rules:**

- One wishlist per user.
- Adding is idempotent.
- Moving an item to the cart validates stock, removes it from the wishlist and updates the cart in one request.

---

## Derived and non-collection data

| Data | Where it lives | Notes |
| --- | --- | --- |
| Coupons | `backend/utils/coupons.js` | Static server-side definitions: `SAVE10`, `WELCOME100`, `FREESHIP`. Never trusted from the client. |
| Shipping rules | `backend/controllers/order.controller.js` | Free above ₹999, otherwise ₹49. |
| Uploaded images | `backend/uploads/` | Filesystem storage; seed images committed, user uploads ignored by git. |
| Guest cart | Browser `localStorage` | Merged into the server cart after login via `POST /cart/merge`. |
| JWT session | Browser `localStorage` | Key `shopsphere_token`; the server remains stateless. |

---

## Consistency guarantees

1. **Server-side totals.** Checkout recomputes item prices, coupon discount, shipping and grand total from the database.
2. **Atomic stock reservation.** Each item is decremented with a conditional `findOneAndUpdate({ stock: { $gte: quantity } })`. If any item fails, previously reserved quantities are rolled back.
3. **Cancellation restores stock.** Both customer and admin cancellation paths restore quantities and reverse `soldCount`.
4. **Duplicate reviews prevented.** A unique compound index plus an explicit pre-check returns `409`.
5. **Category deletion protected.** The API refuses to delete a category that still has products.
6. **Self-administration protected.** Admins cannot block themselves or change their own role.
7. **Owner-scoped access.** Orders, carts, wishlists and reviews are scoped to the authenticated user unless the caller is an administrator.
