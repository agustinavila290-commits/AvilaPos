export const WA_NUMBER = '549XXXXXXXXXX'  // TODO: reemplazar con número real del local

export const SITIO = {
  nombre:      'Avila Moto Repuestos',
  descripcion: 'Repuestos y accesorios para motos. Buscá por modelo, consultá stock y comprá online.',
  direccion:   'Av. Pte. Castillo 1165',
  localidad:   'Catamarca',
  provincia:   'Catamarca',
}

export const ENVIO_GRATIS_DESDE = 30000  // TODO: ajustar según política de envío

// TODO: completar con datos bancarios reales
export const BANK_INFO = {
  titular: 'TODO — Nombre del titular',
  alias:   'TODO.ALIAS.BANCARIO',
  cbu:     'TODO0000000000000000000000',
  banco:   'TODO — Nombre del banco',
}

export const ORDER_STATUS_LABELS = {
  PENDIENTE:        { label: 'Pendiente de pago',   color: 'bg-yellow-100 text-yellow-700' },
  PAGO_RECIBIDO:    { label: 'Pago recibido',        color: 'bg-blue-100 text-blue-700' },
  EN_PREPARACION:   { label: 'En preparación',       color: 'bg-indigo-100 text-indigo-700' },
  LISTO_RETIRO:     { label: 'Listo para retirar',   color: 'bg-teal-100 text-teal-700' },
  ENVIADO:          { label: 'Enviado',               color: 'bg-purple-100 text-purple-700' },
  ENTREGADO:        { label: 'Entregado',             color: 'bg-green-100 text-green-700' },
  COMPLETADA:       { label: 'Completado',            color: 'bg-green-100 text-green-700' },
  CANCELADA:        { label: 'Cancelado',             color: 'bg-red-100 text-red-700' },
}

export const PAYMENT_METHOD_LABELS = {
  mercadopago:   'Mercado Pago',
  transferencia: 'Transferencia bancaria',
  efectivo:      'Efectivo',
}

// Genera links de WhatsApp con mensajes predefinidos
export const WA_MESSAGES = {
  consultaProducto: (nombre, codigo) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Hola! Quiero consultar por este producto:\nProducto: ${nombre}\nCódigo: ${codigo}\nLink: ${window.location.href}`
    )}`,

  sinStock: (nombre, codigo) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Hola! Quiero consultar disponibilidad de este producto:\nProducto: ${nombre}\nCódigo: ${codigo}\nLink: ${window.location.href}`
    )}`,

  pedidoTransferencia: (numeroPedido, nombreCliente) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Hola! Realicé una compra por transferencia.\nPedido: #${numeroPedido}\nNombre: ${nombreCliente}\nAdjunto comprobante.`
    )}`,

  consultarPedido: (numeroPedido) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Hola! Quiero consultar sobre mi pedido #${numeroPedido}`
    )}`,

  consultaGeneral: () =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Hola! Quiero hacer una consulta sobre repuestos para mi moto.`
    )}`,

  compartirProducto: (nombre, url) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Mirá este repuesto en ${SITIO.nombre}: ${nombre} — ${url}`
    )}`,
}
