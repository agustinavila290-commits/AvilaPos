/**
 * Servicio para gestión de devoluciones
 */
import api from './api';

const BASE_URL = '/devoluciones';

// ============ DEVOLUCIONES ============

export const getDevoluciones = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/devoluciones/`, { params });
  return response.data;
};

export const getDevolucion = async (id) => {
  const response = await api.get(`${BASE_URL}/devoluciones/${id}/`);
  return response.data;
};

export const createDevolucion = async (data) => {
  const response = await api.post(`${BASE_URL}/devoluciones/`, data);
  return response.data;
};

export const cancelarDevolucion = async (id) => {
  const response = await api.post(`${BASE_URL}/devoluciones/${id}/cancelar/`);
  return response.data;
};

export const getProductosDevolubles = async (ventaId) => {
  const response = await api.get(`${BASE_URL}/devoluciones/productos_devolubles/`, {
    params: { venta_id: ventaId }
  });
  return response.data;
};

// ============ NOTAS DE CRÉDITO ============

export const getNotasCredito = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/notas-credito/`, { params });
  return response.data;
};

export const getNotaCredito = async (id) => {
  const response = await api.get(`${BASE_URL}/notas-credito/${id}/`);
  return response.data;
};

export const getNotasCreditoActivas = async (clienteId) => {
  const response = await api.get(`${BASE_URL}/notas-credito/activas_cliente/`, {
    params: { cliente_id: clienteId }
  });
  return response.data;
};

export const cancelarNotaCredito = async (id) => {
  const response = await api.post(`${BASE_URL}/notas-credito/${id}/cancelar/`);
  return response.data;
};

export default {
  getDevoluciones,
  getDevolucion,
  createDevolucion,
  cancelarDevolucion,
  getProductosDevolubles,
  getNotasCredito,
  getNotaCredito,
  getNotasCreditoActivas,
  cancelarNotaCredito
};
