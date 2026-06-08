/**
 * Detalle de ticket cuenta corriente - agregar, devolver ítems, abonar
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTicket,
  agregarItem,
  devolverItem,
  cerrarTicket,
  registrarPago,
} from '../services/cuentaCorrienteService';
import productosService from '../services/productosService';
import TicketCC from '../components/TicketCC';
import { openWhatsApp, msgEstadoCuenta } from '../utils/whatsapp';

const DEBOUNCE_MS = 200;

export default function TicketDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const [modalAgregar, setModalAgregar] = useState(false);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState(1);
  const [precioAgregar, setPrecioAgregar] = useState('0');
  const [agregando, setAgregando] = useState(false);

  const [modalDevolver, setModalDevolver] = useState(null);
  const [cantidadDevolver, setCantidadDevolver] = useState(1);
  const [devolviendo, setDevolviendo] = useState(false);

  const [modalCerrar, setModalCerrar] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [cerrando, setCerrando] = useState(false);
  const [mostrarTicketCC, setMostrarTicketCC] = useState(false);

  // Pago parcial
  const [modalPago, setModalPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPagoParcial, setMetodoPagoParcial] = useState('EFECTIVO');
  const [obsPago, setObsPago] = useState('');
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const runSearch = useCallback(async (term) => {
    if (!term?.trim()) {
      setResultados([]);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setBuscando(true);
    try {
      const res = await productosService.search(term.trim(), {
        page_size: 40,
        signal: abortRef.current.signal,
      });
      const list = res.results ?? res ?? [];
      setResultados(Array.isArray(list) ? list : []);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
        setResultados([]);
      }
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (!busqueda?.trim()) {
      setResultados([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(busqueda), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda, runSearch]);

  const cargarTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      console.error('Error al cargar ticket:', err);
      setError('Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTicket();
  }, [id]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(v ?? 0));

  const handleAgregarProducto = (v) => {
    setVarianteSeleccionada(v);
    setPrecioAgregar(String(v?.precio_mostrador ?? 0));
    setCantidadAgregar(1);
    setModalAgregar(true);
  };

  const confirmarAgregar = async () => {
    if (!varianteSeleccionada || !ticket) return;
    setAgregando(true);
    setError('');
    try {
      const data = await agregarItem(ticket.id, {
        variante_id: varianteSeleccionada.id,
        cantidad: cantidadAgregar,
        precio_unitario: Number(precioAgregar),
        descuento_unitario: 0,
      });
      setTicket(data);
      setModalAgregar(false);
      setVarianteSeleccionada(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar');
    } finally {
      setAgregando(false);
    }
  };

  const abrirDevolver = (det) => {
    setModalDevolver(det);
    setCantidadDevolver(1);
  };

  const confirmarDevolver = async () => {
    if (!modalDevolver || !ticket) return;
    setDevolviendo(true);
    setError('');
    try {
      const data = await devolverItem(ticket.id, modalDevolver.id, cantidadDevolver);
      setTicket(data);
      setModalDevolver(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al devolver');
    } finally {
      setDevolviendo(false);
    }
  };

  const handleRegistrarPago = async () => {
    if (!montoPago || Number(montoPago) <= 0) { setError('Ingresá un monto válido'); return; }
    try {
      setRegistrandoPago(true);
      setError('');
      await registrarPago(ticket.id, {
        monto: Number(montoPago),
        metodo_pago: metodoPagoParcial,
        observacion: obsPago.trim(),
      });
      setModalPago(false);
      setMontoPago('');
      setObsPago('');
      cargarTicket();
    } catch (e) { setError(e.response?.data?.error || 'Error al registrar pago'); }
    finally { setRegistrandoPago(false); }
  };

  const handleCerrar = async () => {
    if (!ticket) return;
    setCerrando(true);
    setError('');
    try {
      const res = await cerrarTicket(ticket.id, metodoPago);
      setModalCerrar(false);
      if (res?.venta?.id) {
        navigate(`/ventas/${res.venta.id}`);
      } else {
        cargarTicket();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cerrar ticket');
    } finally {
      setCerrando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket no encontrado</p>
        <button
          onClick={() => navigate('/cuenta-corriente')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Volver a tickets
        </button>
      </div>
    );
  }

  const esAbierto = ticket.estado === 'A_SALDAR';
  const detalles = ticket.detalles ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/cuenta-corriente')}
            className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-1"
          >
            ← Volver a tickets
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Ticket #{ticket.numero} - {ticket.cliente_nombre}
          </h1>
          <p className="text-sm text-gray-600">
            {ticket.descripcion || 'Sin descripción'} · {ticket.deposito_nombre} ·{' '}
            <span
              className={
                esAbierto ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'
              }
            >
              {ticket.estado_display ?? ticket.estado}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMostrarTicketCC(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
          >
            🖨️ Imprimir Ticket
          </button>
          {/* WhatsApp estado de cuenta */}
          {(ticket.cliente_telefono || ticket.cliente_whatsapp) && (
            <button
              onClick={() => openWhatsApp(
                ticket.cliente_whatsapp || ticket.cliente_telefono,
                msgEstadoCuenta({
                  numero: ticket.numero,
                  cliente_nombre: ticket.cliente_nombre,
                  total: ticket.total,
                  saldo_pendiente: ticket.saldo_pendiente,
                  fecha_apertura: ticket.fecha_apertura,
                  fecha_vencimiento: ticket.fecha_vencimiento,
                })
              )}
              className="px-3 py-2 text-white rounded-lg font-semibold text-sm flex items-center gap-1 hover:brightness-110"
              style={{ backgroundColor: '#25D366' }}
              title="Enviar estado de cuenta por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Estado de Cuenta
            </button>
          )}
          {esAbierto && detalles.length > 0 && (
            <button
              onClick={() => setModalCerrar(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            >
              Abonar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Resumen financiero */}
      <div className="card space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">Total del ticket</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(ticket.total)}</span>
        </div>
        {ticket.pagos?.length > 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-600 border-t border-slate-100 pt-2">
              <span>Pagos recibidos ({ticket.pagos.length})</span>
              <span className="text-green-700 font-semibold">
                -{formatCurrency(ticket.pagos.reduce((s, p) => s + Number(p.monto), 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
              <span className="text-slate-700">Saldo pendiente</span>
              <span className={Number(ticket.saldo_pendiente) === 0 ? 'text-green-600' : 'text-amber-700'}>
                {formatCurrency(ticket.saldo_pendiente)}
              </span>
            </div>
          </>
        )}
        {esAbierto && (
          <div className="pt-2">
            <button
              onClick={() => { setMontoPago(''); setObsPago(''); setModalPago(true); }}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm"
            >
              💰 Registrar Pago Parcial
            </button>
          </div>
        )}
      </div>

      {/* Historial de pagos parciales */}
      {ticket.pagos?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Pagos registrados</h3>
          <div className="space-y-2">
            {ticket.pagos.map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-slate-700">{p.metodo_pago_display}</span>
                  {p.observacion && <span className="text-slate-500 ml-2">{p.observacion}</span>}
                  <div className="text-xs text-slate-400">
                    {p.usuario_nombre} · {new Date(p.fecha).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(p.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {esAbierto && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Agregar producto</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onBlur={() => busqueda.trim() && runSearch(busqueda)}
              className="input-field flex-1"
            />
          </div>
          {buscando && <p className="text-sm text-gray-500 mt-2">Buscando...</p>}
          {resultados.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto border rounded-lg divide-y">
              {resultados.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleAgregarProducto(v)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between"
                >
                  <span className="text-sm font-medium">{v.codigo} - {v.nombre_completo}</span>
                  <span className="text-sm text-green-600">
                    ${Number(v.precio_mostrador ?? 0).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Productos en el ticket</h2>
        {detalles.length === 0 ? (
          <p className="text-gray-500">Sin productos. Agrega productos desde el buscador.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-semibold">Producto</th>
                  <th className="text-left py-2 text-sm font-semibold">Cantidad</th>
                  <th className="text-left py-2 text-sm font-semibold">Precio</th>
                  <th className="text-left py-2 text-sm font-semibold">Subtotal</th>
                  {esAbierto && <th className="text-left py-2 text-sm font-semibold">Devolver</th>}
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="py-3 text-sm">{d.nombre_producto ?? d.codigo}</td>
                    <td className="py-3 text-sm">{d.cantidad}</td>
                    <td className="py-3 text-sm">{formatCurrency(d.precio_unitario)}</td>
                    <td className="py-3 text-sm font-medium">{formatCurrency(d.subtotal)}</td>
                    {esAbierto && (
                      <td className="py-3">
                        <button
                          onClick={() => abrirDevolver(d)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                        >
                          Devolver
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal agregar */}
      {modalAgregar && varianteSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Agregar: {varianteSeleccionada.nombre_completo}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={cantidadAgregar}
                  onChange={(e) => setCantidadAgregar(parseInt(e.target.value, 10) || 1)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioAgregar}
                  onChange={(e) => setPrecioAgregar(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmarAgregar}
                disabled={agregando}
                className="btn-primary flex-1"
              >
                {agregando ? 'Agregando...' : 'Agregar'}
              </button>
              <button
                onClick={() => {
                  setModalAgregar(false);
                  setVarianteSeleccionada(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal devolver */}
      {modalDevolver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Devolver: {modalDevolver.nombre_producto ?? modalDevolver.codigo}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cantidad en ticket: {modalDevolver.cantidad}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad a devolver</label>
              <input
                type="number"
                min={1}
                max={modalDevolver.cantidad}
                value={cantidadDevolver}
                onChange={(e) =>
                  setCantidadDevolver(Math.min(modalDevolver.cantidad, parseInt(e.target.value, 10) || 1))
                }
                className="input-field w-full"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmarDevolver}
                disabled={devolviendo}
                className="btn-primary flex-1"
              >
                {devolviendo ? 'Devolviendo...' : 'Devolver'}
              </button>
              <button
                onClick={() => setModalDevolver(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cerrar/abonar */}
      {modalCerrar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Abonar ticket</h3>
            <p className="text-sm text-gray-600 mb-4">
              Total: {formatCurrency(ticket.total)}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="input-field w-full"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCerrar}
                disabled={cerrando}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                {cerrando ? 'Procesando...' : 'Confirmar y abonar'}
              </button>
              <button
                onClick={() => setModalCerrar(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarTicketCC && (
        <TicketCC ticket={ticket} onClose={() => setMostrarTicketCC(false)} />
      )}

      {/* Modal pago parcial */}
      {modalPago && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">Registrar pago parcial</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto <span className="text-red-500">*</span></label>
                <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)}
                  min={0.01} step={0.01} className="input-field w-full" autoFocus
                  placeholder={`Saldo: ${formatCurrency(ticket.saldo_pendiente)}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Método</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['EFECTIVO','Contado','#16A34A'],['TRANSFERENCIA','Transfer.','#7C3AED'],['TARJETA','Tarjeta','#2563EB']].map(([v,l,c]) => (
                    <button key={v} onClick={() => setMetodoPagoParcial(v)}
                      className="py-1.5 rounded text-xs font-bold transition-all"
                      style={metodoPagoParcial === v ? { backgroundColor: c, color:'#fff', border:`1px solid ${c}` } : { backgroundColor:'#F3F4F6', color:'#374151', border:'1px solid #E5E7EB' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observación</label>
                <input type="text" value={obsPago} onChange={e => setObsPago(e.target.value)}
                  className="input-field w-full" placeholder="Opcional..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleRegistrarPago} disabled={registrandoPago || !montoPago}
                className="btn-success flex-1 py-2.5 text-sm disabled:opacity-50">
                {registrandoPago ? 'Guardando...' : 'Registrar pago'}
              </button>
              <button onClick={() => { setModalPago(false); setError(''); }}
                className="btn-secondary px-4 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
