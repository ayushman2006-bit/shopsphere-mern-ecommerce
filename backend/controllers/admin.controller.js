const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats?days=7
const getDashboardStats = asyncHandler(async (req, res) => {
  const days = Math.min(30, Math.max(7, Number(req.query.days) || 7));
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const activeOrder = { orderStatus: { $ne: 'Cancelled' } };

  const [
    revenueAgg,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    recentOrders,
    bestSellers,
    lowStockProducts,
    salesRaw,
    categoryBreakdown,
  ] = await Promise.all([
    Order.aggregate([{ $match: activeOrder }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.countDocuments({ orderStatus: 'Delivered' }),
    Order.countDocuments({ orderStatus: 'Cancelled' }),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6).lean(),
    Order.aggregate([
      { $match: activeOrder },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          unitsSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Product.find({ stock: { $lte: 5 } })
      .select('name images stock finalPrice')
      .sort({ stock: 1 })
      .limit(5)
      .lean(),
    Order.aggregate([
      { $match: { ...activeOrder, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate([
      { $group: { _id: '$category', products: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', products: 1 } },
      { $sort: { products: -1 } },
    ]),
  ]);

  const salesMap = new Map(salesRaw.map((entry) => [entry._id, entry]));
  const salesOverview = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const key = date.toISOString().slice(0, 10);
    const entry = salesMap.get(key);
    salesOverview.push({
      date: key,
      label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' }),
      revenue: entry?.revenue || 0,
      orders: entry?.orders || 0,
    });
  }

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueAgg[0]?.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders,
      bestSellers,
      lowStockProducts,
      salesOverview,
      categoryBreakdown,
      rangeDays: days,
    },
  });
});

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const match = {};

  if (req.query.keyword?.trim()) {
    const rx = new RegExp(escapeRegex(req.query.keyword.trim()), 'i');
    match.$or = [{ name: rx }, { email: rx }];
  }
  if (req.query.role && req.query.role !== 'All') match.role = req.query.role;
  if (req.query.blocked === 'true') match.isBlocked = true;
  if (req.query.blocked === 'false') match.isBlocked = false;

  const result = await User.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders',
      },
    },
    {
      $addFields: {
        orderCount: { $size: '$orders' },
        totalSpent: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$orders',
                  as: 'order',
                  cond: { $ne: ['$$order.orderStatus', 'Cancelled'] },
                },
              },
              as: 'order',
              in: '$$order.totalPrice',
            },
          },
        },
      },
    },
    { $project: { password: 0, orders: 0 } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        meta: [{ $count: 'total' }],
      },
    },
  ]);

  const users = result[0]?.data || [];
  const total = result[0]?.meta?.[0]?.total || 0;

  res.json({ success: true, users, page, pages: Math.ceil(total / limit), total });
});

// GET /api/admin/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const [orders, spendAgg] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    Order.aggregate([
      { $match: { user: user._id, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    user,
    orders,
    stats: {
      orderCount: spendAgg[0]?.orderCount || 0,
      totalSpent: spendAgg[0]?.totalSpent || 0,
    },
  });
});

// PUT /api/admin/users/:id/block
const toggleBlockUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot block your own admin account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isBlocked = typeof req.body.isBlocked === 'boolean' ? req.body.isBlocked : !user.isBlocked;
  await user.save();

  res.json({
    success: true,
    message: user.isBlocked ? 'User blocked' : 'User unblocked',
    user,
  });
});

// PUT /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role');
  }
  if (!['customer', 'admin'].includes(req.body.role)) {
    throw new ApiError(400, 'Role must be either customer or admin');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.role = req.body.role;
  await user.save();

  res.json({ success: true, message: `Role updated to ${user.role}`, user });
});

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  toggleBlockUser,
  updateUserRole,
};
