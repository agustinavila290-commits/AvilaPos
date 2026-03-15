/**
 * Servicio API de la tienda (avila-web)
 * Base URL: /api/tienda/ (proxy a backend en desarrollo)
 */

const BASE = '/api/tienda';

export async function getProductos(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/productos/${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function getProducto(id) {
  const res = await fetch(`${BASE}/productos/${id}/`);
  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

export async function getCategorias() {
  const res = await fetch(`${BASE}/categorias/`);
  if (!res.ok) throw new Error('Error al cargar categorías');
  return res.json();
}

export async function getMarcas() {
  const res = await fetch(`${BASE}/marcas/`);
  if (!res.ok) throw new Error('Error al cargar marcas');
  return res.json();
}

export async function getPuntosRetiro() {
  const res = await fetch(`${BASE}/puntos-retiro/`);
  if (!res.ok) throw new Error('Error al cargar puntos de retiro');
  return res.json();
}

export async function crearPedido(data) {
  const res = await fetch(`${BASE}/pedidos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (!res.ok) {
    const msg = json.error || (json.detalle && Array.isArray(json.detalle) ? json.detalle.join(', ') : json.detalle) || 'Error al crear pedido';
    throw new Error(msg);
  }
  return json;
}

export async function crearPreferenciaMercadoPago(ventaId) {
  const res = await fetch(`${BASE}/mercadopago/preferencia/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venta_id: ventaId }),
  });
  if (!res.ok) throw new Error('Error al crear preferencia de pago');
  return res.json();
}
