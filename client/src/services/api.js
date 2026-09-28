import axios from 'axios';

// localStorage keys. The Auth/Tenant contexts (Phase 4) will write these
// via the helpers below; this file only READS them on every request.
export const STORAGE_KEYS = {
  token: 'cf_token',
  tenantId: 'cf_tenant_id',
  user: 'cf_user',
};

export const setToken = (token) => localStorage.setItem(STORAGE_KEYS.token, token);
export const setStoredUser = (user) => localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
  } catch {
    return null;
  }
};
export const setTenantId = (id) => localStorage.setItem(STORAGE_KEYS.tenantId, id);
export const clearTenantId = () => localStorage.removeItem(STORAGE_KEYS.tenantId);
// Logout / expired session: wipe EVERYTHING, so a stale tenant id from one
// user can never leak into the next user's requests on the same browser.
export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.tenantId);
  localStorage.removeItem(STORAGE_KEYS.user);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: read fresh from storage on EVERY request so a
// workspace switch takes effect immediately, with no re-creating the client.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const tenantId = localStorage.getItem(STORAGE_KEYS.tenantId);

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;

  return config;
});

// Response interceptor:
//  - surfaces the server's message as error.message, so UI code can just
//    show `err.message`
//  - on 401 from a NON-auth route (expired/invalid token), clears the
//    session and sends the user to /login. Login/register calls are
//    excluded: a wrong password is also a 401, and redirecting there
//    would reload the page and wipe the error message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) error.message = serverMessage;

    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
