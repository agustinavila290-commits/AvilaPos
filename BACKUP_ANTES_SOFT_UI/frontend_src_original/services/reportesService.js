/**
 * Servicio para reportes y análisis
 */
import api from './api';

const BASE_URL = '/reportes';

// ============ DASHBOARD ============

export const getResumenDashboard = async () => {
  const response = await api.get(`${BASE_URL}/dashboard/`);
  return response.data;
};

// ============ VENTAS ============

export const getVentasPorPeriodo = async (params) => {
  const response = await api.get(`${BASE_URL}/ventas/periodo/`, { params });
  return response.data;
};

// ============ PRODUCTOS ============

export const getProductosMasVendidos = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/productos/mas-vendidos/`, { params });
  return response.data;
};

export const getMargenPorProducto = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/productos/margen/`, { params });
  return response.data;
};

// ============ INVENTARIO ============

export const getStockCritico = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/inventario/stock-critico/`, { params });
  return response.data;
};

// ============ CLIENTES ============

export const getHistorialCliente = async (clienteId) => {
  const response = await api.get(`${BASE_URL}/clientes/${clienteId}/historial/`);
  return response.data;
};

// ============ EXPORTACIÓN ============

export const exportarVentasExcel = async (params) => {
  const data = await getVentasPorPeriodo(params);
  return data;
};

/**
 * Descarga Excel de ventas por período.
 * Parámetros: fecha_desde, fecha_hasta (YYYY-MM-DD)
 */
export const descargarVentasPeriodoExcel = async (params) => {
  const response = await api.get('/reportes/ventas/periodo/export-excel/', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventas_${params.fecha_desde}_${params.fecha_hasta}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Descarga Excel de productos más vendidos.
 * Parámetros: tipo, limite, fecha_desde, fecha_hasta
 */
export const descargarProductosMasVendidosExcel = async (params = {}) => {
  const response = await api.get('/reportes/productos/mas-vendidos/export-excel/', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'productos_mas_vendidos.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
};

export default {
  getResumenDashboard,
  getVentasPorPeriodo,
  getProductosMasVendidos,
  getMargenPorProducto,
  getStockCritico,
  getHistorialCliente,
  exportarVentasExcel,
  descargarVentasPeriodoExcel,
  descargarProductosMasVendidosExcel,
};
