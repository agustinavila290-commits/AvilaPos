import api from './api';

const productosService = {
  // ========== MARCAS ==========
  getMarcas: async (params = {}) => {
    const response = await api.get('/productos/marcas/', { params });
    return response.data;
  },

  createMarca: async (data) => {
    const response = await api.post('/productos/marcas/', data);
    return response.data;
  },

  // ========== CATEGORÍAS ==========
  getCategorias: async (params = {}) => {
    const response = await api.get('/productos/categorias/', { params });
    return response.data;
  },

  createCategoria: async (data) => {
    const response = await api.post('/productos/categorias/', data);
    return response.data;
  },

  // ========== PRODUCTOS BASE ==========
  getProductos: async (params = {}) => {
    const response = await api.get('/productos/productos/', { params });
    return response.data;
  },

  getProducto: async (id) => {
    const response = await api.get(`/productos/productos/${id}/`);
    return response.data;
  },

  createProducto: async (data) => {
    const response = await api.post('/productos/productos/', data);
    return response.data;
  },

  updateProducto: async (id, data) => {
    const response = await api.put(`/productos/productos/${id}/`, data);
    return response.data;
  },

  deleteProducto: async (id) => {
    const response = await api.delete(`/productos/productos/${id}/`);
    return response.data;
  },

  // ========== VARIANTES ==========
  getVariantes: async (params = {}) => {
    const response = await api.get('/productos/variantes/', { params });
    return response.data;
  },

  getVariante: async (id) => {
    const response = await api.get(`/productos/variantes/${id}/`);
    return response.data;
  },

  createVariante: async (data) => {
    const response = await api.post('/productos/variantes/', data);
    return response.data;
  },

  updateVariante: async (id, data) => {
    const response = await api.put(`/productos/variantes/${id}/`, data);
    return response.data;
  },

  deleteVariante: async (id) => {
    const response = await api.delete(`/productos/variantes/${id}/`);
    return response.data;
  },

  // Búsqueda por código
  buscarPorCodigo: async (codigo) => {
    try {
      const response = await api.get('/productos/variantes/buscar_codigo/', {
        params: { codigo }
      });
      return { found: true, variante: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { found: false, variante: null };
      }
      throw error;
    }
  },

  // Búsqueda general (page_size para POS; signal para cancelar petición anterior)
  search: async (searchTerm, options = {}) => {
    const params = { search: searchTerm };
    if (options.page_size != null) params.page_size = options.page_size;
    const config = { params };
    if (options.signal) config.signal = options.signal;
    const response = await api.get('/productos/variantes/', config);
    return response.data;
  },

  // ========== IMPORTACIÓN MASIVA ==========
  importarExcel: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/productos/variantes/importar_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  },
};

export default productosService;
