const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/orders - place an order for the logged-in user.
// The frontend sends: { items: [{ productId, quantity }] }
router.post('/', protect, async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const orderProducts = [];
    let totalAmount = 0;

    // Read every product from MongoDB so the price cannot be changed in the browser.
    for (const item of items) {
      const product = await Product.findById(item.productId);
      const quantity = Number(item.quantity);

      if (!product) {
        return res.status(404).json({ message: 'One of the products no longer exists' });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} left of ${product.name}`,
        });
      }

      totalAmount += product.price * quantity;

      orderProducts.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      });
    }

    // Reduce the stock for each product.
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await Order.create({
      userId: req.user._id,
      products: orderProducts,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/my - return only the logged-in user's orders.
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders - return every order (admin only).
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    // populate() replaces userId with the customer's name and email.
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - update an order's status (admin only).
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
