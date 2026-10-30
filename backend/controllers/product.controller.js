const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const uniqueProductSlug = async (name, excludeId = null) => {
  const base = slugify(name) || 'product';
  let slug = base;
  let i = 2;
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

const parseBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const parseList = (value) => {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((v) => v.trim()).filter(Boolean);
  } catch {
    // Not JSON - fall through to newline/comma splitting
  }
  return value.split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean);
};

const buildImages = (body, files = []) => {
  const uploaded = (files || []).map((file) => `/uploads/products/${file.filename}`);
  const provided = parseList(body.images);
  return [...uploaded, ...provided].filter(Boolean).slice(0, 8);
};

const resolveCategory = async (value) => {
  if (!value) return null;
  if (/^[a-f\d]{24}$/i.test(String(value))) return Category.findById(value);
  return Category.findOne({ $or: [{ slug: String(value).toLowerCase() }, { name: new RegExp(`^${escapeRegex(String(value))}$`, 'i') }] });
};

const sortMap = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  rating: { ratings: -1, numReviews: -1 },
  popular: { soldCount: -1, numReviews: -1, ratings: -1 },
  name: { name: 1 },
};

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword = '',
    category = '',
    brand = '',
    minPrice,
    maxPrice,
    rating,
    sort = 'newest',
    featured,
    trending,
    inStock,
  } = req.query;

  const filter = {};

  if (keyword.trim()) {
    const rx = new RegExp(escapeRegex(keyword.trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { description: rx }, { shortDescription: rx }];
  }

  if (category) {
    const categoryDoc = await resolveCategory(category);
    if (!categoryDoc) {
      return res.json({ success: true, products: [], page: 1, pages: 0, total: 0, limit: 12 });
    }
    filter.category = categoryDoc._id;
  }

  if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, 'i');

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.finalPrice = {};
    if (minPrice !== undefined && minPrice !== '') filter.finalPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') filter.finalPrice.$lte = Number(maxPrice);
  }

  if (rating !== undefined && rating !== '') filter.ratings = { $gte: Number(rating) };
  if (parseBoolean(featured)) filter.isFeatured = true;
  if (parseBoolean(trending)) filter.isTrending = true;
  if (parseBoolean(inStock)) filter.stock = { $gt: 0 };

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const sortOption = sortMap[sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(total / limit),
    total,
    limit,
  });
});

// GET /api/products/meta/filters
const getProductMeta = asyncHandler(async (_req, res) => {
  const [brands, range] = await Promise.all([
    Product.distinct('brand'),
    Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$finalPrice' },
          maxPrice: { $max: '$finalPrice' },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    brands: brands.filter(Boolean).sort(),
    minPrice: range[0]?.minPrice || 0,
    maxPrice: range[0]?.maxPrice || 0,
    total: range[0]?.total || 0,
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = /^[a-f\d]{24}$/i.test(id) ? { _id: id } : { slug: id };
  const product = await Product.findOne(query).populate('category', 'name slug image');

  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// GET /api/products/:id/related
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const products = await Product.find({ category: product.category, _id: { $ne: product._id } })
    .sort({ ratings: -1, createdAt: -1 })
    .limit(4)
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  res.json({ success: true, products });
});

// POST /api/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, shortDescription, price, discountPrice, category, brand, stock, highlights } = req.body;

  if (!name?.trim()) throw new ApiError(400, 'Product name is required');
  if (!description?.trim()) throw new ApiError(400, 'Product description is required');
  if (price === undefined || price === '' || Number(price) < 0) throw new ApiError(400, 'A valid price is required');

  const categoryDoc = await resolveCategory(category);
  if (!categoryDoc) throw new ApiError(400, 'Please choose a valid category');

  const images = buildImages(req.body, req.files);
  if (images.length === 0) throw new ApiError(400, 'Please upload at least one product image or provide an image URL');

  const product = await Product.create({
    name: name.trim(),
    slug: await uniqueProductSlug(name),
    description: description.trim(),
    shortDescription: shortDescription || '',
    price: Number(price),
    discountPrice: discountPrice === '' || discountPrice == null ? null : Number(discountPrice),
    images,
    category: categoryDoc._id,
    brand: brand || 'ShopSphere',
    stock: Number(stock) || 0,
    highlights: parseList(highlights),
    isFeatured: parseBoolean(req.body.isFeatured),
    isTrending: parseBoolean(req.body.isTrending),
  });

  await product.populate('category', 'name slug');
  res.status(201).json({ success: true, message: 'Product created', product });
});

// PUT /api/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const body = req.body;
  if (body.name !== undefined && body.name.trim() !== product.name) {
    product.name = body.name.trim();
    product.slug = await uniqueProductSlug(product.name, product._id);
  }
  if (body.description !== undefined) product.description = body.description.trim();
  if (body.shortDescription !== undefined) product.shortDescription = body.shortDescription;
  if (body.price !== undefined) product.price = Number(body.price);
  if (body.discountPrice !== undefined) {
    product.discountPrice = body.discountPrice === '' || body.discountPrice === null ? null : Number(body.discountPrice);
  }
  if (body.category !== undefined) {
    const categoryDoc = await resolveCategory(body.category);
    if (!categoryDoc) throw new ApiError(400, 'Please choose a valid category');
    product.category = categoryDoc._id;
  }
  if (body.brand !== undefined) product.brand = body.brand;
  if (body.stock !== undefined) product.stock = Number(body.stock);
  if (body.highlights !== undefined) product.highlights = parseList(body.highlights);
  if (body.isFeatured !== undefined) product.isFeatured = parseBoolean(body.isFeatured);
  if (body.isTrending !== undefined) product.isTrending = parseBoolean(body.isTrending);

  if (req.files?.length || body.images !== undefined) {
    const images = buildImages(body, req.files);
    if (images.length === 0) throw new ApiError(400, 'A product must keep at least one image');
    product.images = images;
  }

  await product.save();
  await product.populate('category', 'name slug');
  res.json({ success: true, message: 'Product updated', product });
});

// PATCH /api/products/:id/stock (admin)
const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.stock !== undefined) {
    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0) throw new ApiError(400, 'Stock must be a non-negative whole number');
    product.stock = stock;
  } else if (req.body.delta !== undefined) {
    const delta = Number(req.body.delta);
    if (!Number.isInteger(delta)) throw new ApiError(400, 'Stock change must be a whole number');
    if (product.stock + delta < 0) throw new ApiError(400, 'Stock cannot become negative');
    product.stock += delta;
  } else {
    throw new ApiError(400, 'Provide a stock value or delta');
  }

  await product.save();
  res.json({ success: true, message: 'Stock updated', stock: product.stock });
});

// DELETE /api/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await Promise.all([
    product.deleteOne(),
    Review.deleteMany({ product: product._id }),
    Wishlist.updateMany({ products: product._id }, { $pull: { products: product._id } }),
    Cart.updateMany({ 'items.product': product._id }, { $pull: { items: { product: product._id } } }),
  ]);

  res.json({ success: true, message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getProductMeta,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
};
