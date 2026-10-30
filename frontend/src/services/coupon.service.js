import api from './api';

export const couponService = {
  list: () => api.get('/coupons').then((res) => res.data),
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }).then((res) => res.data),
};
