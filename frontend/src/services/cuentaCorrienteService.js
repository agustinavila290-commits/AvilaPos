/**
 * Servicio para tickets de cuenta corriente
 */
import api from './api';

const BASE_URL = '/cuenta-corriente';

export const getTickets = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/tickets/`, { params });
  const data = response.data;
  return data.results ?? data;
};

export const getTicket = async (id) => {
  const response = await api.get(`${BASE_URL}/tickets/${id}/`);
  return response.data;
};

export const crearTicket = async (data) => {
  const response = await api.post(`${BASE_URL}/tickets/`, data);
  return response.data;
};

export const agregarItem = async (ticketId, data) => {
  const response = await api.post(`${BASE_URL}/tickets/${ticketId}/agregar_item/`, data);
  return response.data;
};

export const devolverItem = async (ticketId, detalleId, cantidad) => {
  const response = await api.post(`${BASE_URL}/tickets/${ticketId}/devolver_item/`, {
    detalle_id: detalleId,
    cantidad,
  });
  return response.data;
};

export const cerrarTicket = async (ticketId, metodoPago) => {
  const response = await api.post(`${BASE_URL}/tickets/${ticketId}/cerrar/`, {
    metodo_pago: metodoPago,
  });
  return response.data;
};

export const registrarPago = async (ticketId, data) => {
  const response = await api.post(`${BASE_URL}/tickets/${ticketId}/registrar_pago/`, data);
  return response.data;
};

export const getSaldoCliente = async (clienteId) => {
  const response = await api.get(`${BASE_URL}/tickets/saldo_cliente/`, { params: { cliente_id: clienteId } });
  return response.data;
};

export default {
  getTickets,
  getTicket,
  crearTicket,
  agregarItem,
  devolverItem,
  cerrarTicket,
  registrarPago,
  getSaldoCliente,
};
