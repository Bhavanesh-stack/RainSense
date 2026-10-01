import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rainsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ─── Assessments ──────────────────────────────────────────
export const assessmentService = {
  analyze: (formData) =>
    api.post('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  getAll: () => api.get('/api/assessments'),
  getById: (id) => api.get(`/api/assessments/${id}`),
  delete: (id) => api.delete(`/api/assessments/${id}`),
  getDashboard: () => api.get('/api/dashboard'),
};

// ─── Reports ──────────────────────────────────────────────
export const reportService = {
  download: async (assessmentId) => {
    const response = await api.get(`/api/reports/${assessmentId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RainSense_Report_${assessmentId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ─── Health ───────────────────────────────────────────────
export const healthService = {
  check: () => api.get('/api/health'),
};

export default api;
