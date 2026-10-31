const express = require('express');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Escape special regex characters so a search like "(" does not break the query.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products - list products.
// Optional query parameters:
//   ?search=phone   -> search by name or description
//   ?category=Books -> filter by category
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      const searchTerm = escapeRegex(search);

      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/categories - list all category names (used by the filters).
// This route must come before "/:id", otherwise Express treats "categories" as an id.
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.sort());
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - get one product for the details page.
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// POST /api/products - add a product (admin only).
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      stock,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - edit a product (admin only).
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, image, category, stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - delete a product (admin only).
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
