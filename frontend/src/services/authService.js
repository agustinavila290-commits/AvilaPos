import api from './api';

const authService = {
  // Login
  login: async (username, password) => {
    const response = await api.post('/auth/auth/login/', {
      username,
      password,
    });
    
    const { access, refresh, user } = response.data;
    
    // Guardar tokens y usuario en localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Error al hacer logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const response = await api.get('/auth/auth/me/');
    return response.data;
  },

  // Verificar si hay sesión activa
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Obtener usuario del localStorage
  getUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};

export default authService;
