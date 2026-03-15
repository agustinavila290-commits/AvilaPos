/**
 * Página de detalle de venta - Soft UI
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVenta, anularVenta } from '../services/ventasService';
import facturacionService from '../services/facturacionService';
import { useAuth } from '../hooks/useAuth';
import TicketTermico from '../components/TicketTermico';
import SoftCard from '../components/SoftCard';

export default function VentaDetalle() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Anulación
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  
  // Impresión
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [facturando, setFacturando] = useState(false);

  useEffect(() => {
    cargarVenta();
  }, [id]);

  const cargarVenta = async () => {
    try {
      setLoading(true);
      const data = await getVenta(id);
      setVenta(data);
    } catch (err) {
      console.error('Error al cargar venta:', err);
      setError('Error al cargar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    
    if (!confirm('¿Está seguro que desea anular esta venta? Esta acción devolverá el stock.')) {
      return;
    }
    
    try {
      setAnulando(true);
      setError('');
      
      const ventaAnulada = await anularVenta(id, motivoAnulacion);
      setVenta(ventaAnulada);
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
    } catch (err) {
      console.error('Error al anular venta:', err);
      setError(err.response?.data?.error || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'Anulada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEmitirFactura = async () => {
    if (!venta) return;
    if (!confirm('¿Emitir factura AFIP para esta venta?')) return;

    try {
      setFacturando(true);
      setError('');

      // Tomar el primer punto de venta disponible
      const puntos = await facturacionService.listarPuntosVenta();
      if (!puntos || puntos.length === 0) {
        setError('No hay puntos de venta configurados para facturación.');
        return;
      }
      const punto = puntos[0];

      // Armar datos básicos de cliente
      const cliente = venta.cliente_info || {};
      const condicionIva = cliente.condicion_iva || 'CF';
      const tipoComprobante = condicionIva === 'RI' ? 'FA' : 'FB';

      const facturaData = {
        tipo_comprobante: tipoComprobante,
        punto_venta: punto.id,
        cliente: venta.cliente || null,
        cliente_razon_social: cliente.nombre_completo || venta.cliente_nombre || 'Consumidor Final',
        cliente_cuit: cliente.cuit || cliente.dni || '0',
        cliente_condicion_iva: condicionIva,
        cliente_domicilio: cliente.direccion || '',
        venta: venta.id,
        otros_tributos: 0,
        observaciones: `Venta #${venta.numero}`,
        items: venta.detalles?.map((d, idx) => ({
          orden: idx + 1,
          codigo: d.codigo,
          descripcion: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          alicuota_iva: '21'
        })) || []
      };

      const factura = await facturacionService.crearFactura(facturaData);
      const respAut = await facturacionService.autorizarFactura(factura.id);
      const facturaAut = respAut.factura || factura;

      // Descargar PDF
      try {
        const pdfResp = await facturacionService.generarPdfFactura(facturaAut.id);
        const blob = new Blob([pdfResp.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        // Si falla el PDF, al menos dejamos creada/autorizada la factura
      }

      // Refrescar venta por si en el futuro se asocia factura
      await cargarVenta();
    } catch (err) {
      console.error('Error al emitir factura:', err);
      setError(err.response?.data?.error || 'Error al emitir la factura');
    } finally {
      setFacturando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando venta...</p>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Venta no encontrada</p>
        <Link to="/ventas" className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 mt-4 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">💳 Venta #{venta.numero}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">{formatFecha(venta.fecha)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
          <button
            onClick={() => setMostrarTicket(true)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base flex items-center gap-2"
          >
            🖨️ Imprimir Ticket
          </button>
          {venta.estado_display === 'Completada' && (
            <button
              onClick={handleEmitirFactura}
              disabled={facturando}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {facturando ? 'Emitiendo factura...' : '🧾 Emitir Factura AFIP'}
            </button>
          )}
          {isAdmin() && venta.estado_display === 'Completada' && (
            <button
              onClick={() => setMostrarAnulacion(!mostrarAnulacion)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
            >
              Anular Venta
            </button>
          )}
          <Link
            to="/ventas"
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-md transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Errores - Soft UI */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Formulario de anulación - Soft UI */}
      {mostrarAnulacion && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-3 sm:mb-4 lg:mb-6">⚠️ Anular Venta</h3>
          <p className="text-sm text-yellow-700 mb-4">
            Esta acción devolverá el stock al inventario. El motivo debe tener al menos 10 caracteres.
          </p>
          <textarea
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-yellow-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-400 shadow-sm mb-3"
            placeholder="Motivo de anulación (mínimo 10 caracteres)..."
          />
          <div className="flex gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={handleAnular}
              disabled={anulando || motivoAnulacion.length < 10}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base disabled:bg-gray-300 disabled:shadow-none disabled:transform-none"
            >
              {anulando ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
            <button
              onClick={() => {
                setMostrarAnulacion(false);
                setMotivoAnulacion('');
                setError('');
              }}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-semibold text-sm sm:text-base"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Información general */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Estado - Soft UI */}
          <SoftCard title="Estado" icon="📌">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-200 font-medium">Estado actual:</span>
              <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-sm ${getEstadoColor(venta.estado_display)}`}>
                {venta.estado_display}
              </span>
            </div>
            
            {venta.estado_display === 'Anulada' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-900">Motivo de anulación:</p>
                <p className="text-sm text-red-700 mt-1">{venta.motivo_anulacion}</p>
                <p className="text-xs text-red-600 mt-2">
                  Anulada por {venta.usuario_anulacion} el {formatFecha(venta.fecha_anulacion)}
                </p>
              </div>
            )}
            
            {venta.margen_es_bajo && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ Alerta: Margen bajo ({Number(venta.margen_porcentaje ?? 0).toFixed(2)}%)
                </p>
              </div>
            )}
          </SoftCard>

          {/* Productos - Soft UI */}
          <SoftCard title="Productos" icon="📦">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b-2 border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                      Producto
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                      Cantidad
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-600">
                  {venta.detalles?.map((detalle) => (
                    <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{detalle.codigo}</p>
                        <p className="text-gray-600 dark:text-gray-200 truncate min-w-0">{detalle.nombre_producto}</p>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {detalle.cantidad}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-800 dark:text-gray-100">
                        ${Number(detalle.precio_unitario ?? 0).toFixed(2)}
                        {detalle.descuento_unitario > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400 block font-semibold">
                            -${Number(detalle.descuento_unitario ?? 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                        ${Number(detalle.subtotal ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>
        </div>

        {/* Sidebar - Soft UI */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Cliente */}
          <SoftCard title="Cliente" icon="👤">
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 p-3 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100 truncate min-w-0">{venta.cliente_nombre}</p>
              </div>
              <Link
                to={`/clientes/${venta.cliente}`}
                className="block text-sm text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 font-semibold transition-colors"
              >
                Ver historial del cliente →
              </Link>
            </div>
          </SoftCard>

          {/* Vendedor */}
          <SoftCard title="Vendedor" icon="🧑‍💼">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 p-3 rounded-xl border border-purple-200 dark:border-purple-700">
              <p className="font-bold text-gray-800 dark:text-gray-100">{venta.usuario_nombre}</p>
            </div>
          </SoftCard>

          {/* Pago */}
          <SoftCard title="Método de Pago" icon="💳">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 p-3 rounded-xl border border-green-200 dark:border-green-700">
              <p className="font-bold text-gray-800 dark:text-gray-100">{venta.metodo_pago_display}</p>
            </div>
          </SoftCard>

          {/* Totales */}
          <SoftCard title="Resumen de Totales" icon="💰">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">${Number(venta.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {(venta.descuento_monto > 0 || venta.descuento_porcentaje > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Descuento
                    {venta.descuento_porcentaje > 0 && ` (${venta.descuento_porcentaje}%)`}:
                  </span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    -${Number(venta.descuento_monto ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-gray-200 dark:border-slate-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">TOTAL:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    ${Number(venta.total ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </SoftCard>
        </div>
      </div>
      
      {/* Modal de impresión de ticket */}
      {mostrarTicket && (
        <TicketTermico
          venta={venta}
          onClose={() => setMostrarTicket(false)}
        />
      )}
    </div>
  );
}
