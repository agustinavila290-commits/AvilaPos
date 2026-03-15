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
} from '../services/cuentaCorrienteService';
import productosService from '../services/productosService';

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
        {esAbierto && detalles.length > 0 && (
          <button
            onClick={() => setModalCerrar(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            Abonar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="card flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800">Total</span>
        <span className="text-2xl font-bold text-green-600">
          {formatCurrency(ticket.total)}
        </span>
      </div>

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
    </div>
  );
}
