import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/tienda`
  : '/api/tienda'

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
})

// Interceptor: adjunta el token del cliente web si existe
api.interceptors.request.use(config => {
  const token = localStorage.getItem('avila_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const tiendaApi = {
  getProductos: (params) => api.get('/productos/', { params }),
  getProducto: (id) => api.get(`/productos/${id}/`),
  getCategorias: () => api.get('/categorias/'),
  getMarcas: () => api.get('/marcas/'),
  getModelosMoto: () => api.get('/modelos-moto/'),
  getPuntosRetiro: () => api.get('/puntos-retiro/'),
  crearPedido: (data) => api.post('/pedidos/', data),
  crearPreferenciaMercadoPago: (data) => api.post('/mercadopago/preferencia/', data),
  getPedidoEstado: (numero) => api.get(`/pedidos/${numero}/estado/`),
}

export const authApi = {
  registro: (data) => api.post('/auth/registro/', data),
  login: (data) => api.post('/auth/login/', data),
  loginGoogle: (idToken) => api.post('/auth/google/', { id_token: idToken }),
  me: () => api.get('/auth/me/'),
  misPedidos: () => api.get('/mis-pedidos/'),
}
