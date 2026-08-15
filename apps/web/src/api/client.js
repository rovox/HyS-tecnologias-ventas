/**
 * HTTP client for the future NestJS REST API.
 * Unused while VITE_API_MODE=mock. Services switch to this when mode=api.
 */

import { API_URL, isMockMode } from './config.js';

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
  if (isMockMode) {
    throw new Error('api/client.js is not used in mock mode. Call a service instead.');
  }

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
  const contentType = response.headers.get('Content-Type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = payload;
    throw error;
  }
  return payload;
}

export const apiClient = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};

export default apiClient;
