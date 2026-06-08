import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVenta, anularVenta, actualizarDatosTarjeta, confirmarTransferencia, rechazarTransferencia } from '../services/ventasService';
import facturacionService from '../services/facturacionService';
import { useAuth } from '../hooks/useAuth';
import TicketTermico from '../components/TicketTermico';
import SoftCard from '../components/SoftCard';
import { openWhatsApp, msgComprobante, formatPhone } from '../utils/whatsapp';

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

  // Impresión / factura
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [facturando, setFacturando] = useState(false);

  // Modal datos tarjeta
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [cuponInput, setCuponInput] = useState('');
  const [authInput, setAuthInput] = useState('');
  const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);

  // Transferencia
  const [mostrarModalConfirmarTransfer, setMostrarModalConfirmarTransfer] = useState(false);
  const [transferNroOp, setTransferNroOp] = useState('');
  const [transferBanco, setTransferBanco] = useState('');
  const [transferCuenta, setTransferCuenta] = useState('');
  const [transferObs, setTransferObs] = useState('');
  const [mostrarModalRechazarTransfer, setMostrarModalRechazarTransfer] = useState(false);
  const [transferObsRech, setTransferObsRech] = useState('');
  const [procesandoTransfer, setProcesandoTransfer] = useState(false);

  useEffect(() => { cargarVenta(); }, [id]);

  const cargarVenta = async () => {
    try {
      setLoading(true);
      const data = await getVenta(id);
      setVenta(data);
    } catch {
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
    if (!confirm('¿Está seguro que desea anular esta venta? Esta acción devolverá el stock.')) return;
    try {
      setAnulando(true);
      setError('');
      const ventaAnulada = await anularVenta(id, motivoAnulacion);
      setVenta(ventaAnulada);
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  const abrirPdfEnPestana = async (facturaId) => {
    try {
      const pdfResp = await facturacionService.generarPdfFactura(facturaId);
      const blob = new Blob([pdfResp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      setError('No se pudo abrir el PDF.');
    }
  };

  const emitirFactura = async () => {
    if (!venta) return;
    if (!confirm('¿Emitir factura AFIP para esta venta?')) return;
    try {
      setFacturando(true);
      setError('');

      const puntos = await facturacionService.listarPuntosVenta();
      if (!puntos || puntos.length === 0) {
        setError('No hay puntos de venta configurados para facturación.');
        return;
      }
      const punto = puntos[0];
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
          alicuota_iva: '21',
        })) || [],
      };

      const factura = await facturacionService.crearFactura(facturaData);
      const respAut = await facturacionService.autorizarFactura(factura.id);
      const facturaAut = respAut.factura || factura;

      await abrirPdfEnPestana(facturaAut.id);
      await cargarVenta();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al emitir la factura');
    } finally {
      setFacturando(false);
    }
  };

  // Arranca el flujo: si la venta es TARJETA y le faltan datos, muestra el modal primero
  const handleEmitirFactura = () => {
    if (
      venta?.metodo_pago === 'TARJETA' &&
      (!venta.tarjeta_cupon_numero?.trim() || !venta.tarjeta_codigo_autorizacion?.trim())
    ) {
      setCuponInput(venta.tarjeta_cupon_numero || '');
      setAuthInput(venta.tarjeta_codigo_autorizacion || '');
      setMostrarModalTarjeta(true);
      return;
    }
    emitirFactura();
  };

  const handleGuardarTarjetaYFacturar = async () => {
    if (!cuponInput.trim() || !authInput.trim()) {
      setError('Ingresá el número de cupón y el código de autorización.');
      return;
    }
    try {
      setGuardandoTarjeta(true);
      setError('');
      await actualizarDatosTarjeta(venta.id, cuponInput.trim(), authInput.trim());
      // Actualizar estado local para que emitirFactura use los datos nuevos
      setVenta(v => ({ ...v, tarjeta_cupon_numero: cuponInput.trim(), tarjeta_codigo_autorizacion: authInput.trim() }));
      setMostrarModalTarjeta(false);
      await emitirFactura();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los datos de tarjeta.');
    } finally {
      setGuardandoTarjeta(false);
    }
  };

  const handleConfirmarTransfer = async () => {
    if (!transferNroOp.trim()) { setError('Ingresá el número de operación.'); return; }
    try {
      setProcesandoTransfer(true);
      setError('');
      await confirmarTransferencia(venta.id, {
        transferencia_numero_operacion: transferNroOp.trim(),
        transferencia_banco: transferBanco.trim(),
        transferencia_cuenta_destino: transferCuenta.trim(),
        transferencia_observacion: transferObs.trim(),
      });
      setMostrarModalConfirmarTransfer(false);
      await cargarVenta();
    } catch (e) { setError(e.response?.data?.error || 'Error al confirmar.'); }
    finally { setProcesandoTransfer(false); }
  };

  const handleRechazarTransfer = async () => {
    try {
      setProcesandoTransfer(true);
      setError('');
      await rechazarTransferencia(venta.id, transferObsRech.trim());
      setMostrarModalRechazarTransfer(false);
      await cargarVenta();
    } catch (e) { setError(e.response?.data?.error || 'Error al rechazar.'); }
    finally { setProcesandoTransfer(false); }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    return new Date(fechaStr).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getEstadoColor = (estado) => {
    if (estado === 'Completada') return 'bg-green-100 text-green-800';
    if (estado === 'Anulada') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando venta...</p>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Venta no encontrada</p>
        <Link to="/ventas" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">Volver al listado</Link>
      </div>
    );
  }

  const facturaInfo = venta.factura_info;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">Venta #{venta.numero}</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">{formatFecha(venta.fecha)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
          {/* Ticket térmico — siempre disponible */}
          <button
            onClick={() => setMostrarTicket(true)}
            className="btn-primary px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir Ticket
          </button>

          {/* WhatsApp comprobante — solo si hay cliente con teléfono */}
          {(venta.cliente_telefono || venta.cliente_whatsapp) && (
            <button
              onClick={() => {
                const ventaConDetalles = {
                  ...venta,
                  items: venta.detalles?.map(d => ({
                    nombre: d.nombre_completo || d.codigo || d.nombre_variante || '',
                    cantidad: d.cantidad,
                    subtotal: d.subtotal,
                  })),
                };
                openWhatsApp(
                  venta.cliente_whatsapp || venta.cliente_telefono,
                  msgComprobante(ventaConDetalles)
                );
              }}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-white font-semibold text-sm shadow-sm hover:brightness-110 transition-all"
              style={{ backgroundColor: '#25D366' }}
              title="Enviar comprobante por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          )}

          {/* Acciones de factura */}
          {facturaInfo ? (
            <>
              <button
                onClick={() => abrirPdfEnPestana(facturaInfo.id)}
                className="btn-secondary px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 text-sm"
                title="Ver/imprimir PDF de la factura"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Ver Factura {facturaInfo.numero_completo}
              </button>
            </>
          ) : (
            venta.estado_display === 'Completada' && (
              <button
                onClick={handleEmitirFactura}
                disabled={facturando}
                className="bg-emerald-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {facturando ? 'Emitiendo...' : 'Emitir Factura AFIP'}
              </button>
            )
          )}

          {isAdmin() && venta.estado_display === 'Completada' && (
            <button
              onClick={() => setMostrarAnulacion(!mostrarAnulacion)}
              className="btn-danger px-3 py-2 sm:px-4 sm:py-2.5 text-sm"
            >
              Anular Venta
            </button>
          )}
          <Link to="/ventas" className="btn-secondary px-3 py-2 sm:px-4 sm:py-2.5 text-sm">Volver</Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Modal datos tarjeta */}
      {mostrarModalTarjeta && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full">
            <h2 className="text-base font-bold text-brand-text mb-1">Datos del posnet (tarjeta)</h2>
            <p className="text-sm text-brand-muted mb-4">Ingresá los datos del comprobante físico emitido por el posnet.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">N° Cupón</label>
                <input
                  type="text"
                  value={cuponInput}
                  onChange={e => setCuponInput(e.target.value)}
                  placeholder="Ej: 4243"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Código de Autorización</label>
                <input
                  type="text"
                  value={authInput}
                  onChange={e => setAuthInput(e.target.value)}
                  placeholder="Ej: 929550"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleGuardarTarjetaYFacturar}
                disabled={guardandoTarjeta || !cuponInput.trim() || !authInput.trim()}
                className="btn-success flex-1 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardandoTarjeta ? 'Guardando...' : 'Guardar y Facturar'}
              </button>
              <button
                onClick={() => { setMostrarModalTarjeta(false); setError(''); }}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario anulación */}
      {mostrarAnulacion && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-3">Anular Venta</h3>
          <p className="text-sm text-yellow-700 mb-4">Esta acción devolverá el stock al inventario. El motivo debe tener al menos 10 caracteres.</p>
          <textarea
            value={motivoAnulacion}
            onChange={e => setMotivoAnulacion(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-yellow-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-400 placeholder-gray-400 shadow-sm mb-3"
            placeholder="Motivo de anulación (mínimo 10 caracteres)..."
          />
          <div className="flex gap-2 sm:gap-3">
            <button onClick={handleAnular} disabled={anulando || motivoAnulacion.length < 10} className="btn-danger px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {anulando ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
            <button onClick={() => { setMostrarAnulacion(false); setMotivoAnulacion(''); setError(''); }} className="btn-secondary px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          <SoftCard title="Estado" icon="📌">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Estado actual:</span>
              <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-sm ${getEstadoColor(venta.estado_display)}`}>
                {venta.estado_display}
              </span>
            </div>
            {venta.estado_display === 'Anulada' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-900">Motivo de anulación:</p>
                <p className="text-sm text-red-700 mt-1">{venta.motivo_anulacion}</p>
                <p className="text-xs text-red-600 mt-2">Anulada por {venta.usuario_anulacion} el {formatFecha(venta.fecha_anulacion)}</p>
              </div>
            )}
            {venta.margen_es_bajo && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm font-bold text-yellow-900">Margen bajo ({Number(venta.margen_porcentaje ?? 0).toFixed(2)}%)</p>
              </div>
            )}
          </SoftCard>

          <SoftCard title="Productos" icon="📦">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Producto</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Precio Unit.</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {venta.detalles?.map((detalle) => (
                    <tr key={detalle.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm">
                        <p className="font-bold text-slate-800 truncate">{detalle.codigo}</p>
                        <p className="text-slate-600 truncate">{detalle.nombre_producto}</p>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-800">{detalle.cantidad}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-slate-800">
                        ${Number(detalle.precio_unitario ?? 0).toFixed(2)}
                        {detalle.descuento_unitario > 0 && <span className="text-xs text-red-600 block font-semibold">-${Number(detalle.descuento_unitario ?? 0).toFixed(2)}</span>}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm font-bold text-green-600">${Number(detalle.subtotal ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>
        </div>

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <SoftCard title="Cliente" icon="👤">
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                <p className="font-bold text-sm text-slate-800 truncate">{venta.cliente_nombre}</p>
              </div>
              {venta.cliente && (
                <Link to={`/clientes/${venta.cliente}`} className="block text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Ver historial del cliente →
                </Link>
              )}
            </div>
          </SoftCard>

          <SoftCard title="Método de Pago" icon="💳">
            <div className="space-y-2">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                <p className="font-bold text-slate-800">{venta.metodo_pago_display}</p>
              </div>
              {venta.metodo_pago === 'TARJETA' && venta.tarjeta_cupon_numero && (
                <div className="text-xs text-slate-600 space-y-0.5 pl-1">
                  <p><span className="font-semibold">Cupón:</span> {venta.tarjeta_cupon_numero}</p>
                  <p><span className="font-semibold">Autorización:</span> {venta.tarjeta_codigo_autorizacion}</p>
                </div>
              )}
            </div>
          </SoftCard>

          <SoftCard title="Resumen de Totales" icon="💰">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Subtotal:</span>
                <span className="font-bold text-slate-800">${Number(venta.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {(venta.descuento_monto > 0 || venta.descuento_porcentaje > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Descuento{venta.descuento_porcentaje > 0 && ` (${venta.descuento_porcentaje}%)`}:</span>
                  <span className="font-bold text-red-600">-${Number(venta.descuento_monto ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-800">TOTAL:</span>
                  <span className="text-xl font-bold text-green-600">${Number(venta.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Transferencia */}
          {venta.metodo_pago === 'TARJETA' && null /* placeholder */}
          {venta.metodo_pago === 'TRANSFERENCIA' && (
            <SoftCard title="Transferencia" icon="💸">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {{
                    PENDIENTE:  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-800">Pendiente</span>,
                    CONFIRMADA: <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-green-100 text-green-800">Confirmada</span>,
                    RECHAZADA:  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-800">Rechazada</span>,
                  }[venta.transferencia_estado] ?? <span className="text-slate-400 text-xs">—</span>}
                </div>
                {venta.transferencia_banco && <p className="text-slate-600"><span className="font-semibold">Banco:</span> {venta.transferencia_banco}</p>}
                {venta.transferencia_numero_operacion && <p className="text-slate-600"><span className="font-semibold">N° Op.:</span> {venta.transferencia_numero_operacion}</p>}
                {venta.transferencia_cuenta_destino && <p className="text-slate-600"><span className="font-semibold">Cuenta:</span> {venta.transferencia_cuenta_destino}</p>}
                {venta.transferencia_confirmada_por_nombre && <p className="text-slate-500 text-xs">Confirmada por {venta.transferencia_confirmada_por_nombre}{venta.transferencia_fecha_confirmacion ? ` · ${formatFecha(venta.transferencia_fecha_confirmacion)}` : ''}</p>}
                {venta.transferencia_observacion && <p className="text-slate-500 text-xs italic">{venta.transferencia_observacion}</p>}
                {isAdmin() && venta.transferencia_estado === 'PENDIENTE' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setTransferNroOp(''); setTransferBanco(venta.transferencia_banco || ''); setTransferCuenta(''); setTransferObs(''); setMostrarModalConfirmarTransfer(true); }}
                      className="btn-success flex-1 py-1.5 text-xs">Confirmar</button>
                    <button onClick={() => { setTransferObsRech(''); setMostrarModalRechazarTransfer(true); }}
                      className="btn-danger flex-1 py-1.5 text-xs">Rechazar</button>
                  </div>
                )}
              </div>
            </SoftCard>
          )}

          {/* Factura emitida */}
          {facturaInfo && (
            <SoftCard title="Factura AFIP" icon="🧾">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-green-100 text-green-800">AUTORIZADA</span>
                  <span className="text-xs font-mono text-slate-700">{facturaInfo.numero_completo}</span>
                </div>
                <button
                  onClick={() => abrirPdfEnPestana(facturaInfo.id)}
                  className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Ver / Descargar PDF
                </button>
              </div>
            </SoftCard>
          )}
        </div>
      </div>

      {mostrarTicket && <TicketTermico venta={venta} onClose={() => setMostrarTicket(false)} />}

      {/* Modal confirmar transferencia */}
      {mostrarModalConfirmarTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md">
            <h2 className="text-base font-bold text-slate-800 mb-4">Confirmar transferencia</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Operación <span className="text-red-500">*</span></label>
                <input type="text" value={transferNroOp} onChange={e => setTransferNroOp(e.target.value)} className="input-field w-full" autoFocus placeholder="Ej: 1234567890" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banco / Billetera</label>
                <input type="text" value={transferBanco} onChange={e => setTransferBanco(e.target.value)} className="input-field w-full" placeholder="Mercado Pago, Banco Galicia..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cuenta Destino / CBU / CVU</label>
                <input type="text" value={transferCuenta} onChange={e => setTransferCuenta(e.target.value)} className="input-field w-full" placeholder="CVU o CBU" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observación</label>
                <textarea value={transferObs} onChange={e => setTransferObs(e.target.value)} rows={2} className="input-field w-full resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleConfirmarTransfer} disabled={procesandoTransfer || !transferNroOp.trim()} className="btn-success flex-1 py-2.5 text-sm disabled:opacity-50">
                {procesandoTransfer ? 'Guardando...' : 'Confirmar'}
              </button>
              <button onClick={() => { setMostrarModalConfirmarTransfer(false); setError(''); }} className="btn-secondary px-4 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar transferencia */}
      {mostrarModalRechazarTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">Rechazar transferencia</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Observación</label>
              <textarea value={transferObsRech} onChange={e => setTransferObsRech(e.target.value)} rows={3} className="input-field w-full resize-none" autoFocus />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleRechazarTransfer} disabled={procesandoTransfer} className="btn-danger flex-1 py-2.5 text-sm disabled:opacity-50">
                {procesandoTransfer ? 'Procesando...' : 'Rechazar'}
              </button>
              <button onClick={() => { setMostrarModalRechazarTransfer(false); setError(''); }} className="btn-secondary px-4 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
