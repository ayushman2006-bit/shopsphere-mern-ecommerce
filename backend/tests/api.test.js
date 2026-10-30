const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'shopsphere-test-secret-that-is-long-enough-1234567890';
process.env.CLIENT_URL = 'http://localhost:5173';

let mongod;
let app;
let adminToken;
let customerToken;
let secondToken;
let newUserToken;
let category;
let productA;
let productB;
let customer;
let secondUser;
let orderId;

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.token;
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('shopsphere-test'));

  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const User = require('../models/User');

  app = require('../app');

  category = await Category.create({
    name: 'Electronics',
    description: 'Test category',
    image: '/uploads/seed/p01-1.jpg',
  });

  productA = await Product.create({
    name: 'Aurora Test Headphones',
    description: 'A detailed test product description for automated API tests.',
    shortDescription: 'Test headphones',
    price: 1000,
    discountPrice: 800,
    images: ['/uploads/seed/p01-1.jpg', '/uploads/seed/p01-2.jpg'],
    category: category._id,
    brand: 'Aurora',
    stock: 5,
    highlights: ['Test highlight'],
    isFeatured: true,
  });

  productB = await Product.create({
    name: 'Nimbus Test Speaker',
    description: 'Another detailed test product description for automated API tests.',
    shortDescription: 'Test speaker',
    price: 1500,
    images: ['/uploads/seed/p05-1.jpg'],
    category: category._id,
    brand: 'Nimbus',
    stock: 10,
  });

  await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  customer = await User.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'Customer@123',
    phone: '9876543210',
  });

  secondUser = await User.create({
    name: 'Second Customer',
    email: 'second@test.com',
    password: 'Customer@123',
  });

  adminToken = await login('admin@test.com', 'Admin@12345');
  customerToken = await login('customer@test.com', 'Customer@123');
  secondToken = await login('second@test.com', 'Customer@123');
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('health endpoint responds', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('authentication: register, duplicate email and validation', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'New Shopper',
    email: 'new@test.com',
    password: 'NewPass@123',
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  newUserToken = res.body.token;
  assert.equal(res.body.user.role, 'customer');
  assert.equal(res.body.user.password, undefined);

  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'New Shopper',
    email: 'new@test.com',
    password: 'NewPass@123',
  });
  assert.equal(duplicate.status, 409);

  const invalid = await request(app).post('/api/auth/register').send({
    name: 'X',
    email: 'not-an-email',
    password: '123',
  });
  assert.equal(invalid.status, 422);
  assert.ok(Array.isArray(invalid.body.errors));

  const wrong = await request(app).post('/api/auth/login').send({
    email: 'new@test.com',
    password: 'WrongPass',
  });
  assert.equal(wrong.status, 401);
});

test('profile can be fetched and updated, password can be changed', async () => {
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${customerToken}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'customer@test.com');

  const updated = await request(app)
    .put('/api/auth/profile')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ name: 'Updated Customer', phone: '9999999999' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.user.name, 'Updated Customer');

  const password = await request(app)
    .put('/api/auth/password')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ currentPassword: 'Customer@123', newPassword: 'Customer@456' });
  assert.equal(password.status, 200);

  customerToken = await login('customer@test.com', 'Customer@456');
});

test('product listing supports search, filters, sorting and pagination', async () => {
  const all = await request(app).get('/api/products');
  assert.equal(all.status, 200);
  assert.equal(all.body.total, 2);
  assert.equal(all.body.products[0].category.name, 'Electronics');

  const search = await request(app).get('/api/products?keyword=Aurora');
  assert.equal(search.status, 200);
  assert.equal(search.body.total, 1);
  assert.equal(search.body.products[0].name, 'Aurora Test Headphones');

  const filtered = await request(app).get('/api/products?category=electronics&minPrice=700&maxPrice=900');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.total, 1);

  const sorted = await request(app).get('/api/products?sort=price_desc');
  assert.equal(sorted.status, 200);
  assert.equal(sorted.body.products[0].name, 'Nimbus Test Speaker');

  const meta = await request(app).get('/api/products/meta/filters');
  assert.equal(meta.status, 200);
  assert.ok(meta.body.brands.includes('Aurora'));

  const details = await request(app).get(`/api/products/${productA._id}`);
  assert.equal(details.status, 200);
  assert.equal(details.body.product.slug, 'aurora-test-headphones');
});

