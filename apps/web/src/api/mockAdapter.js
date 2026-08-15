/**
 * PocketBase-compatible client backed by the in-memory mock store.
 *
 * Purpose: existing UI (`pb.collection(...)`) keeps working without the
 * PocketBase SDK or `/hcgi/platform`. New code should call `services/*`.
 *
 * This is NOT PocketBase. Do not treat auth tokens or passwords as production.
 */

import * as store from '@/mocks/store.js';

const AUTH_KEY = 'hs_poc_auth';
const listeners = [];

function notify(token, record) {
  listeners.forEach((fn) => {
    try { fn(token, record); } catch { /* ignore */ }
  });
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { token: null, record: null };
    const parsed = JSON.parse(raw);
    return { token: parsed.token || null, record: parsed.record || null };
  } catch {
    return { token: null, record: null };
  }
}

const initial = typeof localStorage !== 'undefined' ? loadAuth() : { token: null, record: null };

export const authStore = {
  token: initial.token,
  record: initial.record,
  get model() {
    return this.record;
  },
  get isValid() {
    return Boolean(this.token && this.record && this.record.active !== false);
  },
  save(token, record) {
    this.token = token;
    this.record = record;
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token, record }));
    } catch { /* ignore */ }
    notify(token, record);
  },
  clear() {
    this.token = null;
    this.record = null;
    try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
    notify(null, null);
  },
  onChange(callback) {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index >= 0) listeners.splice(index, 1);
    };
  },
};

function delay(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toObject(data) {
  if (data instanceof FormData) {
    const obj = {};
    data.forEach((value, key) => {
      obj[key] = value instanceof File ? value.name : value;
    });
    return obj;
  }
  return { ...(data || {}) };
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.data = { message };
  error.response = { message };
  return error;
}

function applyExpand(record, expand) {
  if (!expand || !record) return record;
  const fields = String(expand).split(',').map((part) => part.trim()).filter(Boolean);
  const expanded = {};
  for (const field of fields) {
    const id = record[field];
    if (!id) continue;
    const fromUsers = store.findById('users', id);
    const fromTec = store.findById('tecnicos', id);
    expanded[field] = fromUsers || fromTec || null;
  }
  return { ...record, expand: expanded };
}

function paginate(items, page = 1, perPage = 50) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage) || 1);
  const start = (page - 1) * perPage;
  return {
    page,
    perPage,
    totalItems,
    totalPages,
    items: items.slice(start, start + perPage),
  };
}

function collectionApi(name) {
  return {
    async getFullList(options = {}) {
      await delay();
      return store.list(name, options).map((row) => applyExpand(row, options.expand));
    },
    async getList(page = 1, perPage = 50, options = {}) {
      await delay();
      const rows = store.list(name, options).map((row) => applyExpand(row, options.expand));
      return paginate(rows, page, perPage);
    },
    async getOne(id, options = {}) {
      await delay();
      const row = store.findById(name, id);
      if (!row) throw httpError(404, `Missing record ${id}`);
      return applyExpand(row, options.expand);
    },
    async getFirstListItem(filter, options = {}) {
      await delay();
      const rows = store.list(name, { ...options, filter });
      if (!rows.length) throw httpError(404, 'The requested resource wasn\'t found.');
      return applyExpand(rows[0], options.expand);
    },
    async create(data) {
      await delay();
      const payload = toObject(data);
      if (!payload.created_by && authStore.record?.id) {
        payload.created_by = authStore.record.id;
      }
      return store.insert(name, payload);
    },
    async update(id, data) {
      await delay();
      const updated = store.update(name, id, toObject(data));
      if (!updated) throw httpError(404, `Missing record ${id}`);
      return updated;
    },
    async delete(id) {
      await delay();
      const ok = store.remove(name, id);
      if (!ok) throw httpError(404, `Missing record ${id}`);
      return true;
    },
    async authWithPassword(email, password) {
      await delay(120);
      const users = store.list('users');
      const user = users.find((row) => row.email.toLowerCase() === String(email).toLowerCase());
      if (!user || user.password !== password) {
        throw httpError(400, 'Failed to authenticate.');
      }
      if (user.active === false) {
        throw httpError(403, 'Cuenta desactivada.');
      }
      const { password: _omit, ...safe } = user;
      const token = `poc.${safe.id}.${Date.now()}`;
      authStore.save(token, safe);
      return { token, record: safe };
    },
    async requestPasswordReset() {
      await delay();
      return true;
    },
    async subscribe() {
      return () => {};
    },
    unsubscribe() {},
  };
}

const mockAdapter = {
  authStore,
  collection: collectionApi,
  files: {
    getUrl(_record, filename) {
      if (!filename) return '';
      return `/branding/document-placeholder.svg`;
    },
    getURL(record, filename) {
      return this.getUrl(record, filename);
    },
  },
  filter: (template, ..._params) => template,
};

export default mockAdapter;
