/**
 * Servicio para gestión de compras y proveedores
 */
import api from './api';

const BASE_URL = '/compras';

// ============ PROVEEDORES ============

export const getProveedores = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/proveedores/`, { params });
  return response.data;
};

export const getProveedor = async (id) => {
  const response = await api.get(`${BASE_URL}/proveedores/${id}/`);
  return response.data;
};

export const createProveedor = async (data) => {
  const response = await api.post(`${BASE_URL}/proveedores/`, data);
  return response.data;
};

export const updateProveedor = async (id, data) => {
  const response = await api.put(`${BASE_URL}/proveedores/${id}/`, data);
  return response.data;
};

export const deleteProveedor = async (id) => {
  const response = await api.delete(`${BASE_URL}/proveedores/${id}/`);
  return response.data;
};

export const toggleProveedorActivo = async (id) => {
  const response = await api.post(`${BASE_URL}/proveedores/${id}/toggle_active/`);
  return response.data;
};

// ============ COMPRAS ============

export const getCompras = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/compras/`, { params });
  return response.data;
};

export const getCompra = async (id) => {
  const response = await api.get(`${BASE_URL}/compras/${id}/`);
  return response.data;
};

export const createCompra = async (data) => {
  const response = await api.post(`${BASE_URL}/compras/`, data);
  return response.data;
};

export const cancelarCompra = async (id) => {
  const response = await api.post(`${BASE_URL}/compras/${id}/cancelar/`);
  return response.data;
};

export const getComprasPorProveedor = async (proveedorId) => {
  const response = await api.get(`${BASE_URL}/compras/por_proveedor/`, {
    params: { proveedor_id: proveedorId }
  });
  return response.data;
};

// ============ ADJUNTOS FACTURA (IMÁGENES) ============

export const subirAdjuntoFactura = async (compraId, file) => {
  const formData = new FormData();
  formData.append('archivo', file);
  const response = await api.post(
    `${BASE_URL}/compras/${compraId}/adjuntos_factura/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

/** Descarga un adjunto de factura (abre/guarda el archivo con el nombre indicado) */
export const descargarAdjuntoFactura = async (compraId, adjuntoId, filename = 'factura.jpg') => {
  const response = await api.get(
    `${BASE_URL}/compras/${compraId}/adjuntos_factura/${adjuntoId}/descargar/`,
    { responseType: 'blob' }
  );
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ============ HISTORIAL DE COSTOS ============

export const getHistorialCostos = async (varianteId) => {
  const response = await api.get(`${BASE_URL}/compras/historial_costos/`, {
    params: { variante_id: varianteId }
  });
  return response.data;
};

// ============ ÓRDENES DE COMPRA ============

export const getOrdenes = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/ordenes/`, { params });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results ?? data);
};

export const getOrden = async (id) => {
  const response = await api.get(`${BASE_URL}/ordenes/${id}/`);
  return response.data;
};

export const createOrden = async (data) => {
  const response = await api.post(`${BASE_URL}/ordenes/`, data);
  return response.data;
};

export const emitirOrden = async (id) => {
  const response = await api.post(`${BASE_URL}/ordenes/${id}/emitir/`);
  return response.data;
};

export const recibirOrden = async (id, data) => {
  const response = await api.post(`${BASE_URL}/ordenes/${id}/recibir/`, data);
  return response.data;
};

export const cancelarOrden = async (id) => {
  const response = await api.post(`${BASE_URL}/ordenes/${id}/cancelar/`);
  return response.data;
};

export const getProductosProveedor = async (proveedorId) => {
  const response = await api.get(`${BASE_URL}/proveedores/${proveedorId}/productos/`);
  return response.data;
};

export const previewPdfOrden = async (data) => {
  const response = await api.post(`${BASE_URL}/ordenes/preview_pdf/`, data, {
    responseType: 'blob',
  });
  return response.data;
};

export const generarPdfOrden = async (id) => {
  const response = await api.get(`${BASE_URL}/ordenes/${id}/generar_pdf/`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============ BÚSQUEDAS ============

export const buscarProveedores = async (searchTerm) => {
  const response = await api.get(`${BASE_URL}/proveedores/`, {
    params: { search: searchTerm }
  });
  return response.data;
};

export const buscarCompras = async (searchTerm, params = {}) => {
  const response = await api.get(`${BASE_URL}/compras/`, {
    params: { search: searchTerm, ...params }
  });
  return response.data;
};

export default {
  // Proveedores
  getProveedores,
  getProveedor,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  toggleProveedorActivo,
  buscarProveedores,
  getProductosProveedor,
  // Compras
  getCompras,
  getCompra,
  createCompra,
  cancelarCompra,
  getComprasPorProveedor,
  buscarCompras,
  subirAdjuntoFactura,
  descargarAdjuntoFactura,
  // Historial costos
  getHistorialCostos,
  // Órdenes
  getOrdenes,
  getOrden,
  createOrden,
  emitirOrden,
  recibirOrden,
  cancelarOrden,
  previewPdfOrden,
  generarPdfOrden,
};
