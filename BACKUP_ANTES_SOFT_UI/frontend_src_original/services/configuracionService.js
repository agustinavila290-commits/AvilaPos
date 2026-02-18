/**
 * Servicio para gestión de configuraciones del sistema
 */
import api from './api';

const BASE_URL = '/configuracion';

// ============ CONFIGURACIONES ============

export const getConfiguraciones = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/configuraciones/`, { params });
  return response.data;
};

export const getConfiguracion = async (id) => {
  const response = await api.get(`${BASE_URL}/configuraciones/${id}/`);
  return response.data;
};

export const updateConfiguracion = async (id, data) => {
  const response = await api.put(`${BASE_URL}/configuraciones/${id}/`, data);
  return response.data;
};

export const actualizarValorConfig = async (id, valor) => {
  const response = await api.patch(`${BASE_URL}/configuraciones/${id}/actualizar_valor/`, {
    valor: valor.toString()
  });
  return response.data;
};

export const actualizarMultiples = async (configuraciones) => {
  const response = await api.post(`${BASE_URL}/configuraciones/actualizar_multiple/`, {
    configuraciones
  });
  return response.data;
};

// ============ CONSULTAS ESPECÍFICAS ============

export const getConfiguracionPorClave = async (clave) => {
  const response = await api.get(`${BASE_URL}/configuraciones/obtener_valor/`, {
    params: { clave }
  });
  return response.data;
};

export const getConfiguracionesPorCategoria = async (categoria) => {
  const response = await api.get(`${BASE_URL}/configuraciones/por_categoria/`, {
    params: { categoria }
  });
  return response.data;
};

export const getCategorias = async () => {
  const response = await api.get(`${BASE_URL}/configuraciones/categorias/`);
  return response.data;
};

// ============ HELPERS ============

export const getValorConfig = async (clave, defaultValue = null) => {
  try {
    const data = await getConfiguracionPorClave(clave);
    return data.valor;
  } catch (err) {
    console.warn(`Config ${clave} no encontrada, usando default:`, defaultValue);
    return defaultValue;
  }
};

export default {
  getConfiguraciones,
  getConfiguracion,
  updateConfiguracion,
  actualizarValorConfig,
  actualizarMultiples,
  getConfiguracionPorClave,
  getConfiguracionesPorCategoria,
  getCategorias,
  getValorConfig
};
