import api from './api';

export const adminService = {
  stats: (days = 7) => api.get('/admin/stats', { params: { days } }).then((res) => res.data),
  users: (params) => api.get('/admin/users', { params }).then((res) => res.data),
  user: (id) => api.get(`/admin/users/${id}`).then((res) => res.data),
  blockUser: (id, isBlocked) => api.put(`/admin/users/${id}/block`, { isBlocked }).then((res) => res.data),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then((res) => res.data),
  orders: (params) => api.get('/admin/orders', { params }).then((res) => res.data),
  updateOrderStatus: (id, status, note) =>
    api.put(`/admin/orders/${id}/status`, { status, note }).then((res) => res.data),
};
