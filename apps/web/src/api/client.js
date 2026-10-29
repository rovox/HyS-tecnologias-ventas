import { API_URL } from './config.js';
import { authStore } from '@/lib/authStore.js';

let sessionEnded = false;
/**
 * A 401 on a request that carried a token: the session expired, was closed elsewhere or the account was deactivated.
 * Clear it and go to the login once, instead of leaving the screen half-loaded with an error per query.
 */
function endSession() {
  if (sessionEnded) return;
  sessionEnded = true;
  authStore.clear();
  window.location.replace('/login?expirada=1');
}

function buildUrl(path, query) {
  const url = new URL(path.replace(/^\//, ''), API_URL.endsWith('/') ? API_URL : `${API_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request(method, path, { body, query, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(buildUrl(path, query), init);
  if (response.status === 401 && token) endSession();
  const contentType = response.headers.get('Content-Type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const raw = payload?.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw || `HTTP ${response.status}`;
    console.error(`[apiClient] ${method} ${path} → ${response.status}`, message, payload);
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;
    throw error;
  }
  return payload;
}

/** A file from the API (PDF, Excel) with the session token; same 401 handling as every other request. */
export async function fetchFile(path) {
  const response = await fetch(buildUrl(path), { headers: { Authorization: `Bearer ${authStore.token}` } });
  if (response.status === 401) endSession();
  return response;
}

export const apiClient = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};

export default apiClient;
