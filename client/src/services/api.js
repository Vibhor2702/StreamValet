import axios from 'axios';

const api = axios.create({
  baseURL: '/',
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