test('admin authorization is enforced on the server', async () => {
  const denied = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${customerToken}`);
  assert.equal(denied.status, 403);

  const allowed = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.stats.totalProducts, 2);
});

test('cart operations validate stock and update quantities', async () => {
  const added = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId: productA._id, quantity: 2 });
  assert.equal(added.status, 201);
  assert.equal(added.body.cart.totalItems, 2);

  const overStock = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId: productA._id, quantity: 4 });
  assert.equal(overStock.status, 409);

  const updated = await request(app)
    .put(`/api/cart/${productA._id}`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ quantity: 5 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.cart.items[0].quantity, 5);
  assert.equal(updated.body.cart.subtotal, 4000);

  const second = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId: productB._id, quantity: 1 });
  assert.equal(second.status, 201);
  assert.equal(second.body.cart.totalItems, 6);
});

test('coupons are validated server-side', async () => {
  const valid = await request(app).post('/api/coupons/validate').send({ code: 'SAVE10', subtotal: 4000 });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.coupon.discount, 400);

  const invalid = await request(app).post('/api/coupons/validate').send({ code: 'FAKE', subtotal: 4000 });
  assert.equal(invalid.status, 400);
});

test('checkout recalculates totals, creates order, decrements stock and clears cart', async () => {
  const missingAddress = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ paymentMethod: 'COD' });
  assert.equal(missingAddress.status, 400);

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        street: '1 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      paymentMethod: 'Online',
      couponCode: 'SAVE10',
    });

  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.order.itemsPrice, 5500);
  assert.equal(res.body.order.discountAmount, 500);
  assert.equal(res.body.order.shippingPrice, 0);
  assert.equal(res.body.order.totalPrice, 5000);
  assert.equal(res.body.order.paymentStatus, 'Paid');
  assert.ok(res.body.order.paymentResult.transactionId.startsWith('SIM-'));
  orderId = res.body.order._id;

  const Product = require('../models/Product');
  const freshA = await Product.findById(productA._id);
  const freshB = await Product.findById(productB._id);
  assert.equal(freshA.stock, 0);
  assert.equal(freshB.stock, 9);

  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
  assert.equal(cart.status, 200);
  assert.equal(cart.body.cart.items.length, 0);
});

test('order history, details and admin status updates work', async () => {
  const mine = await request(app).get('/api/orders/my').set('Authorization', `Bearer ${customerToken}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.total, 1);

  const details = await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Authorization', `Bearer ${customerToken}`);
  assert.equal(details.status, 200);
  assert.equal(details.body.order.orderStatus, 'Pending');

  const forbidden = await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Authorization', `Bearer ${secondToken}`);
  assert.equal(forbidden.status, 403);

  const processing = await request(app)
    .put(`/api/admin/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Processing', note: 'Payment confirmed' });
  assert.equal(processing.status, 200);
  assert.equal(processing.body.order.orderStatus, 'Processing');

  const invalidTransition = await request(app)
    .put(`/api/admin/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Pending' });
  assert.equal(invalidTransition.status, 400);
});

test('reviews can be created once, update ratings and block duplicates', async () => {
  const created = await request(app)
    .post(`/api/products/${productA._id}/reviews`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ rating: 5, title: 'Excellent', comment: 'Really comfortable and well built.' });
  assert.equal(created.status, 201);
  assert.equal(created.body.review.isVerifiedPurchase, true);

  const duplicate = await request(app)
    .post(`/api/products/${productA._id}/reviews`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ rating: 4, comment: 'Trying to review twice.' });
  assert.equal(duplicate.status, 409);

  const reviews = await request(app).get(`/api/products/${productA._id}/reviews`);
  assert.equal(reviews.status, 200);
  assert.equal(reviews.body.total, 1);
  assert.equal(reviews.body.averageRating, 5);

  const updated = await request(app)
    .put(`/api/reviews/${created.body.review._id}`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ rating: 4, comment: 'Updated after a week of use.' });
  assert.equal(updated.status, 200);

  const reviewsAfter = await request(app).get(`/api/products/${productA._id}/reviews`);
  assert.equal(reviewsAfter.body.averageRating, 4);
});

