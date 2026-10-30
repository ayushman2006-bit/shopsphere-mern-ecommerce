const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const serializeCart = (cart) => {
  const items = (cart.items || [])
    .filter((item) => item.product && typeof item.product === 'object' && item.product._id)
    .map((item) => {
      const price = item.product.finalPrice ?? item.product.discountPrice ?? item.product.price;
      return {
        product: {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          finalPrice: price,
          stock: item.product.stock,
          brand: item.product.brand,
          ratings: item.product.ratings,
        },
        quantity: item.quantity,
        lineTotal: price * item.quantity,
      };
    });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    totalItems,
    subtotal,
    shippingEstimate: subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
};

const loadCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await cart.populate({
    path: 'items.product',
    select: 'name slug images price discountPrice finalPrice stock brand ratings',
  });
  return cart;
};

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  res.json({ success: true, cart: serializeCart(cart) });
});

// POST /api/cart  { productId, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = Number(req.body.quantity) || 1;
  if (!productId) throw new ApiError(400, 'Product is required');
  if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, 'Quantity must be a positive whole number');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(409, 'This product is out of stock');

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => String(item.product) === String(product._id));
  const newQuantity = (existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} item(s) available in stock`);
  }

  if (existing) existing.quantity = newQuantity;
  else cart.items.push({ product: product._id, quantity });

  await cart.save();
  const populated = await loadCart(req.user._id);
  res.status(201).json({ success: true, message: 'Added to cart', cart: serializeCart(populated) });
});

// PUT /api/cart/:productId  { quantity }
const updateCartItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) throw new ApiError(400, 'Quantity must be zero or a positive whole number');

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => String(entry.product) === String(req.params.productId));
  if (!item) throw new ApiError(404, 'Product is not in your cart');

  if (quantity === 0) {
    cart.items = cart.items.filter((entry) => String(entry.product) !== String(req.params.productId));
  } else {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (quantity > product.stock) throw new ApiError(409, `Only ${product.stock} item(s) available in stock`);
    item.quantity = quantity;
  }

  await cart.save();
  const populated = await loadCart(req.user._id);
  res.json({ success: true, message: 'Cart updated', cart: serializeCart(populated) });
});

// DELETE /api/cart/:productId
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((entry) => String(entry.product) !== String(req.params.productId));
  await cart.save();
  const populated = await loadCart(req.user._id);
  res.json({ success: true, message: 'Item removed from cart', cart: serializeCart(populated) });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, message: 'Cart cleared', cart: serializeCart(cart) });
});

// POST /api/cart/merge  { items: [{ productId, quantity }] }
const mergeCart = asyncHandler(async (req, res) => {
  const guestItems = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  const cart = await getOrCreateCart(req.user._id);

  for (const entry of guestItems) {
    const productId = entry.productId || entry.product?._id || entry.product;
    const quantity = Number(entry.quantity) || 1;
    if (!productId || !Number.isInteger(quantity) || quantity < 1) continue;

    const product = await Product.findById(productId);
    if (!product || product.stock < 1) continue;

    const existing = cart.items.find((item) => String(item.product) === String(product._id));
    const merged = Math.min((existing?.quantity || 0) + quantity, product.stock);
    if (existing) existing.quantity = merged;
    else cart.items.push({ product: product._id, quantity: Math.min(quantity, product.stock) });
  }

  await cart.save();
  const populated = await loadCart(req.user._id);
  res.json({ success: true, message: 'Cart synced', cart: serializeCart(populated) });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  serializeCart,
  loadCart,
};
