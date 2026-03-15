/**
 * Servicio para integración con Clover POSnet.
 * Procesar pagos con tarjeta y consultar configuración.
 */
import api from './api';

/**
 * Procesa un pago con tarjeta en el dispositivo Clover.
 * @param {Object} data - { monto: number, descripcion?: string, orden_id?: string }
 * @returns {Promise<{ exito: boolean, payment_id?: string, estado: string, datos: object, error?: string, clover_pago_id?: number }>}
 */
export async function procesarPagoClover(data) {
  const response = await api.post('/clover/procesar-pago/', data);
  return response.data;
}

/**
 * Indica si Clover está configurado y activo.
 * @returns {Promise<{ activo: boolean, nombre?: string }>}
 */
export async function getConfigClover() {
  const response = await api.get('/clover/config/');
  return response.data;
}

/**
 * Prueba la conexión con Clover (endpoint, credenciales, red).
 * No crea órdenes ni procesa pagos.
 * @returns {Promise<{ success: boolean, mensaje: string }>}
 */
export async function probarConexionClover() {
  const response = await api.post('/clover/probar-conexion/');
  return response.data;
}
