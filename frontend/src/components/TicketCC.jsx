/**
 * Ticket térmico para Cuenta Corriente (ticket mecánico).
 * Muestra los ítems cargados y el total del ticket.
 */
import { useRef } from 'react';
import { EMPRESA } from '../constants/empresa';
import { imprimirTicket } from '../utils/printTicket';

export default function TicketCC({ ticket, onClose }) {
  const printRef = useRef(null);
  const handlePrint = () => imprimirTicket(printRef.current.innerHTML, `Ticket CC #${ticket?.numero}`);

  const n = (x) => (x != null ? Number(x).toFixed(2) : '0.00');
  const fmtFecha = (d) => d ? new Date(d).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '--';

  const detalles      = ticket?.detalles ?? [];
  const clienteNombre = ticket?.cliente_nombre || ticket?.cliente?.nombre_completo || 'Sin cliente';
  const total         = ticket?.total ?? ticket?.subtotal ?? 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Ticket Cuenta Corriente</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-4 py-3 max-h-[70vh] overflow-auto bg-slate-50">
          <div ref={printRef} className="bg-white p-3 mx-auto" style={{ width: '72mm', fontFamily: 'Courier New, monospace', fontSize: '11px' }}>
            <div className="line-double" />
            <div className="center bold" style={{ fontSize: '13px' }}>{EMPRESA.nombre.toUpperCase()}</div>
            <div className="center small">{EMPRESA.titular} · CUIT {EMPRESA.cuit}</div>
            <div className="center small">Tel: {EMPRESA.telefono}</div>
            <div className="line-double" />

            <div className="center bold" style={{ fontSize: '12px', marginBottom: '4px' }}>CUENTA CORRIENTE</div>
            <div className="row"><span className="bold">Ticket N°</span><span>{ticket?.numero}</span></div>
            <div className="row small"><span>Fecha</span><span>{fmtFecha(ticket?.fecha_apertura)}</span></div>
            <div className="line" />

            <div className="row"><span className="bold">Cliente</span>
              <span style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{clienteNombre}</span>
            </div>
            {ticket?.descripcion && (
              <div className="row small"><span>Ref.</span><span style={{ maxWidth:'55%', textAlign:'right' }}>{ticket.descripcion}</span></div>
            )}
            <div className="line" />

            <div className="bold small" style={{ marginBottom: '4px' }}>DETALLE</div>
            {detalles.map((det, idx) => {
              const nombre = det.variante?.nombre_completo || det.variante?.producto_nombre || `Ítem ${idx + 1}`;
              const cod    = det.variante?.codigo || '—';
              return (
                <div key={idx} className="row-items">
                  <div style={{ flex: '1', minWidth: 0 }}>
                    <div className="item-desc bold">{nombre}</div>
                    <div className="item-cod">Cód: {cod}</div>
                  </div>
                  <div className="item-nums">
                    <div>{det.cantidad} × ${n(det.precio_unitario)}</div>
                    <div className="bold">${n(det.subtotal)}</div>
                  </div>
                </div>
              );
            })}
            <div className="line" />

            <div className="row total-final">
              <span>TOTAL</span>
              <span>${n(total)}</span>
            </div>

            {ticket?.estado === 'ABONADO' && (
              <>
                <div className="line" />
                <div className="center bold small">TICKET ABONADO</div>
                {ticket?.fecha_cierre && (
                  <div className="center small">{fmtFecha(ticket.fecha_cierre)}</div>
                )}
              </>
            )}

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
