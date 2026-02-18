import api from './api';

const clientesService = {
  // Obtener todos los clientes (con paginación y filtros)
  getClientes: async (params = {}) => {
    const response = await api.get('/clientes/', { params });
    return response.data;
  },

  // Obtener un cliente por ID
  getCliente: async (id) => {
    const response = await api.get(`/clientes/${id}/`);
    return response.data;
  },

  // Buscar cliente por DNI
  buscarPorDNI: async (dni) => {
    try {
      const response = await api.get('/clientes/buscar_dni/', {
        params: { dni }
      });
      return { exists: true, cliente: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false, cliente: null };
      }
      throw error;
    }
  },

  // Crear cliente completo
  createCliente: async (data) => {
    const response = await api.post('/clientes/', data);
    return response.data;
  },

  // Alta rápida de cliente (solo DNI, nombre, teléfono)
  quickCreate: async (data) => {
    const response = await api.post('/clientes/quick_create/', data);
    return response.data;
  },

  // Actualizar cliente
  updateCliente: async (id, data) => {
    const response = await api.put(`/clientes/${id}/`, data);
    return response.data;
  },

  // Actualización parcial
  patchCliente: async (id, data) => {
    const response = await api.patch(`/clientes/${id}/`, data);
    return response.data;
  },

  // Eliminar cliente (soft delete - marcar como inactivo)
  toggleActive: async (id) => {
    const response = await api.post(`/clientes/${id}/toggle_active/`);
    return response.data;
  },

  // Obtener historial de compras del cliente
  getHistorial: async (id) => {
    const response = await api.get(`/clientes/${id}/historial/`);
    return response.data;
  },

  // Búsqueda general (por nombre, DNI, teléfono)
  search: async (searchTerm) => {
    const response = await api.get('/clientes/', {
      params: { search: searchTerm }
    });
    return response.data;
  },
};

export default clientesService;
