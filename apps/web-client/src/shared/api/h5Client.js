import axios from 'axios';

const h5Client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

h5Client.interceptors.request.use((config) => {
  const studentToken = localStorage.getItem('student_token');
  if (studentToken) {
    config.headers['X-Student-Token'] = studentToken;
  }
  return config;
});

h5Client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('student_token');
      window.location.href = '/h5/verify';
    }
    return Promise.reject(error);
  }
);

export default h5Client;
