const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const average = stats[0]?.average || 0;
  const count = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(average * 10) / 10,
    numReviews: count,
  });

  return { ratings: Math.round(average * 10) / 10, numReviews: count };
};

// GET /api/products/:productId/reviews
const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('ratings numReviews');
  if (!product) throw new ApiError(404, 'Product not found');

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 8));

  const [reviews, total, distributionRaw] = await Promise.all([
    Review.find({ product: product._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: product._id }),
    Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: distributionRaw.find((entry) => entry._id === rating)?.count || 0,
  }));

  res.json({
    success: true,
    reviews,
    page,
    pages: Math.ceil(total / limit),
    total,
    averageRating: product.ratings,
    numReviews: product.numReviews,
    distribution,
  });
});

// POST /api/products/:productId/reviews
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this product. You can edit your existing review.');

  const purchased = await Order.exists({
    user: req.user._id,
    'orderItems.product': product._id,
    orderStatus: { $in: ['Processing', 'Shipped', 'Delivered'] },
  });

  const review = await Review.create({
    user: req.user._id,
    product: product._id,
    rating: Number(rating),
    title: title || '',
    comment,
    isVerifiedPurchase: Boolean(purchased),
  });

  await recalculateProductRating(product._id);
  await review.populate('user', 'name');

  res.status(201).json({ success: true, message: 'Review submitted', review });
});

// PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (String(review.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
  if (req.body.title !== undefined) review.title = req.body.title;
  if (req.body.comment !== undefined) review.comment = req.body.comment;

  await review.save();
  await recalculateProductRating(review.product);
  await review.populate('user', 'name');

  res.json({ success: true, message: 'Review updated', review });
});

// DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const isOwner = String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review');
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);

  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview, recalculateProductRating };
