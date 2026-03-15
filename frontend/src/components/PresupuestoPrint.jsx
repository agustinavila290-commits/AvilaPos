/**
 * Modal para imprimir presupuesto.
 * No descuenta stock ni crea venta. Solo imprime los productos del carrito.
 */
import { useRef } from 'react';

export default function PresupuestoPrint({ items, cliente, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const WindowPrint = window.open('', '', 'width=320,height=640');
    WindowPrint.document.write('<html><head><title>Presupuesto</title>');
    WindowPrint.document.write('<style>');
    WindowPrint.document.write(`
      @media print {
        @page { size: 80mm auto; margin: 0; }
        body { margin: 0; padding: 0; }
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.35;
        margin: 0;
        padding: 4mm;
        width: 72mm;
        max-width: 72mm;
      }
      .line { border-bottom: 1px dashed #000; margin: 6px 0; }
      .line-double { border-bottom: 2px solid #000; margin: 8px 0; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .small { font-size: 10px; }
      .row { display: flex; justify-content: space-between; margin: 2px 0; }
      .row-items { display: flex; justify-content: space-between; align-items: flex-start; margin: 4px 0; gap: 4px; }
      .item-cod { font-size: 10px; color: #333; }
      .item-desc { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .item-nums { white-space: nowrap; text-align: right; }
      .total-line { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
      .total-final { font-size: 13px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
    `);
    WindowPrint.document.write('</style></head><body>');
    WindowPrint.document.write(printContent.innerHTML);
    WindowPrint.document.write('</body></html>');
    WindowPrint.document.close();
    WindowPrint.focus();
    setTimeout(() => {
      WindowPrint.print();
      WindowPrint.close();
    }, 250);
  };

  const n = (x) => (x != null ? Number(x).toFixed(2) : '0.00');
  const total = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const clienteNombre = cliente?.nombre_completo || cliente?.nombre || 'Sin indicar';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Presupuesto (sin cobro)</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3 max-h-[70vh] overflow-auto bg-gray-100 dark:bg-slate-700/30">
          <div ref={printRef} className="bg-white p-3 mx-auto" style={{ width: '72mm', fontFamily: 'Courier New, monospace', fontSize: '11px' }}>
            <div className="line-double" />
            <div className="center bold" style={{ fontSize: '14px' }}>PRESUPUESTO</div>
            <div className="center bold" style={{ fontSize: '12px', marginTop: '2px' }}>CASA DE REPUESTOS</div>
            <div className="center small">Autopartes · Moto y Auto</div>
            <div className="line" />
            <div className="center small">{new Date().toLocaleString('es-AR')}</div>
            <div className="line-double" />

            <div className="row"><span className="bold">Cliente</span><span style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{clienteNombre}</span></div>
            {cliente?.dni && <div className="row small"><span>DNI</span><span>{cliente.dni}</span></div>}
            <div className="line" />

            <div className="bold small" style={{ marginBottom: '4px' }}>DETALLE</div>
            {items.map((item, idx) => (
              <div key={idx} className="row-items">
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div className="item-desc bold">
                    {item.variante?.nombre_completo || item.variante?.producto_nombre || item.variante?.producto_base?.nombre || `Producto #${idx + 1}`}
                  </div>
                  <div className="item-cod">Cód: {item.variante?.codigo || '—'}</div>
                </div>
                <div className="item-nums">
                  <div>{item.cantidad} × ${n(item.precio_unitario)}</div>
                  <div className="bold">${n(item.subtotal)}</div>
                </div>
              </div>
            ))}
            <div className="line" />

            <div className="row total-final">
              <span>TOTAL</span>
              <span>${n(total)}</span>
            </div>

            <div className="line-double" />
            <div className="center bold small" style={{ marginTop: '6px' }}>Presupuesto sin compromiso</div>
            <div className="center small" style={{ marginTop: '2px' }}>No descuenta stock ni genera cobro</div>
            <div className="line-double" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-600 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500"
          >
            Cerrar
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
