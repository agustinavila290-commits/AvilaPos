import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al montar
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = authService.getUser();
          setUser(userData);
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      const message = (Array.isArray(data?.non_field_errors) && data.non_field_errors[0])
        || (typeof data?.detail === 'string' && data.detail)
        || (Array.isArray(data?.detail) && data.detail[0])
        || (data?.username && (Array.isArray(data.username) ? data.username[0] : data.username))
        || (data?.password && (Array.isArray(data.password) ? data.password[0] : data.password))
        || 'Error al iniciar sesión. Verifica tus credenciales.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.es_administrador || false;
  };

  const isCajero = () => {
    return user?.es_cajero || user?.es_administrador || false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCajero,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
