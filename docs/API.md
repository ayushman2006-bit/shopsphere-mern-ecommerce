# ShopSphere API reference

Base URL: `http://localhost:5000/api`

All request and response bodies are JSON unless stated otherwise. Upload endpoints use `multipart/form-data`.

## Conventions

### Authentication

Protected endpoints require a bearer token returned by login or registration:

```http
Authorization: Bearer <jwt>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default `7d`). The API is stateless; `POST /auth/logout` is a client-side token discard with a server acknowledgement.

### Success responses

Every successful response includes `success: true` and the relevant resource keys:

```json
{
  "success": true,
  "products": [],
  "page": 1,
  "pages": 3,
  "total": 35,
  "limit": 12
}
```

### Error responses

```json
{
  "success": false,
  "message": "Human-readable explanation"
}
```

Validation failures may also include:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Please enter a valid email" }]
}
```

Common status codes: `400` validation/business rule, `401` missing or invalid token, `403` forbidden/blocked, `404` not found, `409` conflict (duplicate email, stock, duplicate review), `429` rate limited, `500` unexpected error.

### Pagination

Paginated endpoints accept `page` (1-based) and `limit`. Responses include `page`, `pages` and `total`.

### Rate limits

| Scope | Default | Window |
| --- | --- | --- |
| Login | 50 requests per IP | 15 minutes |
| Registration | 20 requests per IP | 1 hour |
| All `/api` routes | 1500 requests per IP | 15 minutes |

Configure with `AUTH_RATE_LIMIT_MAX`, `REGISTER_RATE_LIMIT_MAX` and `API_RATE_LIMIT_MAX`.

---

## Health

### `GET /health`

Public. Returns service status.

```json
{ "success": true, "status": "ok", "service": "ShopSphere API", "timestamp": "2026-01-01T00:00:00.000Z" }
```

---

## Authentication

### `POST /auth/register`

