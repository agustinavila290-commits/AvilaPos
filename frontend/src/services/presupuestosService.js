import api from './api';

const BASE = '/ventas/presupuestos';

export const getPresupuestos = (params = {}) =>
  api.get(`${BASE}/`, { params }).then(r => r.data);

export const getPresupuesto = (id) =>
  api.get(`${BASE}/${id}/`).then(r => r.data);

export const crearPresupuesto = (data) =>
  api.post(`${BASE}/`, data).then(r => r.data);

export const actualizarPresupuesto = (id, data) =>
  api.patch(`${BASE}/${id}/`, data).then(r => r.data);

export const eliminarPresupuesto = (id) =>
  api.delete(`${BASE}/${id}/`).then(r => r.data);

export const descargarPdfPresupuesto = (id) =>
  api.get(`${BASE}/${id}/pdf/`, { responseType: 'blob' });

export const convertirPresupuesto = (id, metodoPago = 'EFECTIVO', extra = {}) =>
  api.post(`${BASE}/${id}/convertir/`, { metodo_pago: metodoPago, ...extra }).then(r => r.data);

export const marcarEnviado = (id) =>
  api.patch(`${BASE}/${id}/marcar_enviado/`).then(r => r.data);

export default {
  getPresupuestos, getPresupuesto, crearPresupuesto, actualizarPresupuesto,
  eliminarPresupuesto, descargarPdfPresupuesto, convertirPresupuesto, marcarEnviado,
};
