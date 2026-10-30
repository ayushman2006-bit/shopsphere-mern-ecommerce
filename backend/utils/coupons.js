const ApiError = require('./ApiError');

/**
 * Coupon definitions live on the server. The client never sends a discount
 * amount - it only sends a code, and the server recalculates everything.
 */
const COUPONS = {
  SAVE10: {
    code: 'SAVE10',
    type: 'percent',
    value: 10,
    minSubtotal: 499,
    maxDiscount: 500,
    description: '10% off orders above ₹499 (max ₹500 off)',
  },
  WELCOME100: {
    code: 'WELCOME100',
    type: 'flat',
    value: 100,
    minSubtotal: 999,
    description: '₹100 off orders above ₹999',
  },
  FREESHIP: {
    code: 'FREESHIP',
    type: 'shipping',
    value: 0,
    minSubtotal: 499,
    description: 'Free delivery on orders above ₹499',
  },
};

const validateCoupon = (rawCode, subtotal) => {
  if (!rawCode) return null;
  const code = String(rawCode).trim().toUpperCase();
  const coupon = COUPONS[code];
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');

  if (subtotal < coupon.minSubtotal) {
    throw new ApiError(
      400,
      `This coupon requires a minimum order of ₹${coupon.minSubtotal}`
    );
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.min(
      Math.round((subtotal * coupon.value) / 100),
      coupon.maxDiscount
    );
  } else if (coupon.type === 'flat') {
    discount = coupon.value;
  }

  return {
    code: coupon.code,
    description: coupon.description,
    discount: Math.min(discount, subtotal),
    freeShipping: coupon.type === 'shipping',
  };
};

const listCoupons = () =>
  Object.values(COUPONS).map(({ code, description, minSubtotal }) => ({
    code,
    description,
    minSubtotal,
  }));

module.exports = { COUPONS, validateCoupon, listCoupons };
