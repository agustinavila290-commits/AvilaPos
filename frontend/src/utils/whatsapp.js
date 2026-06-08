/**
 * Utilidades centralizadas para WhatsApp (wa.me links).
 * Toda la integración es 100% frontend — sin API externa.
 * Los mensajes se abren en WhatsApp Web/mobile con el texto prearmado.
 */

import { EMPRESA } from '../constants/empresa';

// ── Helpers base ──────────────────────────────────────────────────────────────

/**
 * Formatea un número de teléfono argentino para wa.me.
 * Agrega prefijo 549 (Argentina) si el número tiene >= 8 dígitos.
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits || digits.length < 8) return '';
  // Si ya empieza con 54, no duplicar
  if (digits.startsWith('54')) return digits;
  return `549${digits}`;
}

/**
 * Construye una URL wa.me con mensaje preformateado.
 * @param {string} phone — número de teléfono (cualquier formato)
 * @param {string} mensaje — texto del mensaje (sin encodear)
 * @returns {string} URL completa para abrir WhatsApp
 */
export function buildWaLink(phone, mensaje) {
  const num = formatPhone(phone);
  const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Abre WhatsApp directamente en una nueva pestaña.
 */
export function openWhatsApp(phone, mensaje) {
  window.open(buildWaLink(phone, mensaje), '_blank', 'noopener,noreferrer');
}

// ── Utilidades de formato ─────────────────────────────────────────────────────

const fmtFecha = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso; }
};

const fmtPesos = (n) => {
  const v = parseFloat(n) || 0;
  return `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ── Templates de mensajes ─────────────────────────────────────────────────────

/**
 * Comprobante de venta (ticket de mostrador).
 */
export function msgComprobante(venta) {
  const cliente = venta.cliente_nombre || venta.cliente?.nombre || 'Consumidor Final';
  const metodo = venta.metodo_pago || '';
  const items = (venta.items || venta.detalles || [])
    .map(i => `• ${i.nombre || i.nombre_completo || i.codigo || ''} x${i.cantidad} = ${fmtPesos(i.subtotal)}`)
    .join('\n');
  const descuento = parseFloat(venta.descuento_monto) > 0
    ? `\nDescuento: -${fmtPesos(venta.descuento_monto)}`
    : '';

  return (
    `*Comprobante de Venta — ${EMPRESA.nombre}*\n` +
    `Venta N°: ${String(venta.numero).padStart(5, '0')}\n` +
    `Fecha: ${fmtFecha(venta.fecha)}\n` +
    `Cliente: ${cliente}\n` +
    `Método de pago: ${metodo}\n` +
    `\n*Detalle:*\n${items || '(sin detalle)'}` +
    `${descuento}\n` +
    `\n*Total: ${fmtPesos(venta.total)}*\n` +
    `\nGracias por su compra 🏍️\n` +
    `Consultas: ${EMPRESA.telefono}`
  );
}

/**
 * Estado de cuenta / ticket de cuenta corriente.
 */
export function msgEstadoCuenta(ticket) {
  const cliente = ticket.cliente_nombre || ticket.cliente?.nombre || '';
  const saldo = parseFloat(ticket.saldo_pendiente ?? ticket.total ?? 0);
  const vto = ticket.fecha_vencimiento
    ? `\nVencimiento: ${fmtFecha(ticket.fecha_vencimiento)}`
    : '';
  const estado = saldo <= 0 ? '✅ SALDADO' : `⚠️ Saldo pendiente: ${fmtPesos(saldo)}`;

  return (
    `*Estado de Cuenta — ${EMPRESA.nombre}*\n` +
    `Ticket N°: ${String(ticket.numero).padStart(5, '0')}\n` +
    `Cliente: ${cliente}\n` +
    `Fecha apertura: ${fmtFecha(ticket.fecha_apertura)}\n` +
    `Total ticket: ${fmtPesos(ticket.total)}` +
    `${vto}\n` +
    `\n${estado}\n` +
    `\nPara regularizar su cuenta comuníquese:\n${EMPRESA.telefono}`
  );
}

/**
 * Recordatorio de deuda genérico.
 */
export function msgRecordatorioDeuda(nombre, deudaTotal) {
  return (
    `Hola ${nombre.split(' ')[0]},\n` +
    `Te contactamos desde *${EMPRESA.nombre}*.\n\n` +
    `Tenés una deuda pendiente de *${fmtPesos(deudaTotal)}*.\n` +
    `Por favor comunicate para coordinar el pago.\n\n` +
    `📞 ${EMPRESA.telefono}`
  );
}

/**
 * Aviso de producto disponible.
 */
export function msgProductoDisponible(nombre, producto) {
  return (
    `Hola ${nombre.split(' ')[0]}! 👋\n` +
    `Te avisamos desde *${EMPRESA.nombre}* que el producto que buscabas ya está disponible:\n\n` +
    `🔧 *${producto}*\n\n` +
    `Escribinos para coordinar 📞 ${EMPRESA.telefono}`
  );
}

/**
 * Aviso de presupuesto próximo a vencer.
 */
export function msgPresupuestoVencer(nombre, nroPresupuesto, fechaVto) {
  return (
    `Hola ${nombre.split(' ')[0]}!\n` +
    `Tu presupuesto *N° ${String(nroPresupuesto).padStart(5, '0')}* de *${EMPRESA.nombre}* vence el ${fmtFecha(fechaVto)}.\n\n` +
    `Avisanos si querés avanzar con el pedido 🏍️\n` +
    `📞 ${EMPRESA.telefono}`
  );
}

/**
 * Aviso de precio actualizado.
 */
export function msgActualizacionPrecio(nombre, producto, precioNuevo) {
  return (
    `Hola ${nombre.split(' ')[0]}!\n` +
    `Te informamos que el precio de *${producto}* fue actualizado a *${fmtPesos(precioNuevo)}*.\n\n` +
    `*${EMPRESA.nombre}* — ${EMPRESA.telefono}`
  );
}

/**
 * Saludo genérico de contacto.
 */
export function msgContactoGenerico(nombre) {
  return (
    `Hola ${nombre ? nombre.split(' ')[0] + '!' : '!'}\n` +
    `Te contactamos desde *${EMPRESA.nombre}*.\n` +
    `¿En qué te podemos ayudar? 🏍️`
  );
}
