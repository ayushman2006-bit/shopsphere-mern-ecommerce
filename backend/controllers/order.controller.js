const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateCoupon } = require('../utils/coupons');

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity, soldCount: -item.quantity } }
    );
  }
};

const rollbackStock = async (items) => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity, soldCount: -item.quantity } }
    );
  }
};

const normalizeRequestedItems = (items = []) => {
  const map = new Map();
  for (const entry of items) {
    const id = entry.product?._id || entry.product || entry.productId;
    const quantity = Number(entry.quantity);
    if (!id || !Number.isInteger(quantity) || quantity < 1) continue;
    map.set(String(id), (map.get(String(id)) || 0) + quantity);
  }
  return [...map.entries()].map(([product, quantity]) => ({ product, quantity }));
};

const requireAddress = (address = {}) => {
  const required = ['fullName', 'phone', 'street', 'city', 'state', 'postalCode'];
  const clean = {};
  for (const key of required) {
    const value = String(address[key] || '').trim();
    if (!value) throw new ApiError(400, `Shipping ${key} is required`);
    clean[key] = value;
  }
  if (clean.phone.replace(/\D/g, '').length < 7) throw new ApiError(400, 'Please provide a valid phone number');
  clean.country = String(address.country || 'India').trim() || 'India';
  return clean;
};

// POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, couponCode } = req.body;
  if (!['COD', 'Online'].includes(paymentMethod)) {
    throw new ApiError(400, 'Please choose a valid payment method');
  }

  const shippingAddress = requireAddress(req.body.shippingAddress);

  let requestedItems = [];
  let cart = null;

  if (Array.isArray(req.body.items) && req.body.items.length > 0) {
    requestedItems = normalizeRequestedItems(req.body.items);
  } else {
    cart = await Cart.findOne({ user: req.user._id });
    requestedItems = normalizeRequestedItems(cart?.items || []);
  }

  if (requestedItems.length === 0) throw new ApiError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: requestedItems.map((item) => item.product) } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const orderItems = [];
  for (const item of requestedItems) {
    const product = productMap.get(String(item.product));
    if (!product) throw new ApiError(404, 'One of the products in your cart is no longer available');
    if (product.stock < item.quantity) {
      throw new ApiError(409, `${product.name} has only ${product.stock} item(s) left in stock`);
    }
    const price = product.finalPrice ?? product.discountPrice ?? product.price;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price,
      quantity: item.quantity,
    });
  }

  const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const coupon = validateCoupon(couponCode, itemsPrice);
  const discountAmount = coupon?.discount || 0;
  const shippingPrice = coupon?.freeShipping
    ? 0
    : itemsPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;
  const totalPrice = Math.max(0, itemsPrice - discountAmount + shippingPrice);

  const isOnline = paymentMethod === 'Online';
  const paymentStatus = isOnline ? 'Paid' : 'Pending';

  const reserved = [];
  let order;

  try {
    // Atomic conditional decrements prevent overselling even under concurrency.
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true }
      );
      if (!updated) {
        const fresh = await Product.findById(item.product).select('name stock');
        throw new ApiError(
          409,
          `${fresh?.name || 'An item'} only has ${fresh?.stock || 0} item(s) left in stock`
        );
      }
      reserved.push(item);
    }

    order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      ...(isOnline
        ? {
            paymentResult: {
              transactionId: `SIM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
              provider: 'ShopSphere Pay (simulated)',
              paidAt: new Date(),
            },
          }
        : {}),
      itemsPrice,
      discountAmount,
      shippingPrice,
      totalPrice,
      couponCode: coupon?.code || '',
      orderStatus: 'Pending',
      statusHistory: [{ status: 'Pending', date: new Date(), note: 'Order placed successfully' }],
    });
  } catch (error) {
    await rollbackStock(reserved);
    throw error;
  }

  if (cart) {
    try {
      cart.items = [];
      await cart.save();
    } catch (error) {
      console.error('Failed to clear cart after order:', error.message);
    }
  }

  await order.populate('user', 'name email');
  res.status(201).json({ success: true, message: 'Order placed successfully', order });
});

// GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
  const filter = { user: req.user._id };
  if (req.query.status && req.query.status !== 'All') filter.orderStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.user?._id || order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'You cannot view this order');

  res.json({ success: true, order });
});

// PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  if (!['Pending', 'Processing'].includes(order.orderStatus)) {
    throw new ApiError(400, `Orders that are ${order.orderStatus.toLowerCase()} cannot be cancelled`);
  }

  await restoreStock(order.orderItems);

  order.orderStatus = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = String(req.body.reason || 'Cancelled by customer').slice(0, 300);
  if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded';
  order.statusHistory.push({
    status: 'Cancelled',
    date: new Date(),
    note: order.cancelReason,
  });
  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

// GET /api/admin/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter = {};

  if (req.query.status && req.query.status !== 'All') filter.orderStatus = req.query.status;
  if (req.query.paymentStatus && req.query.paymentStatus !== 'All') {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.keyword?.trim()) {
    const rx = new RegExp(req.query.keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
});

// PUT /api/admin/orders/:id/status  { status, note }
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const transitions = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
  };

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (!Object.prototype.hasOwnProperty.call(transitions, status)) {
    throw new ApiError(400, 'Invalid order status');
  }
  if (status === order.orderStatus) {
    return res.json({ success: true, message: 'Order already has this status', order });
  }
  if (!transitions[order.orderStatus].includes(status)) {
    throw new ApiError(400, `Cannot move an order from ${order.orderStatus} to ${status}`);
  }

  if (status === 'Cancelled') {
    await restoreStock(order.orderItems);
    order.cancelledAt = new Date();
    order.cancelReason = String(note || 'Cancelled by administrator').slice(0, 300);
    if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded';
  }
  if (status === 'Delivered') order.deliveredAt = new Date();

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    date: new Date(),
    note: String(note || `Status updated to ${status} by admin`).slice(0, 300),
  });
  await order.save();

  res.json({ success: true, message: `Order marked as ${status}`, order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  adminUpdateOrderStatus,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
};
