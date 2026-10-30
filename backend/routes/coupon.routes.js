const express = require('express');
const { getCoupons, checkCoupon } = require('../controllers/coupon.controller');

const router = express.Router();

router.get('/', getCoupons);
router.post('/validate', checkCoupon);

module.exports = router;
