const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

const populateWishlist = (wishlist) =>
  wishlist.populate({
    path: 'products',
    select: 'name slug images price discountPrice finalPrice stock brand ratings numReviews',
  });

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await populateWishlist(await getOrCreateWishlist(req.user._id));
  res.json({
    success: true,
    wishlist: {
      _id: wishlist._id,
      products: (wishlist.products || []).filter((p) => p && p._id),
    },
  });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.products.some((id) => String(id) === String(product._id));
  if (exists) throw new ApiError(409, 'Product is already in your wishlist');

  wishlist.products.push(product._id);
  await wishlist.save();
  const populated = await populateWishlist(wishlist);
  res.status(201).json({ success: true, message: 'Added to wishlist', wishlist: { products: populated.products } });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((id) => String(id) !== String(req.params.productId));
  await wishlist.save();
  const populated = await populateWishlist(wishlist);
  res.json({ success: true, message: 'Removed from wishlist', wishlist: { products: populated.products } });
});

// POST /api/wishlist/:productId/move-to-cart
const moveToCart = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(409, 'This product is out of stock');

  const wishlist = await getOrCreateWishlist(req.user._id);
  const inWishlist = wishlist.products.some((id) => String(id) === String(product._id));
  if (!inWishlist) throw new ApiError(404, 'Product is not in your wishlist');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existing = cart.items.find((item) => String(item.product) === String(product._id));
  if (existing) {
    if (existing.quantity + 1 > product.stock) throw new ApiError(409, `Only ${product.stock} item(s) available in stock`);
    existing.quantity += 1;
  } else {
    cart.items.push({ product: product._id, quantity: 1 });
  }
  await cart.save();

  wishlist.products = wishlist.products.filter((id) => String(id) !== String(product._id));
  await wishlist.save();

  res.json({ success: true, message: 'Moved to cart' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
