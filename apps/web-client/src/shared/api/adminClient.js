import axios from 'axios';

const adminClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

adminClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response?.status === 401 && !config._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => resolve(adminClient(config)));
        });
      }
      config._retry = true;
      isRefreshing = true;
      window.location.href = '/login';
      isRefreshing = false;
      pendingRequests = [];
    }
    if (response?.status === 422) {
      const detail = response.data?.detail;
      if (Array.isArray(detail)) {
        error.message = detail.map((e) => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
      } else if (typeof detail === 'string') {
        error.message = detail;
      }
    }
    return Promise.reject(error);
  }
);

export default adminClient;
