const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const {
  getProducts,
  getProductMeta,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} = require('../controllers/product.controller');
const {
  getProductReviews,
  createReview,
} = require('../controllers/review.controller');

const router = express.Router();

router.get('/meta/filters', getProductMeta);
router.get('/', getProducts);

router.get('/:productId/reviews', getProductReviews);
router.post(
  '/:productId/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 3, max: 1000 }).withMessage('Review must be 3-1000 characters'),
    body('title').optional().trim().isLength({ max: 120 }).withMessage('Title is too long'),
  ],
  validate,
  createReview
);

router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  protect,
  admin,
  upload.array('images', 6),
  [
    body('name').trim().isLength({ min: 2, max: 160 }).withMessage('Product name is required'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative whole number'),
  ],
  validate,
  createProduct
);

router.put(
  '/:id',
  protect,
  admin,
  upload.array('images', 6),
  updateProduct
);

router.patch('/:id/stock', protect, admin, updateStock);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
