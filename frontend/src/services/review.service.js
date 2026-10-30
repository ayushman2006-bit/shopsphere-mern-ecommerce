import api from './api';

export const reviewService = {
  list: (productId, params) => api.get(`/products/${productId}/reviews`, { params }).then((res) => res.data),
  create: (productId, payload) => api.post(`/products/${productId}/reviews`, payload).then((res) => res.data),
  update: (reviewId, payload) => api.put(`/reviews/${reviewId}`, payload).then((res) => res.data),
  remove: (reviewId) => api.delete(`/reviews/${reviewId}`).then((res) => res.data),
};
