import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  // Ensure VITE_API_URL is set in Cloudflare Pages environment variables
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
