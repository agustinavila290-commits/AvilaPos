/**
 * Ticket térmico para impresora 80mm.
 * Avila Moto Repuesto - diseño claro con código de producto y totales destacados.
 */
import { useRef } from 'react';
import { EMPRESA } from '../constants/empresa';
import { imprimirTicket } from '../utils/printTicket';

export default function TicketTermico({ venta, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => imprimirTicket(printRef.current.innerHTML, `Ticket #${numeroVenta}`);

  const formatearFecha = (fecha) => {
    if (!fecha) return '--/--/---- --:--';
    const d = new Date(fecha);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const n = (x) => (x != null ? Number(x).toFixed(2) : '0.00');

  // Construye la descripción del ítem SIN repetir la marca
  const getDescripcionItem = (item, idx) => {
    const varianteInfo = item.variante_info || {};
    const productoNombre = varianteInfo.producto_nombre || '';
    const varianteNombre = varianteInfo.nombre_variante || item.nombre_variante || '';

    if (productoNombre && varianteNombre) {
      return `${productoNombre} - ${varianteNombre}`;
    }

    if (productoNombre) {
      return productoNombre;
    }

    if (varianteNombre) {
      return varianteNombre;
    }

    // Fallback: usar lo que venía del backend, pero sin tocar nada más
    return item.nombre_producto || `Item ${idx + 1}`;
  };
  const numeroVenta = venta?.numero ?? venta?.numero_venta ?? '--';
  const clienteNombre = venta?.cliente_nombre || 'Consumidor final';
  const clienteDni = venta?.cliente_info?.dni || venta?.cliente_dni || '';
  const vendedor = venta?.usuario_nombre || 'Vendedor';
  const metodoPago = venta?.metodo_pago_display || venta?.metodo_pago || 'EFECTIVO';
  const esTarjeta     = venta?.metodo_pago === 'TARJETA';
  const esTransfer    = venta?.metodo_pago === 'TRANSFERENCIA';
  const cuponNum      = venta?.tarjeta_cupon_numero?.trim();
  const authNum       = venta?.tarjeta_codigo_autorizacion?.trim();
  const transBanco    = venta?.transferencia_banco?.trim();
  const transNroOp    = venta?.transferencia_numero_operacion?.trim();
  const detalles = venta?.detalles ?? [];
  const subtotal = venta?.subtotal ?? venta?.total ?? 0;
  const descuento = venta?.descuento_monto ?? 0;
  const total = venta?.total ?? 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Vista previa del ticket</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3 max-h-[70vh] overflow-auto bg-slate-50">
          <div ref={printRef} className="bg-white p-3 mx-auto" style={{ width: '72mm', fontFamily: 'Courier New, monospace', fontSize: '11px' }}>
            {/* Encabezado */}
            <div className="line-double" />
            <div className="center bold" style={{ fontSize: '14px' }}>{EMPRESA.nombre.toUpperCase()}</div>
            <div className="center small" style={{ marginTop: '2px' }}>{EMPRESA.titular}</div>
            <div className="center small">CUIT {EMPRESA.cuit}</div>
            <div className="center small">Tel: {EMPRESA.telefono.replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}</div>
            <div className="line-double" />

            {/* Datos del comprobante */}
            <div className="row"><span className="bold">Ticket Nº</span><span>{numeroVenta}</span></div>
            <div className="row"><span className="bold">Fecha</span><span>{formatearFecha(venta?.fecha)}</span></div>
            <div className="line" />
            <div className="row"><span className="bold">Cliente</span><span style={{ maxWidth: '45%', textAlign: 'right', wordBreak: 'break-word' }}>{clienteNombre}</span></div>
            {clienteDni && <div className="row small"><span>DNI/CUIT</span><span>{clienteDni}</span></div>}
            <div className="row small"><span>Atendió</span><span>{vendedor}</span></div>
            <div className="row small"><span>Pago</span><span>{metodoPago}</span></div>
            {esTarjeta && cuponNum && (
              <div className="row small"><span>Cupón</span><span>{cuponNum}</span></div>
            )}
            {esTarjeta && authNum && (
              <div className="row small"><span>Autorización</span><span>{authNum}</span></div>
            )}
            {esTransfer && transBanco && (
              <div className="row small"><span>Banco/Billetera</span><span>{transBanco}</span></div>
            )}
            {esTransfer && transNroOp && (
              <div className="row small"><span>N° Operación</span><span>{transNroOp}</span></div>
            )}
            <div className="line" />

            {/* Detalle de productos */}
            <div className="bold small" style={{ marginBottom: '4px' }}>DETALLE</div>
            {detalles.map((item, idx) => (
              <div key={idx} className="row-items">
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div className="item-desc bold">{getDescripcionItem(item, idx)}</div>
                  <div className="item-cod">Cód: {item.codigo || '—'}</div>
                </div>
                <div className="item-nums">
                  <div>{item.cantidad} × ${n(item.precio_unitario)}</div>
                  <div className="bold">${n(item.subtotal)}</div>
                </div>
              </div>
            ))}
            <div className="line" />

            {/* Totales */}
            <div className="total-line">
              <div className="row"><span>Subtotal</span><span>${n(subtotal)}</span></div>
              {Number(descuento) > 0 && (
                <div className="row small"><span>Descuento</span><span>-${n(descuento)}</span></div>
              )}
            </div>
            <div className="row total-final">
              <span>TOTAL</span>
              <span>${n(total)}</span>
            </div>

            {/* Pie */}
            <div className="line-double" />
            <div className="center bold small" style={{ marginTop: '6px' }}>¡Gracias por su compra!</div>
            <div className="center small" style={{ marginTop: '2px' }}>Conserve este ticket como comprobante</div>
            <div className="center small" style={{ marginTop: '8px', fontSize: '9px' }}>
              {new Date().toLocaleString('es-AR')}
            </div>
            <div className="line-double" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
