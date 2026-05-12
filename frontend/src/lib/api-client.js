import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "/_/backend";
export const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEYS = {
  access: "genvo:auth_access",
  refresh: "genvo:auth_refresh",
};

const readToken = (k) => {
  try { return localStorage.getItem(k) || ""; } catch (e) { return ""; }
};

const writeToken = (k, v) => {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch (e) {}
};

// Create axios instance
export const api = axios.create({ baseURL: API_BASE });

// Request interceptor for Auth header
api.interceptors.request.use((config) => {
  const t = readToken(TOKEN_KEYS.access);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Refresh token logic
let refreshing = null;
const tryRefresh = async () => {
  const refresh = readToken(TOKEN_KEYS.refresh);
  if (!refresh) throw new Error("no refresh token");
  if (!refreshing) {
    refreshing = axios
      .post(`${API_BASE}/auth/refresh`, { refresh_token: refresh })
      .then((r) => {
        writeToken(TOKEN_KEYS.access, r.data.access_token);
        return r.data.access_token;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
};

// Response interceptor for auto-refresh
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config || {};
    if (err.response?.status === 401 && !original._retry && readToken(TOKEN_KEYS.refresh)) {
      original._retry = true;
      try {
        const newAccess = await tryRefresh();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        // tokens invalid
        writeToken(TOKEN_KEYS.access, "");
        writeToken(TOKEN_KEYS.refresh, "");
      }
    }
    return Promise.reject(err);
  }
);
