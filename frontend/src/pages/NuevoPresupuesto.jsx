import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearPresupuesto } from '../services/presupuestosService';
import productosService from '../services/productosService';
import { getDepositoPrincipal } from '../services/inventarioService';
import SeleccionarClienteModal from '../components/SeleccionarClienteModal';

export default function NuevoPresupuesto() {
  const navigate = useNavigate();
  const codigoRef = useRef(null);

  // Items
  const [items, setItems] = useState([]);
  const [codigo, setCodigo]   = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const abortRef = useRef(null);

  // Cabecera
  const [cliente, setCliente]   = useState(null);
  const [nombreManual, setNombreManual] = useState('');
  const [vencimiento, setVencimiento]   = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [descuentoPct, setDescuentoPct]   = useState('');
  const [deposito, setDeposito] = useState(null);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    getDepositoPrincipal().then(setDeposito).catch(() => {});
    codigoRef.current?.focus();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const t = busqueda.trim();
    if (!t || !mostrarModal) { setResultados([]); return; }
    const timer = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      productosService.search(t, { page_size: 50, signal: abortRef.current.signal })
        .then(d => setResultados(d.results ?? d))
        .catch(() => {});
    }, 220);
    return () => clearTimeout(timer);
  }, [busqueda, mostrarModal]);

  const agregarItem = useCallback((variante) => {
    setItems(prev => {
      const existe = prev.find(i => i.variante.id === variante.id);
      if (existe) return prev.map(i => i.variante.id === variante.id
        ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precio_unitario * (i.cantidad + 1) }
        : i);
      const precio = Number(variante.precio_mostrador || 0);
      return [...prev, { variante, cantidad: 1, precio_unitario: precio, descuento_unitario: 0, subtotal: precio }];
    });
    setMostrarModal(false);
    setResultados([]);
    setBusqueda('');
    setCodigo('');
    setTimeout(() => codigoRef.current?.focus(), 100);
  }, []);

  const buscarPorCodigo = async (e) => {
    e.preventDefault();
    const c = codigo.trim();
    if (!c) return;
    try {
      const { found, variante } = await productosService.buscarPorCodigo(c);
      if (found && variante) { agregarItem(variante); return; }
      const data = await productosService.search(c, { page_size: 30 });
      const lista = data.results ?? data;
      if (lista.length === 1) { agregarItem(lista[0]); return; }
      if (lista.length > 1) { setResultados(lista); setMostrarModal(true); }
      else setError('Producto no encontrado');
    } catch { setError('Error al buscar'); }
    setTimeout(() => setError(''), 3000);
  };

  const cambiarCantidad = (id, val) => {
    if (val < 1) { setItems(prev => prev.filter(i => i.variante.id !== id)); return; }
    setItems(prev => prev.map(i => i.variante.id === id
      ? { ...i, cantidad: val, subtotal: i.precio_unitario * val }
      : i));
  };

  const cambiarPrecio = (id, val) => {
    const p = Number(val) || 0;
    setItems(prev => prev.map(i => i.variante.id === id
      ? { ...i, precio_unitario: p, subtotal: p * i.cantidad }
      : i));
  };

  const eliminar = (id) => setItems(prev => prev.filter(i => i.variante.id !== id));

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const descMonto = descuentoPct ? subtotal * Number(descuentoPct) / 100 : 0;
  const total = subtotal - descMonto;

  const handleSubmit = async () => {
    if (items.length === 0) { setError('Agregá al menos un producto'); return; }
    try {
      setSubmitting(true);
      setError('');
      const pres = await crearPresupuesto({
        ...(cliente ? { cliente_id: cliente.id } : {}),
        cliente_nombre_manual: nombreManual.trim(),
        ...(deposito ? { deposito_id: deposito.id } : {}),
        fecha_vencimiento: vencimiento || null,
        observaciones,
        descuento_porcentaje: Number(descuentoPct) || 0,
        descuento_monto: 0,
        items: items.map(i => ({
          variante_id: i.variante.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          descuento_unitario: i.descuento_unitario,
        })),
      });
      navigate(`/presupuestos/${pres.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Nuevo Presupuesto</h1>
        <button onClick={() => navigate('/presupuestos')} className="btn-secondary px-3 py-2 text-sm">← Volver</button>
      </div>

      {error && <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel izquierdo: productos */}
        <div className="lg:col-span-2 space-y-3">
          {/* Buscador */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <form onSubmit={buscarPorCodigo} className="flex gap-2">
              <input ref={codigoRef} type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder="Código o escáner…" className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                data-no-uppercase />
              <button type="submit" className="btn-success px-3 py-2.5 text-sm">ENTER</button>
              <button type="button" onClick={() => { setMostrarModal(true); setBusqueda(''); }}
                className="btn-primary px-3 py-2.5 text-sm">F10 Buscar</button>
            </form>
          </div>

          {/* Tabla de ítems */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-700">Productos</h3>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Escaneá o buscá un producto para agregar</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-brand-blue-dark text-white text-xs">
                  <tr>
                    {['Código', 'Descripción', 'Precio', 'Cant.', 'Subtotal', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.variante.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{item.variante.codigo}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium text-xs max-w-[180px] truncate">
                        {item.variante.nombre_completo || item.variante.producto_nombre}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.precio_unitario} min={0} step={0.01}
                          onChange={e => cambiarPrecio(item.variante.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => cambiarCantidad(item.variante.id, item.cantidad - 1)}
                            className="w-6 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold">−</button>
                          <span className="w-7 text-center text-xs font-bold">{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item.variante.id, item.cantidad + 1)}
                            className="w-6 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-bold text-green-600 text-xs">${item.subtotal.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => eliminar(item.variante.id)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel derecho: datos del presupuesto */}
        <div className="space-y-3">
          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
            <h3 className="font-bold text-sm text-slate-700">Cliente</h3>
            {cliente ? (
              <div>
                <div className="p-2 rounded-lg bg-blue-50 border-l-4 border-brand-blue text-sm">
                  <p className="font-semibold text-slate-800">{cliente.nombre_completo}</p>
                  <p className="text-xs text-slate-500">DNI: {cliente.dni}</p>
                </div>
                <button onClick={() => setCliente(null)} className="btn-secondary w-full py-1.5 text-xs mt-2">Cambiar</button>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={() => setMostrarModalCliente(true)} className="btn-primary w-full py-2 text-sm">
                  Seleccionar cliente
                </button>
                <input type="text" value={nombreManual} onChange={e => setNombreManual(e.target.value)}
                  placeholder="O escribir nombre libre…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue" />
              </div>
            )}
          </div>

          {/* Validez */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-700">Detalles</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Válido hasta</label>
              <input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Descuento %</label>
              <input type="number" value={descuentoPct} onChange={e => setDescuentoPct(e.target.value)}
                min={0} max={100} step={0.1} placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={3} placeholder="Condiciones, notas…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none" />
            </div>
          </div>

          {/* Totales */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {descMonto > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento ({descuentoPct}%):</span><span>-${descMonto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base">
              <span>TOTAL:</span><span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Guardar */}
          <button onClick={handleSubmit} disabled={submitting || items.length === 0}
            className="w-full py-3 rounded-xl font-black text-white uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: items.length === 0 ? '#9CA3AF' : '#2563EB' }}>
            {submitting ? 'Guardando…' : 'Guardar Presupuesto'}
          </button>
        </div>
      </div>

      {/* Modal búsqueda */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-blue-50">
              <h2 className="text-lg font-bold text-slate-800">Buscar producto</h2>
              <button onClick={() => { setMostrarModal(false); setResultados([]); }} className="text-2xl text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="px-5 py-3 border-b border-slate-200">
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Escribí código, nombre o marca…"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto">
              {resultados.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">Escribí para buscar productos</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {['Código','Descripción','Precio','Stock'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map(v => (
                      <tr key={v.id} onClick={() => agregarItem(v)}
                        className="border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700 font-bold">{v.codigo}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium text-xs">
                          {v.producto_nombre ?? v.nombre_completo}
                          {v.nombre_variante && <span className="text-slate-400 ml-1">· {v.nombre_variante}</span>}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-green-600">${Number(v.precio_mostrador||0).toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${(v.stock_actual||0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {v.stock_actual || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Hacé click en un producto para agregarlo al presupuesto
            </div>
          </div>
        </div>
      )}

      {mostrarModalCliente && (
        <SeleccionarClienteModal isOpen onClose={() => setMostrarModalCliente(false)}
          onClienteSeleccionado={c => { setCliente(c); setMostrarModalCliente(false); }} />
      )}
    </div>
  );
}
