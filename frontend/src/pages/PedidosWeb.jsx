import { useState, useEffect, useCallback } from 'react';
import { getPedidosWeb, getPedidoWebDetalle, cambiarEstadoPedido } from '../services/tiendaPedidosService';

const ESTADOS = {
  PENDIENTE_PAGO:  { label: 'Pendiente de pago',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PAGO_CONFIRMADO: { label: 'Pago confirmado',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  EN_PREPARACION:  { label: 'En preparación',      color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ENVIADO:         { label: 'Enviado',              color: 'bg-purple-100 text-purple-800 border-purple-200' },
  ENTREGADO:       { label: 'Entregado',            color: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETADA:      { label: 'Completada',           color: 'bg-green-100 text-green-800 border-green-200' },
  ANULADA:         { label: 'Anulada',              color: 'bg-red-100 text-red-800 border-red-200' },
};

const METODOS = {
  MERCADOPAGO:   'Mercado Pago',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO:      'Efectivo',
  TARJETA:       'Tarjeta',
};

const TRANSICIONES = {
  PENDIENTE_PAGO:  ['PAGO_CONFIRMADO', 'ANULADA'],
  PAGO_CONFIRMADO: ['EN_PREPARACION', 'ANULADA'],
  EN_PREPARACION:  ['ENVIADO', 'ENTREGADO', 'ANULADA'],
  ENVIADO:         ['ENTREGADO', 'ANULADA'],
  ENTREGADO:       [],
  ANULADA:         [],
  COMPLETADA:      [],
};

function EstadoBadge({ estado }) {
  const cfg = ESTADOS[estado] || { label: estado, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ModalDetalle({ pedidoId, onClose }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPedidoWebDetalle(pedidoId)
      .then(setPedido)
      .catch(() => setError('Error al cargar el pedido'))
      .finally(() => setLoading(false));
  }, [pedidoId]);

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a "${ESTADOS[nuevoEstado]?.label}"?`)) return;
    setCambiando(true);
    try {
      const r = await cambiarEstadoPedido(pedidoId, nuevoEstado);
      setPedido(prev => ({ ...prev, estado: r.estado }));
    } catch {
      setError('Error al cambiar el estado');
    } finally {
      setCambiando(false);
    }
  };

  // Extraer datos del cliente desde observaciones (guardados en el campo)
  const obs = pedido?.observaciones || '';
  const clienteMatch = obs.match(/Cliente: ([^|]+)/);
  const clienteStr = clienteMatch ? clienteMatch[1].trim() : '';

  const siguientes = pedido ? (TRANSICIONES[pedido.estado] || []) : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : pedido ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pedido #{pedido.numero}</h2>
                <p className="text-sm text-gray-500">{new Date(pedido.fecha).toLocaleString('es-AR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <EstadoBadge estado={pedido.estado} />
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Cliente */}
              {clienteStr && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="text-sm text-gray-700">{clienteStr}</p>
                </div>
              )}

              {/* Productos */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Productos</p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500 text-xs">Producto</th>
                        <th className="text-center px-4 py-2 font-semibold text-gray-500 text-xs">Cant.</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-500 text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pedido.detalles || []).map((d, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-700">
                            {d.variante?.nombre_completo || d.variante?.codigo || '—'}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-600">{d.cantidad}</td>
                          <td className="px-4 py-2 text-right text-gray-700">
                            ${parseFloat(d.subtotal || 0).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-gray-50">
                        <td colSpan="2" className="px-4 py-2 text-right font-bold text-gray-700 text-sm">Total</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">
                          ${parseFloat(pedido.total || 0).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Observaciones / Entrega */}
              {obs && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Detalle de entrega</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{obs}</p>
                </div>
              )}

              {/* Pago */}
              <div className="flex gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Método de pago</p>
                  <p className="text-sm text-gray-700">{METODOS[pedido.metodo_pago] || pedido.metodo_pago}</p>
                </div>
              </div>

              {/* Cambio de estado */}
              {siguientes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {siguientes.map(sig => (
                      <button
                        key={sig}
                        disabled={cambiando}
                        onClick={() => handleCambiarEstado(sig)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                          ${sig === 'ANULADA'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                      >
                        {cambiando ? '...' : `→ ${ESTADOS[sig]?.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function PedidosWeb() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [detallePedidoId, setDetallePedidoId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pagina, page_size: 20 };
      if (filtroEstado) params.estado = filtroEstado;
      const data = await getPedidosWeb(params);
      setPedidos(data.results || []);
      setTotalPages(data.total_pages || 1);
      setCount(data.count || 0);
    } catch {
      setError('Error al cargar los pedidos web');
    } finally {
      setLoading(false);
    }
  }, [pagina, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, [cargar]);

  const pedidosNuevos = pedidos.filter(p => p.estado === 'PENDIENTE_PAGO').length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos Web</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count} pedidos totales
            {pedidosNuevos > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                {pedidosNuevos} sin confirmar
              </span>
            )}
          </p>
        </div>
        <button
          onClick={cargar}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'Todos'], ...Object.entries(ESTADOS).map(([k, v]) => [k, v.label])].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => { setFiltroEstado(val); setPagina(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${filtroEstado === val
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando pedidos...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-medium">No hay pedidos web todavía</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Pedido</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Fecha</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Pago</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Total</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map(p => (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 transition-colors ${p.estado === 'PENDIENTE_PAGO' ? 'bg-yellow-50/40' : ''}`}
                >
                  <td className="px-5 py-3 font-mono font-bold text-gray-900">#{p.numero}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    <span className="block text-xs text-gray-400">
                      {new Date(p.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{METODOS[p.metodo_pago] || p.metodo_pago}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    ${parseFloat(p.total || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDetallePedidoId(p.id)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100">
              <button
                disabled={pagina <= 1}
                onClick={() => setPagina(p => p - 1)}
                className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">{pagina} / {totalPages}</span>
              <button
                disabled={pagina >= totalPages}
                onClick={() => setPagina(p => p + 1)}
                className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal detalle */}
      {detallePedidoId && (
        <ModalDetalle
          pedidoId={detallePedidoId}
          onClose={() => setDetallePedidoId(null)}
        />
      )}
    </div>
  );
}
