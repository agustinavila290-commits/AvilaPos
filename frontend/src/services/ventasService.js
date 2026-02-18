/**
 * Servicio para gestión de ventas
 */
import api from './api';

const BASE_URL = '/ventas';

// ============ VENTAS ============

export const getVentas = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/ventas/`, { params });
  return response.data;
};

export const getVenta = async (id) => {
  const response = await api.get(`${BASE_URL}/ventas/${id}/`);
  return response.data;
};

export const createVenta = async (data) => {
  const response = await api.post(`${BASE_URL}/ventas/`, data);
  return response.data;
};

export const anularVenta = async (id, motivo) => {
  const response = await api.post(`${BASE_URL}/ventas/${id}/anular/`, { motivo });
  return response.data;
};

// ============ CONSULTAS ============

export const getResumenDiario = async () => {
  const response = await api.get(`${BASE_URL}/ventas/resumen_diario/`);
  return response.data;
};

export const getVentasPorFecha = async (fechaDesde, fechaHasta) => {
  const response = await api.get(`${BASE_URL}/ventas/por_fecha/`, {
    params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
  });
  return response.data;
};

export const getVentasPorCliente = async (clienteId) => {
  const response = await api.get(`${BASE_URL}/ventas/por_cliente/`, {
    params: { cliente_id: clienteId }
  });
  return response.data;
};

// ============ BÚSQUEDAS ============

export const buscarVentas = async (searchTerm, params = {}) => {
  const response = await api.get(`${BASE_URL}/ventas/`, {
    params: { search: searchTerm, ...params }
  });
  return response.data;
};

export default {
  getVentas,
  getVenta,
  createVenta,
  anularVenta,
  getResumenDiario,
  getVentasPorFecha,
  getVentasPorCliente,
  buscarVentas
};
