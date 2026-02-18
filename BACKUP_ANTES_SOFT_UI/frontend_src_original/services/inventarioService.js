/**
 * Servicio para gestión de inventario y stock
 */
import api from './api';

const BASE_URL = '/inventario';

// ============ DEPÓSITOS ============

export const getDepositos = async () => {
  const response = await api.get(`${BASE_URL}/depositos/`);
  return response.data;
};

export const getDepositoPrincipal = async () => {
  const response = await api.get(`${BASE_URL}/depositos/principal/`);
  return response.data;
};

export const getDeposito = async (id) => {
  const response = await api.get(`${BASE_URL}/depositos/${id}/`);
  return response.data;
};

export const createDeposito = async (data) => {
  const response = await api.post(`${BASE_URL}/depositos/`, data);
  return response.data;
};

export const updateDeposito = async (id, data) => {
  const response = await api.put(`${BASE_URL}/depositos/${id}/`, data);
  return response.data;
};

export const deleteDeposito = async (id) => {
  const response = await api.delete(`${BASE_URL}/depositos/${id}/`);
  return response.data;
};

// ============ STOCKS ============

export const getStocks = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/stocks/`, { params });
  return response.data;
};

export const getStock = async (id) => {
  const response = await api.get(`${BASE_URL}/stocks/${id}/`);
  return response.data;
};

export const getStocksPorDeposito = async (depositoId) => {
  const response = await api.get(`${BASE_URL}/stocks/`, {
    params: { deposito: depositoId }
  });
  return response.data;
};

export const getStocksPorVariante = async (varianteId) => {
  const response = await api.get(`${BASE_URL}/stocks/por_variante/`, {
    params: { variante_id: varianteId }
  });
  return response.data;
};

export const getStocksCriticos = async (depositoId = null) => {
  const params = depositoId ? { deposito: depositoId } : {};
  const response = await api.get(`${BASE_URL}/stocks/critico/`, { params });
  return response.data;
};

export const ajustarStock = async (data) => {
  const response = await api.post(`${BASE_URL}/stocks/ajustar/`, data);
  return response.data;
};

// ============ MOVIMIENTOS ============

export const getMovimientos = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/movimientos/`, { params });
  return response.data;
};

export const getMovimiento = async (id) => {
  const response = await api.get(`${BASE_URL}/movimientos/${id}/`);
  return response.data;
};

export const getMovimientosPorVariante = async (varianteId, depositoId = null) => {
  const params = { variante_id: varianteId };
  if (depositoId) {
    params.deposito_id = depositoId;
  }
  const response = await api.get(`${BASE_URL}/movimientos/por_variante/`, { params });
  return response.data;
};

export const getResumenDiario = async () => {
  const response = await api.get(`${BASE_URL}/movimientos/resumen_diario/`);
  return response.data;
};

// ============ BÚSQUEDAS Y CONSULTAS ============

export const buscarStocks = async (searchTerm, depositoId = null) => {
  const params = { search: searchTerm };
  if (depositoId) {
    params.deposito = depositoId;
  }
  const response = await api.get(`${BASE_URL}/stocks/`, { params });
  return response.data;
};

export default {
  // Depósitos
  getDepositos,
  getDepositoPrincipal,
  getDeposito,
  createDeposito,
  updateDeposito,
  deleteDeposito,
  
  // Stocks
  getStocks,
  getStock,
  getStocksPorDeposito,
  getStocksPorVariante,
  getStocksCriticos,
  ajustarStock,
  buscarStocks,
  
  // Movimientos
  getMovimientos,
  getMovimiento,
  getMovimientosPorVariante,
  getResumenDiario
};
