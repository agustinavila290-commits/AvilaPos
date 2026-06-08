/**
 * Servicio para gestión de inventario y stock
 */
import api from './api';

const BASE_URL = '/inventario';

// ============ DEPÓSITOS ============

export const getDepositos = async () => {
  const response = await api.get(`${BASE_URL}/depositos/`);
  const data = response.data;
  // La API devuelve { results: [...] } paginado; normalizar a array
  return Array.isArray(data) ? data : (data?.results ?? []);
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

// ============ INVENTARIO AVANZADO ============

export const getReposicionSugerida = async (depositoId = null) => {
  const params = depositoId ? { deposito: depositoId } : {};
  const response = await api.get(`${BASE_URL}/stocks/reposicion_sugerida/`, { params });
  return response.data;
};

export const getSinMovimiento = async (dias = 60, depositoId = null) => {
  const params = { dias };
  if (depositoId) params.deposito = depositoId;
  const response = await api.get(`${BASE_URL}/stocks/sin_movimiento/`, { params });
  return response.data;
};

export const getMasVendidos = async ({ desde, hasta, depositoId } = {}) => {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  if (depositoId) params.deposito = depositoId;
  const response = await api.get(`${BASE_URL}/stocks/mas_vendidos/`, { params });
  return response.data;
};

export const getMargenBajo = async (umbral = 20, depositoId = null) => {
  const params = { umbral };
  if (depositoId) params.deposito = depositoId;
  const response = await api.get(`${BASE_URL}/stocks/margen_bajo/`, { params });
  return response.data;
};

export const ajusteMasivo = async (data) => {
  const response = await api.post(`${BASE_URL}/stocks/ajuste_masivo/`, data);
  return response.data;
};

// ============ CONTEOS DE INVENTARIO ============

export const getConteos = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/conteos/`, { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
};

export const getConteo = async (id) => {
  const response = await api.get(`${BASE_URL}/conteos/${id}/`);
  return response.data;
};

export const crearConteo = async (data) => {
  const response = await api.post(`${BASE_URL}/conteos/`, data);
  return response.data;
};

export const actualizarItemConteo = async (conteoId, varianteId, cantidadContada) => {
  const response = await api.patch(`${BASE_URL}/conteos/${conteoId}/actualizar_item/`, {
    variante_id: varianteId,
    cantidad_contada: cantidadContada,
  });
  return response.data;
};

export const finalizarConteo = async (conteoId) => {
  const response = await api.post(`${BASE_URL}/conteos/${conteoId}/finalizar/`);
  return response.data;
};

export const cancelarConteo = async (conteoId) => {
  const response = await api.post(`${BASE_URL}/conteos/${conteoId}/cancelar/`);
  return response.data;
};

// ============ COMPATIBILIDAD POR MOTO ============

export const getModelosMoto = async () => {
  const response = await api.get('/tienda/modelos-moto/');
  return Array.isArray(response.data) ? response.data : [];
};

export const getProductosPorMoto = async (motoId) => {
  const response = await api.get(`/tienda/modelos-moto/${motoId}/productos/`);
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
  // Inventario avanzado
  getReposicionSugerida,
  getSinMovimiento,
  getMasVendidos,
  getMargenBajo,
  ajusteMasivo,
  // Conteos
  getConteos,
  getConteo,
  crearConteo,
  actualizarItemConteo,
  finalizarConteo,
  cancelarConteo,
  // Motos
  getModelosMoto,
  getProductosPorMoto,
  // Movimientos
  getMovimientos,
  getMovimiento,
  getMovimientosPorVariante,
  getResumenDiario,
};
