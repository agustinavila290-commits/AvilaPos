/**
 * Servicio de autenticación para el área admin.
 * Usa el backend /api/auth/ (JWT).
 */

const BASE = '/api';

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.non_field_errors?.[0] || data.detail || 'Error al iniciar sesión';
    throw new Error(msg);
  }
  const { access, refresh, user } = data;
  localStorage.setItem('admin_access_token', access);
  localStorage.setItem('admin_refresh_token', refresh);
  localStorage.setItem('admin_user', JSON.stringify(user));
  return user;
}

export async function logout() {
  try {
    const refresh = localStorage.getItem('admin_refresh_token');
    if (refresh) {
      const token = localStorage.getItem('admin_access_token');
      await fetch(`${BASE}/auth/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ refresh }),
      });
    }
  } catch (e) {
    console.warn('Logout error', e);
  } finally {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
  }
}

export function getStoredUser() {
  try {
    const s = localStorage.getItem('admin_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('admin_access_token');
}
