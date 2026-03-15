/**
 * Servicio API para el panel admin de la tienda.
 * Requiere autenticación (Bearer token).
 * Los productos vienen del POS (ProductoBase + VarianteProducto).
 */

import { apiGet, apiPatch, api } from './api'

export async function getPedidos(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const path = qs ? `/tienda/admin/pedidos/?${qs}` : '/tienda/admin/pedidos/'
  return apiGet(path)
}

export async function getPedido(id) {
  return apiGet(`/tienda/admin/pedidos/${id}/`)
}

export async function getVariantes(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const path = qs ? `/productos/variantes/?${qs}` : '/productos/variantes/'
  return apiGet(path)
}

export async function getVariante(id) {
  return apiGet(`/productos/variantes/${id}/`)
}

export async function updateVariante(id, data) {
  return apiPatch(`/productos/variantes/${id}/`, data)
}

export async function getMarcas() {
  return apiGet('/productos/marcas/')
}

export async function getCategorias() {
  return apiGet('/productos/categorias/')
}

/** Productos base del POS (tienen imagen y variantes) */
export async function getProductos(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const path = qs ? `/productos/productos/?${qs}` : '/productos/productos/'
  return apiGet(path)
}

export async function getProducto(id) {
  return apiGet(`/productos/productos/${id}/`)
}

/** Subir imagen del producto (ProductoBase). Envía FormData con 'imagen' */
export async function uploadProductoImagen(productoBaseId, file) {
  const formData = new FormData()
  formData.append('imagen', file)
  return api('PATCH', `/productos/productos/${productoBaseId}/`, formData)
}
