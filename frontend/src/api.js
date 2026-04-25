import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const tyresAPI = {
  getAll: (params) => api.get('/tyres', { params }),
  getById: (id) => api.get(`/tyres/${id}`),
  create: (data) => api.post('/tyres', data),
  update: (id, data) => api.put(`/tyres/${id}`, data),
  delete: (id) => api.delete(`/tyres/${id}`),
  getSummary: () => api.get('/tyres/stats/summary'),
};

export const sparePartsAPI = {
  getAll: (params) => api.get('/spare-parts', { params }),
  getById: (id) => api.get(`/spare-parts/${id}`),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`),
  getSummary: () => api.get('/spare-parts/stats/summary'),
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  delete: (id) => api.delete(`/sales/${id}`),
  getToday: () => api.get('/sales/stats/today'),
};

export const reportsAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getWeeklyChart: (days = 14) => api.get('/reports/chart/weekly', { params: { days } }),
  getPaymentsChart: () => api.get('/reports/chart/payments'),
  getDbStats: () => api.get('/reports/db-stats'),
  getYearly: () => api.get('/reports/yearly'),
  getNotifications: () => api.get('/reports/notifications'),
};

export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getOrders: () => api.get('/suppliers/orders'),
  createOrder: (data) => api.post('/suppliers/orders', data),
  receiveOrder: (id) => api.put(`/suppliers/orders/${id}/receive`),
  deleteOrder: (id) => api.delete(`/suppliers/orders/${id}`),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  me: () => api.get('/admin/me'),
  updateProfile: (data) => api.put('/admin/profile', data),
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  activateUser: (id, data) => api.post(`/admin/users/${id}/activate`, data),
  suspendUser: (id) => api.post(`/admin/users/${id}/suspend`),
  recordPayment: (id, data) => api.post(`/admin/users/${id}/payment`, data),
  getPayments: (id) => api.get(`/admin/users/${id}/payments`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRevenueChart: () => api.get('/admin/charts/revenue'),
  getGrowthChart: () => api.get('/admin/charts/growth'),
  getPlansChart: () => api.get('/admin/charts/plans'),
  getExpiring: () => api.get('/admin/expiring'),
  getRecentPayments: () => api.get('/admin/payments/recent'),
  getTopRevenue: () => api.get('/admin/users/top-revenue'),
  getMrr: () => api.get('/admin/mrr'),
};

export default api;
