import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Leads API
export const leadsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/leads?${params}`);
  },
  
  getById: (id) => api.get(`/leads/${id}`),
  
  create: (data) => api.post('/leads', data),
  
  update: (id, data) => api.put(`/leads/${id}`, data),
  
  delete: (id) => api.delete(`/leads/${id}`),
  
  updateStatus: (id, status, notes) => api.patch(`/leads/${id}/status`, { status, notes }),
  
  recordContact: (id, notes, successful) => api.post(`/leads/${id}/contact`, { notes, successful }),
  
  reassign: (id, agentId, reason) => api.patch(`/leads/${id}/reassign`, { agent_id: agentId, reason }),
  
  getStats: () => api.get('/leads/stats/overview'),
  
  getHistory: (id) => api.get(`/leads/${id}/history`),
};

// Agents API
export const agentsAPI = {
  getAll: () => api.get('/agents'),
  
  getById: (id) => api.get(`/agents/${id}`),
  
  create: (data) => api.post('/agents', data),
  
  update: (id, data) => api.put(`/agents/${id}`, data),
  
  delete: (id) => api.delete(`/agents/${id}`),
  
  getStats: () => api.get('/agents/stats/overview'),
  
  getPerformance: (id) => api.get(`/agents/${id}/performance`),
};

export default api;
