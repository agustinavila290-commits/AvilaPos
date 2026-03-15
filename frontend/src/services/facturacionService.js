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
  return response.data;
};

export default {
  crearFactura,
  autorizarFactura,
  generarPdfFactura,
  listarPuntosVenta
};

