import axios from 'axios';
import storage from './storage';

const API_BASE_URL = __DEV__
  ? 'http://192.168.1.194:8080/api/v1'   // Your laptop's local IP — phone and laptop must be on same WiFi
  : 'https://your-render-app.onrender.com/api/v1'; // TODO: update with actual Render URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('token');
      await storage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
