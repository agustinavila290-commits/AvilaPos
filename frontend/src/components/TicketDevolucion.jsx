/**
 * Ticket térmico para devoluciones.
 * Muestra referencia a la venta original, ítems devueltos y total.
 */
import { useRef } from 'react';
import { EMPRESA } from '../constants/empresa';
import { imprimirTicket } from '../utils/printTicket';

export default function TicketDevolucion({ devolucion, onClose }) {
  const printRef = useRef(null);
  const handlePrint = () => imprimirTicket(printRef.current.innerHTML, `Devolución #${devolucion?.numero}`);

  const n = (x) => (x != null ? Number(x).toFixed(2) : '0.00');
  const fmtFecha = (d) => d ? new Date(d).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '--';

  const detalles      = devolucion?.detalles ?? [];
  const clienteNombre = devolucion?.cliente_nombre || devolucion?.venta_info?.cliente_nombre || 'Sin cliente';
  const motivo        = devolucion?.motivo_display || devolucion?.motivo || '—';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Ticket de Devolución</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-4 py-3 max-h-[70vh] overflow-auto bg-slate-50">
          <div ref={printRef} className="bg-white p-3 mx-auto" style={{ width: '72mm', fontFamily: 'Courier New, monospace', fontSize: '11px' }}>
            <div className="line-double" />
            <div className="center bold" style={{ fontSize: '13px' }}>{EMPRESA.nombre.toUpperCase()}</div>
            <div className="center small">{EMPRESA.titular} · CUIT {EMPRESA.cuit}</div>
            <div className="center small">Tel: {EMPRESA.telefono}</div>
            <div className="line-double" />

            <div className="center bold" style={{ fontSize: '12px', marginBottom: '4px' }}>NOTA DE DEVOLUCIÓN</div>
            <div className="row"><span className="bold">Dev. N°</span><span>{devolucion?.numero}</span></div>
            <div className="row small"><span>Fecha</span><span>{fmtFecha(devolucion?.fecha)}</span></div>
            <div className="row small"><span>Venta ref.</span><span>#{devolucion?.venta_numero || devolucion?.venta?.numero || devolucion?.venta}</span></div>
            <div className="line" />

            <div className="row"><span className="bold">Cliente</span>
              <span style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{clienteNombre}</span>
            </div>
            <div className="row small"><span>Motivo</span>
              <span style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{motivo}</span>
            </div>
            <div className="line" />

            <div className="bold small" style={{ marginBottom: '4px' }}>ÍTEMS DEVUELTOS</div>
            {detalles.map((det, idx) => {
              const nombre = det.variante_info?.nombre_completo || det.nombre_producto || `Ítem ${idx + 1}`;
              const cod    = det.variante_info?.codigo || det.codigo || '—';
              const cant   = det.cantidad_devuelta ?? det.cantidad ?? 1;
              const monto  = det.monto_devuelto ?? det.subtotal ?? 0;
              return (
                <div key={idx} className="row-items">
                  <div style={{ flex: '1', minWidth: 0 }}>
                    <div className="item-desc bold">{nombre}</div>
                    <div className="item-cod">Cód: {cod}</div>
                  </div>
                  <div className="item-nums">
                    <div>x{cant}</div>
                    <div className="bold">${n(monto)}</div>
                  </div>
                </div>
              );
            })}
            <div className="line" />

            <div className="row total-final">
              <span>TOTAL DEVUELTO</span>
              <span>${n(devolucion?.total_devuelto ?? 0)}</span>
            </div>

            <div className="line-double" />
            <div className="center small" style={{ marginTop: '4px' }}>Comprobante interno · No válido como factura</div>
            <div className="center small" style={{ marginTop: '2px', fontSize: '9px' }}>{new Date().toLocaleString('es-AR')}</div>
            <div className="line-double" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 text-sm">
            Cerrar
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
