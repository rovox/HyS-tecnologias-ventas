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

  // Without a connection the browser throws "Failed to fetch": say it in Spanish.
  const response = await fetch(buildUrl(path, query), init).catch(() => {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  });
  if (response.status === 401 && token) endSession();
  const contentType = response.headers.get('Content-Type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const raw = payload?.message;
    const message = spanishError(Array.isArray(raw) ? raw.join(', ') : raw, response.status);
    console.error(`[apiClient] ${method} ${path} → ${response.status}`, message, payload);
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;
    throw error;
  }
  return payload;
}

/** NestJS's own English messages (a guard, a route that does not exist, a crash) in Spanish; the API's own stay. */
const NEST_DEFAULTS = [
  [/^Forbidden resource$/, 'No tienes permiso para esta acción'],
  [/^Unauthorized$/, 'Tu sesión venció. Vuelve a entrar.'],
  [/^Internal server error$/, 'Error del servidor. Intenta de nuevo en un momento.'],
  [/Too Many Requests/, 'Demasiados intentos. Espera un momento.'],
  [/^Cannot (GET|POST|PUT|PATCH|DELETE) /, 'Esa acción no existe en el servidor'],
  [/^(Bad Request|Not Found|Conflict)$/, 'No se pudo completar la acción'],
];
function spanishError(message, status) {
  if (!message || typeof message !== 'string') return `Error ${status} del servidor`;
  return NEST_DEFAULTS.find(([pattern]) => pattern.test(message))?.[1] ?? message;
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
