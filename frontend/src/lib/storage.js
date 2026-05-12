// window.storage shim — persists data via localStorage.
// Mirrors the spec's API: window.storage.get / set / delete (async, value-wrapped).
// We expose it on the window object once on first import so that components
// can call `window.storage.*` directly (matching the original GENVO spec).

const PREFIX = "genvo:";

const installShim = () => {
  if (typeof window === "undefined") return;
  if (window.__genvoStorageInstalled) return;

  const ls = window.localStorage;

  window.storage = {
    get: async (key) => {
      try {
        const raw = ls.getItem(PREFIX + key);
        return { value: raw };
      } catch (e) {
        return { value: null };
      }
    },
    set: async (key, value) => {
      try {
        ls.setItem(PREFIX + key, value);
        return { ok: true };
      } catch (e) {
        return { ok: false };
      }
    },
    delete: async (key) => {
      try {
        ls.removeItem(PREFIX + key);
        return { ok: true };
      } catch (e) {
        return { ok: false };
      }
    },
  };

  window.__genvoStorageInstalled = true;
};

installShim();

export const storage = typeof window !== "undefined" ? window.storage : null;
