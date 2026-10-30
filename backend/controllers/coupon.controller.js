const { validateCoupon, listCoupons } = require('../utils/coupons');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/coupons
const getCoupons = asyncHandler(async (_req, res) => {
  res.json({ success: true, coupons: listCoupons() });
});

// POST /api/coupons/validate  { code, subtotal }
const checkCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) throw new ApiError(400, 'Enter a coupon code');

  const amount = Number(subtotal);
  if (!Number.isFinite(amount) || amount < 0) throw new ApiError(400, 'Invalid cart subtotal');

  const coupon = validateCoupon(code, amount);
  res.json({
    success: true,
    message: `Coupon applied: ${coupon.description}`,
    coupon,
  });
});

module.exports = { getCoupons, checkCoupon };
