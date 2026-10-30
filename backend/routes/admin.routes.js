const express = require('express');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getDashboardStats,
  getUsers,
  getUserById,
  toggleBlockUser,
  updateUserRole,
} = require('../controllers/admin.controller');
const {
  getAllOrders,
  adminUpdateOrderStatus,
} = require('../controllers/order.controller');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', toggleBlockUser);
router.put('/users/:id/role', updateUserRole);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', adminUpdateOrderStatus);

module.exports = router;
