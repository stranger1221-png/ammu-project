// GENVO — AuthContext: handles auth state, login/register/logout, token refresh,
// cloud sync of progress + custom words + theme.

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "/_/backend";
export const API = `${BACKEND_URL}/api`;

const AuthCtx = createContext(null);

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

// Standalone axios instance with auto-refresh interceptor.
export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const t = readToken(TOKEN_KEYS.access);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = null;
const tryRefresh = async () => {
  const refresh = readToken(TOKEN_KEYS.refresh);
  if (!refresh) throw new Error("no refresh token");
  if (!refreshing) {
    refreshing = axios
      .post(`${API}/auth/refresh`, { refresh_token: refresh })
      .then((r) => {
        writeToken(TOKEN_KEYS.access, r.data.access_token);
        return r.data.access_token;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
};

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
        // fall through — caller will get 401
      }
    }
    return Promise.reject(err);
  }
);

export const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const refreshTokenRef = useRef("");

  // On mount, hydrate.
  useEffect(() => {
    refreshTokenRef.current = readToken(TOKEN_KEYS.refresh);
    const access = readToken(TOKEN_KEYS.access);
    if (!access && !refreshTokenRef.current) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const r = await api.get("/auth/me");
        setUser(r.data.user);
      } catch (e) {
        // tokens invalid / expired
        writeToken(TOKEN_KEYS.access, "");
        writeToken(TOKEN_KEYS.refresh, "");
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const r = await api.post("/auth/login", { email, password, remember: !!remember });
    writeToken(TOKEN_KEYS.access, r.data.access_token);
    writeToken(TOKEN_KEYS.refresh, r.data.refresh_token);
    refreshTokenRef.current = r.data.refresh_token;
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const register = useCallback(async ({ email, password, name, icon, remember }) => {
    const r = await api.post("/auth/register", { email, password, name, icon, remember: !!remember });
    writeToken(TOKEN_KEYS.access, r.data.access_token);
    writeToken(TOKEN_KEYS.refresh, r.data.refresh_token);
    refreshTokenRef.current = r.data.refresh_token;
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = refreshTokenRef.current || readToken(TOKEN_KEYS.refresh);
    try {
      if (refresh) await api.post("/auth/logout", { refresh_token: refresh });
    } catch (e) { /* noop */ }
    writeToken(TOKEN_KEYS.access, "");
    writeToken(TOKEN_KEYS.refresh, "");
    refreshTokenRef.current = "";
    setUser(null);
  }, []);

  const updateProfile = useCallback(async ({ name, icon }) => {
    const r = await api.put("/auth/profile", { name, icon });
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const changePassword = useCallback(async ({ current_password, new_password }) => {
    await api.put("/auth/password", { current_password, new_password });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const r = await api.post("/auth/forgot-password", { email });
    return r.data; // includes reset_token (dev only — replace with email in prod)
  }, []);

  const resetPassword = useCallback(async ({ token, password }) => {
    await api.post("/auth/reset-password", { token, password });
  }, []);

  const listSessions = useCallback(async () => {
    const r = await api.get("/auth/sessions");
    return r.data.sessions || [];
  }, []);

  const revokeSession = useCallback(async (sid) => {
    await api.delete(`/auth/sessions/${sid}`);
  }, []);

  const logoutEverywhere = useCallback(async () => {
    await api.post("/auth/logout-everywhere");
    writeToken(TOKEN_KEYS.access, "");
    writeToken(TOKEN_KEYS.refresh, "");
    refreshTokenRef.current = "";
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user, checking,
        login, register, logout,
        updateProfile, changePassword,
        forgotPassword, resetPassword,
        listSessions, revokeSession, logoutEverywhere,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ---- Cloud sync helpers ----
export const cloudSyncGet = async () => {
  const r = await api.get("/sync");
  return r.data;
};
export const cloudSyncSet = async (payload) => {
  const r = await api.post("/sync", payload);
  return r.data;
};
