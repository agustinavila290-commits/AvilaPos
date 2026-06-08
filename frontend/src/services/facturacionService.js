import api from './api';

const BASE_URL = '/facturacion';

export const crearFactura = async (data) => {
  const response = await api.post(`${BASE_URL}/facturas/`, data);
  return response.data;
};

export const autorizarFactura = async (id) => {
  const response = await api.post(`${BASE_URL}/facturas/${id}/autorizar_afip/`);
  return response.data;
};

export const generarPdfFactura = async (id) => {
  const response = await api.get(`${BASE_URL}/facturas/${id}/generar_pdf/`, {
    responseType: 'blob'
  });
  return response;
};

export const listarPuntosVenta = async () => {
  const response = await api.get(`${BASE_URL}/puntos-venta/`);
  const data = response.data;
  // Puede venir paginado (DRF): { results: [...] } o como array directo
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export const regenerarPdfFactura = async (id) => {
  const response = await api.post(`${BASE_URL}/facturas/${id}/regenerar_pdf/`);
  return response.data;
};

export default {
  crearFactura,
  autorizarFactura,
  generarPdfFactura,
  regenerarPdfFactura,
  listarPuntosVenta,
};

