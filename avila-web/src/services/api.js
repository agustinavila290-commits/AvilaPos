/**
 * Cliente API con autenticación JWT para el área admin.
 * Usa fetch con interceptor de token.
 */

const BASE = '/api';

function getToken() {
  return localStorage.getItem('admin_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('admin_refresh_token');
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  localStorage.setItem('admin_access_token', data.access);
  return data.access;
}

export async function api(method, path, body = null, opts = {}) {
  let token = getToken();
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const useFormData = body instanceof FormData;

  const doRequest = (t) => {
    const headers = useFormData ? { ...opts.headers } : { 'Content-Type': 'application/json', ...opts.headers };
    if (t) headers.Authorization = `Bearer ${t}`;
    const init = { method, headers, ...opts };
    if (body && method !== 'GET') init.body = useFormData ? body : JSON.stringify(body);
    return fetch(url, init);
  };

  let res = await doRequest(token);

  if (res.status === 401 && !opts._retried) {
    try {
      token = await refreshAccessToken();
      res = await doRequest(token);
      opts._retried = true;
    } catch {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || `Error ${res.status}`);
  }
  return res.json().catch(() => null);
}

export const apiGet = (path, opts) => api('GET', path, null, opts);
export const apiPost = (path, body, opts) => api('POST', path, body, opts);
export const apiPatch = (path, body, opts) => api('PATCH', path, body, opts);
export const apiDelete = (path, opts) => api('DELETE', path, null, opts);
