const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

const uniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name) || 'category';
  let slug = base;
  let i = 2;
  while (await Category.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

// GET /api/categories
const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    success: true,
    categories: categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 })),
  });
});

// GET /api/categories/:id
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
});

// POST /api/categories (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Category name is required');

  const exists = await Category.findOne({ name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (exists) throw new ApiError(409, 'A category with this name already exists');

  const category = await Category.create({
    name: name.trim(),
    description: description || '',
    image: image || '',
    slug: await uniqueSlug(name),
  });

  res.status(201).json({ success: true, message: 'Category created', category });
});

// PUT /api/categories/:id (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (req.body.name && req.body.name.trim() !== category.name) {
    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${req.body.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (duplicate) throw new ApiError(409, 'A category with this name already exists');
    category.name = req.body.name.trim();
    category.slug = await uniqueSlug(category.name, category._id);
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.image !== undefined) category.image = req.body.image;

  await category.save();
  res.json({ success: true, message: 'Category updated', category });
});

// DELETE /api/categories/:id (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const products = await Product.countDocuments({ category: category._id });
  if (products > 0) {
    throw new ApiError(400, `Cannot delete this category while ${products} product(s) are assigned to it`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