Public. Creates a customer account and returns a token.

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "Secret@123",
  "phone": "9876543210"
}
```

`201` response:

```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Alex Morgan", "email": "alex@example.com", "role": "customer" }
}
```

### `POST /auth/login`

Public. Body: `{ "email": "...", "password": "..." }`.

Returns `{ success, message, token, user }`. Blocked accounts receive `403`.

### `GET /auth/me`

Protected. Returns the current user: `{ success, user }`.

### `PUT /auth/profile`

Protected. Updates name, phone and/or address.

```json
{
  "name": "Alex Morgan",
  "phone": "9876543210",
  "address": {
    "fullName": "Alex Morgan",
    "phone": "9876543210",
    "street": "42 Residency Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India"
  }
}
```

### `PUT /auth/password`

Protected.

```json
{ "currentPassword": "Old@123", "newPassword": "New@12345" }
```

Returns a fresh token and user so the client can keep the session valid.

### `POST /auth/logout`

Protected. Acknowledges logout. The client removes the stored token.

---

## Products

### `GET /products`

Public. Query parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `keyword` | string | Case-insensitive search across name, brand and descriptions. |
| `category` | string | Category id, slug or exact name. |
| `brand` | string | Exact brand match (case-insensitive). |
| `minPrice` / `maxPrice` | number | Bounds on the selling price. |
| `rating` | number | Minimum average rating. |
| `sort` | string | `newest` (default), `price_asc`, `price_desc`, `rating`, `popular`, `name`. |
| `featured` | boolean | Only featured products. |
| `trending` | boolean | Only trending products. |
| `inStock` | boolean | Only products with stock greater than zero. |
| `page` / `limit` | number | Pagination; `limit` is capped at 48 (default 12). |

Response:

```json
{
  "success": true,
  "products": [{ "_id": "...", "name": "...", "finalPrice": 8999, "category": { "name": "Electronics", "slug": "electronics" } }],
  "page": 1,
  "pages": 3,
  "total": 35,
  "limit": 12
}
```

### `GET /products/meta/filters`

Public. Returns available brands and price range:

```json
{ "success": true, "brands": ["Aurora", "Nimbus"], "minPrice": 199, "maxPrice": 84999, "total": 35 }
```

### `GET /products/:id`

Public. `:id` may be a product id or slug. Returns `{ success, product }` with a populated category.

### `GET /products/:id/related`

Public. Returns up to four products from the same category, excluding the current product: `{ success, products }`.

### `GET /products/:productId/reviews`

Public. Query: `page`, `limit`. Returns reviews plus aggregate rating information:

```json
{
  "success": true,
  "reviews": [],
  "averageRating": 4.6,
  "numReviews": 10,
  "distribution": [{ "rating": 5, "count": 7 }],
  "page": 1,
  "pages": 1,
  "total": 10
}
```

### `POST /products/:productId/reviews`

Protected. One review per customer per product.

```json
{ "rating": 5, "title": "Excellent", "comment": "Exactly as described." }
```

Returns `201` with the created review. Duplicate reviews return `409`.

### `POST /products` (admin)

Protected + admin. `multipart/form-data` or JSON.

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | 2–160 characters. |
| `description` | Yes | Up to 5000 characters. |
| `shortDescription` | No | Up to 300 characters. |
| `category` | Yes | Category id, slug or name. |
| `price` | Yes | Non-negative number. |
| `discountPrice` | No | Ignored when greater than or equal to `price`. |
| `stock` | No | Whole number, default 0. |
| `brand` | No | Defaults to `ShopSphere`. |
| `highlights` | No | JSON array, comma-separated or newline-separated list. |
| `images` | Yes | File uploads (`images` field, up to 6) and/or image URLs/paths. |
| `isFeatured` / `isTrending` | No | Booleans. |

Returns `201` with `{ success, message, product }`.

### `PUT /products/:id` (admin)

Protected + admin. Same fields as create. Returns `{ success, message, product }`.

### `PATCH /products/:id/stock` (admin)

Protected + admin.

```json
{ "stock": 25 }
```

Returns the updated product.

### `DELETE /products/:id` (admin)

Protected + admin. Removes the product and related wishlist/cart references. Returns `{ success, message }`.

---

## Categories

### `GET /categories`

Public. Returns `{ success, categories }`, each with a live product count.

### `GET /categories/:id`

Public. `:id` may be an id or slug. Returns `{ success, category }`.

### `POST /categories` (admin)

Protected + admin.

```json
{ "name": "Audio", "description": "Headphones and speakers", "image": "/uploads/seed/p01-1.jpg" }
```

Returns `201` with the category.

### `PUT /categories/:id` (admin)

Protected + admin. Accepts `name`, `description`, `image`.

### `DELETE /categories/:id` (admin)

Protected + admin. Returns `409` if the category still contains products.

---

## Cart

All cart endpoints require authentication and operate on the current user's cart.

### `GET /cart`

Returns:

```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "product": { "_id": "...", "name": "...", "finalPrice": 8999, "stock": 42 },
        "quantity": 2,
        "lineTotal": 17998
      }
    ],
    "totalItems": 2,
    "subtotal": 17998,
    "shippingEstimate": 0,
    "freeShippingThreshold": 999
  }
}
```

### `POST /cart`

```json
{ "productId": "<id>", "quantity": 1 }
```

Validates stock and increments an existing line. Returns `201` with the cart.

### `POST /cart/merge`

Merges a guest cart after login. Quantities are combined and capped by stock.

```json
{ "items": [{ "productId": "<id>", "quantity": 2 }] }
```

### `PUT /cart/:productId`

```json
{ "quantity": 3 }
```

A quantity of `0` or less removes the item. Returns the cart.

### `DELETE /cart/:productId`

Removes one line. Returns the cart.

### `DELETE /cart`

Clears the cart. Returns the empty cart.

---

## Wishlist

All wishlist endpoints require authentication.

### `GET /wishlist`

Returns `{ success, wishlist: { products: [...] } }` with populated product documents.

### `POST /wishlist/:productId`

Adds a product. Idempotent. Returns the populated wishlist.

### `DELETE /wishlist/:productId`

Removes a product. Returns the populated wishlist.

### `POST /wishlist/:productId/move-to-cart`

Adds the product to the cart, removes it from the wishlist and returns both:

```json
{ "success": true, "message": "Moved to cart", "cart": {}, "wishlist": {} }
```

---

## Orders

All order endpoints require authentication.

### `POST /orders`

Creates an order from the persisted cart or from an explicit `items` array. If `items` is omitted, the server reads and clears the user's cart.

```json
{
  "shippingAddress": {
    "fullName": "Alex Morgan",
    "phone": "9876543210",
    "street": "42 Residency Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India"
  },
  "paymentMethod": "Online",
  "couponCode": "SAVE10"
}
```

- `paymentMethod`: `COD` or `Online`.
- `couponCode`: optional; validated server-side.
- Prices, discounts, shipping and totals are recalculated by the server.

`201` response: `{ success, message, order }`. Online payments are simulated and stored as `Paid` with a `SIM-...` transaction id.

### `GET /orders/my`

Query: `status` (omit or `All` for every status), `page`, `limit` (max 30, default 10).

Returns `{ success, orders, page, pages, total }`.

### `GET /orders/:id`

Returns an order if the caller owns it or is an administrator. `403` otherwise.

### `PUT /orders/:id/cancel`

```json
{ "reason": "Changed my mind" }
```

Allowed only for `Pending` or `Processing` orders. Restores stock, marks paid orders as `Refunded` and appends a status-history entry.

---

## Reviews

### `PUT /reviews/:id`

Protected. The caller must own the review or be an administrator.

```json
{ "rating": 4, "title": "Good", "comment": "Works well after a month." }
```

### `DELETE /reviews/:id`

Protected. Owner or administrator. Removes the review and recalculates product ratings.

---

## Coupons

### `GET /coupons`

Public. Lists the available codes and descriptions.

### `POST /coupons/validate`

Public.

```json
{ "code": "SAVE10", "subtotal": 8999 }
```

Returns:

```json
{
  "success": true,
  "message": "Coupon applied: 10% off orders above ₹499 (max ₹500 off)",
  "coupon": { "code": "SAVE10", "description": "...", "discount": 500, "freeShipping": false }
}
```

Invalid codes or unmet minimums return `400`.

---

## Uploads

### `POST /uploads` (admin)

Protected + admin. `multipart/form-data` with one or more `images` files.

- Maximum 6 files per request.
- Maximum 5 MB per file.
- Allowed types: JPG, PNG, WEBP, GIF.

Response:

```json
{ "success": true, "message": "Images uploaded", "images": ["/uploads/products/<filename>"] }
```

---

## Admin

All admin endpoints require authentication **and** the `admin` role. The server enforces this; the frontend guard is only a convenience.

### `GET /admin/stats`

Query: `days` (7–30, default 7).

Returns `{ success, stats }` with:

- `totalRevenue` (excluding cancelled orders)
- `totalOrders`, `totalCustomers`, `totalProducts`
- `pendingOrders`, `deliveredOrders`, `cancelledOrders`
- `recentOrders` (latest 6, populated customer)
- `bestSellers` (top 5 by units sold)
- `lowStockProducts` (stock ≤ 5)
- `salesOverview` (per-day revenue and order count)
- `categoryBreakdown` (products per category)
- `rangeDays`

### `GET /admin/users`

Query: `keyword` (name/email), `role` (`customer`/`admin`/`All`), `blocked` (`true`/`false`), `page`, `limit`.

Returns `{ success, users, page, pages, total }` with order counts.

### `GET /admin/users/:id`

Returns the user, recent orders and saved address details.

### `PUT /admin/users/:id/block`

```json
{ "isBlocked": true }
```

Administrators cannot block their own account (`400`).

### `PUT /admin/users/:id/role`

```json
{ "role": "admin" }
```

Allowed values: `customer`, `admin`. Administrators cannot change their own role.

### `GET /admin/orders`

Query: `status`, `paymentStatus`, `keyword` (order number or customer name), `page`, `limit` (max 50).

Returns `{ success, orders, page, pages, total }`.

### `PUT /admin/orders/:id/status`

```json
{ "status": "Shipped", "note": "Handed to the courier" }
```

Allowed transitions:

| From | To |
| --- | --- |
| `Pending` | `Processing`, `Cancelled` |
| `Processing` | `Shipped`, `Cancelled` |
| `Shipped` | `Delivered` |
| `Delivered` | — |
| `Cancelled` | — |

Cancelling restores stock and refunds paid orders. Every change appends to `statusHistory`.

---

## Quick examples

```bash
# Health
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@shopsphere.com","password":"Customer@123"}'

# List products
curl "http://localhost:5000/api/products?keyword=headphones&sort=price_asc"

# Authenticated cart
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer <jwt>"

# Validate a coupon
curl -X POST http://localhost:5000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE10","subtotal":8999}'
```
