/** Safe LocalStorage helpers (SSR-friendly: no-ops on the server). */

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export const STORAGE_KEYS = {
  watchlist: "cineverse:watchlist",
  favorites: "cineverse:favorites",
  recent: "cineverse:recent",
  preferences: "cineverse:preferences",
  reviews: "cineverse:reviews",
  searches: "cineverse:searches",
  auth: "cineverse:auth",
  accounts: "cineverse:accounts",

};

export function readStorage(key, fallback) {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function removeStorage(key) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
