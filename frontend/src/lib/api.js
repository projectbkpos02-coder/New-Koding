import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';
const API_URL = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Categories APIs
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (name) => api.post('/categories', { name }),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Products APIs
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Production APIs
export const productionsAPI = {
  getAll: () => api.get('/productions'),
  create: (data) => api.post('/productions', data),
};

// Distribution APIs
export const distributionsAPI = {
  getAll: (params) => api.get('/distributions', { params }),
  create: (data) => api.post('/distributions', data),
};

// Rider Stock APIs
export const riderStockAPI = {
  getMyStock: () => api.get('/rider-stock'),
  getRiderStock: (riderId) => api.get(`/rider-stock/${riderId}`),
};

// Transaction APIs
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
};

// Return APIs
export const returnsAPI = {
  getAll: (status) => api.get('/returns', { params: { status } }),
  create: (data) => api.post('/returns', data),
  approve: (id) => api.put(`/returns/${id}/approve`),
  reject: (id) => api.put(`/returns/${id}/reject`),
};

// Reject APIs
export const rejectsAPI = {
  getAll: (status) => api.get('/rejects', { params: { status } }),
  create: (data) => api.post('/rejects', data),
  approve: (id) => api.put(`/rejects/${id}/approve`),
  reject: (id) => api.put(`/rejects/${id}/reject`),
};

// Stock Opname APIs
export const stockOpnameAPI = {
  getAll: (params) => api.get('/stock-opname', { params }),
  create: (data) => api.post('/stock-opname', data),
};

// GPS APIs
export const gpsAPI = {
  updateLocation: (latitude, longitude) => api.post('/gps', { latitude, longitude }),
  getAllLocations: () => api.get('/gps/all'),
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users'),
  getRiders: () => api.get('/users/riders'),
  create: (data) => api.post('/auth/register', data),
  updateRole: (userId, role) => api.put(`/users/${userId}/role?role=${role}`),
  delete: (userId) => api.delete(`/users/${userId}`),
};

// Reports APIs
export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getLeaderboard: (params) => api.get('/reports/leaderboard', { params }),
  getDetailed: (params) => api.get('/reports/detailed', { params }),
  exportCSV: (params) => api.get('/reports/export/csv', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
};

export default api;
