const TOKEN_KEY = 'hs_token';
const USER_KEY = 'hs_user';
const EVENT = 'hs-auth-change';

const listeners = new Set();

function dispatch(token, record) {
  listeners.forEach((fn) => fn(token, record));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { token, record } }));
}

// "Recordarme" off keeps the session in sessionStorage: read both.
const read = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export const authStore = {
  get token() {
    try { return read(TOKEN_KEY) || ''; } catch { return ''; }
  },
  get record() {
    try {
      const raw = read(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  get isValid() {
    return Boolean(this.token);
  },
  save(token, record, { remember = true } = {}) {
    try {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token || '');
        localStorage.setItem(USER_KEY, JSON.stringify(record || null));
      } else {
        sessionStorage.setItem(TOKEN_KEY, token || '');
        sessionStorage.setItem(USER_KEY, JSON.stringify(record || null));
      }
    } catch { /* ignore storage errors */ }
    dispatch(token, record);
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
    dispatch('', null);
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
