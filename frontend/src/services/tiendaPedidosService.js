import api from './api';

export const getPedidosWeb = (params = {}) =>
  api.get('/tienda/admin/pedidos/', { params }).then(r => r.data);

export const getPedidoWebDetalle = (id) =>
  api.get(`/tienda/admin/pedidos/${id}/`).then(r => r.data);

export const cambiarEstadoPedido = (id, estado) =>
  api.patch(`/tienda/admin/pedidos/${id}/estado/`, { estado }).then(r => r.data);