test('customer can cancel an eligible order and stock is restored', async () => {
  const cancelled = await request(app)
    .put(`/api/orders/${orderId}/cancel`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ reason: 'Changed my mind' });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.order.orderStatus, 'Cancelled');
  assert.equal(cancelled.body.order.paymentStatus, 'Refunded');

  const Product = require('../models/Product');
  const freshA = await Product.findById(productA._id);
  const freshB = await Product.findById(productB._id);
  assert.equal(freshA.stock, 5);
  assert.equal(freshB.stock, 10);

  const again = await request(app)
    .put(`/api/orders/${orderId}/cancel`)
    .set('Authorization', `Bearer ${customerToken}`);
  assert.equal(again.status, 400);
});

test('wishlist supports add, list and move-to-cart', async () => {
  const added = await request(app)
    .post(`/api/wishlist/${productB._id}`)
    .set('Authorization', `Bearer ${secondToken}`);
  assert.equal(added.status, 201);

  const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${secondToken}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.wishlist.products.length, 1);

  const moved = await request(app)
    .post(`/api/wishlist/${productB._id}/move-to-cart`)
    .set('Authorization', `Bearer ${secondToken}`);
  assert.equal(moved.status, 200);

  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${secondToken}`);
  assert.equal(cart.body.cart.items.length, 1);

  const wishlistAfter = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${secondToken}`);
  assert.equal(wishlistAfter.body.wishlist.products.length, 0);
});

test('admin can create, update and delete products', async () => {
  const created = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Admin Created Product',
      description: 'A product created through the admin API during tests.',
      price: 2500,
      discountPrice: 2000,
      stock: 7,
      category: category._id,
      brand: 'TestBrand',
      images: ['/uploads/seed/p04-1.jpg'],
      isFeatured: true,
    });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.product.finalPrice, 2000);

  const updated = await request(app)
    .put(`/api/products/${created.body.product._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ stock: 12, price: 2600 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.product.stock, 12);

  const stock = await request(app)
    .patch(`/api/products/${created.body.product._id}/stock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ delta: -2 });
  assert.equal(stock.status, 200);
  assert.equal(stock.body.stock, 10);

  const deleted = await request(app)
    .delete(`/api/products/${created.body.product._id}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(deleted.status, 200);

  const missingImage = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'No Image Product',
      description: 'This product should fail because it has no image.',
      price: 100,
      stock: 2,
      category: category._id,
    });
  assert.equal(missingImage.status, 400);
});

test('admin can manage users, block accounts and change roles', async () => {
  const User = require('../models/User');
  const target = await User.findOne({ email: 'new@test.com' });

  const blocked = await request(app)
    .put(`/api/admin/users/${target._id}/block`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isBlocked: true });
  assert.equal(blocked.status, 200);

  const denied = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${newUserToken}`);
  assert.equal(denied.status, 403);

  const unblocked = await request(app)
    .put(`/api/admin/users/${target._id}/block`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isBlocked: false });
  assert.equal(unblocked.status, 200);

  const promoted = await request(app)
    .put(`/api/admin/users/${target._id}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'admin' });
  assert.equal(promoted.status, 200);
  assert.equal(promoted.body.user.role, 'admin');

  const selfRoleChange = await request(app)
    .put(`/api/admin/users/${target._id}/role`)
    .set('Authorization', `Bearer ${newUserToken}`)
    .send({ role: 'customer' });
  assert.equal(selfRoleChange.status, 400);

  const users = await request(app)
    .get('/api/admin/users?keyword=new@test.com')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(users.status, 200);
  assert.equal(users.body.total, 1);
});

test('admin dashboard reflects real database data', async () => {
  const res = await request(app)
    .get('/api/admin/stats?days=7')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.stats.totalOrders, 1);
  assert.equal(res.body.stats.totalProducts, 2);
  assert.equal(res.body.stats.salesOverview.length, 7);
  assert.ok(Array.isArray(res.body.stats.bestSellers));
});
