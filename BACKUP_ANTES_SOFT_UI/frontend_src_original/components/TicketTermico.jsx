/**
 * Componente para imprimir tickets térmicos
 * Formatos soportados: 58mm y 80mm
 */
import { useRef } from 'react';

export default function TicketTermico({ venta, onClose }) {
  const printRef = useRef(null);
  
  const handlePrint = () => {
    const printContent = printRef.current;
    const WindowPrint = window.open('', '', 'width=300,height=600');
    WindowPrint.document.write('<html><head><title>Ticket de Venta</title>');
    WindowPrint.document.write('<style>');
    WindowPrint.document.write(`
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        margin: 0;
        padding: 5mm;
        width: 70mm;
      }
      .ticket-header {
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 1px dashed #000;
        padding-bottom: 10px;
      }
      .ticket-header h1 {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 5px 0;
      }
      .ticket-header p {
        margin: 2px 0;
        font-size: 11px;
      }
      .ticket-info {
        margin: 10px 0;
        font-size: 11px;
      }
      .ticket-info p {
        margin: 3px 0;
      }
      .ticket-items {
        margin: 10px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        padding: 10px 0;
      }
      .item-row {
        margin: 5px 0;
      }
      .item-name {
        font-weight: bold;
      }
      .item-details {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
      }
      .ticket-totals {
        margin: 10px 0;
        font-size: 12px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin: 3px 0;
      }
      .total-final {
        font-size: 14px;
        font-weight: bold;
        border-top: 1px solid #000;
        padding-top: 5px;
        margin-top: 5px;
      }
      .ticket-footer {
        text-align: center;
        margin-top: 15px;
        font-size: 10px;
        border-top: 1px dashed #000;
        padding-top: 10px;
      }
      .bold {
        font-weight: bold;
      }
      .text-right {
        text-align: right;
      }
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
  
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Imprimir Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        {/* Vista previa del ticket */}
        <div className="px-6 py-4 max-h-96 overflow-auto bg-gray-50">
          <div ref={printRef} className="bg-white p-4" style={{ width: '70mm', fontFamily: 'monospace' }}>
            
            {/* Header */}
            <div className="ticket-header">
              <h1>CASA DE REPUESTOS</h1>
              <p>Sistema de Gestión</p>
              <p>www.casaderepuestos.com</p>
              <p>Tel: (XXX) XXX-XXXX</p>
            </div>
            
            {/* Información de la venta */}
            <div className="ticket-info">
              <p><span className="bold">Ticket #:</span> {venta.numero_venta}</p>
              <p><span className="bold">Fecha:</span> {formatearFecha(venta.fecha)}</p>
              <p><span className="bold">Cliente:</span> {venta.cliente_nombre || 'Cliente General'}</p>
              {venta.cliente_dni && <p><span className="bold">DNI:</span> {venta.cliente_dni}</p>}
              <p><span className="bold">Atendió:</span> {venta.vendedor_nombre || 'Vendedor'}</p>
              <p><span className="bold">Método:</span> {venta.metodo_pago === 'TARJETA' ? 'TARJETA' : 'EFECTIVO'}</p>
            </div>
            
            {/* Items */}
            <div className="ticket-items">
              {venta.detalles?.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-name">{item.variante_nombre || item.variante}</div>
                  <div className="item-details">
                    <span>{item.cantidad} x ${parseFloat(item.precio_unitario).toFixed(2)}</span>
                    <span>${parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                  {item.codigo && (
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      Cód: {item.codigo}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Totales */}
            <div className="ticket-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${parseFloat(venta.subtotal || venta.total).toFixed(2)}</span>
              </div>
              
              {venta.descuento_total > 0 && (
                <div className="total-row">
                  <span>Descuento:</span>
                  <span>-${parseFloat(venta.descuento_total).toFixed(2)}</span>
                </div>
              )}
              
              <div className="total-row total-final">
                <span>TOTAL:</span>
                <span>${parseFloat(venta.total).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="ticket-footer">
              <p>¡Gracias por su compra!</p>
              <p>Conserve este ticket como comprobante</p>
              <p style={{ marginTop: '10px', fontSize: '9px' }}>
                {new Date().toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
