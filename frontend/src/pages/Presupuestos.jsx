import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPresupuestos } from '../services/presupuestosService';
import SoftCard from '../components/SoftCard';

const ESTADO_BADGE = {
  BORRADOR:   'bg-slate-100 text-slate-700',
  ENVIADO:    'bg-blue-100 text-blue-800',
  ACEPTADO:   'bg-green-100 text-green-800',
  RECHAZADO:  'bg-red-100 text-red-800',
  VENCIDO:    'bg-orange-100 text-orange-800',
  CONVERTIDO: 'bg-purple-100 text-purple-800',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda]         = useState('');

  useEffect(() => { cargar(); }, [filtroEstado]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const data = await getPresupuestos(params);
      setPresupuestos(data.results ?? data);
    } catch {
      setError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const filtrados = busqueda.trim()
    ? presupuestos.filter(p =>
        p.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(p.numero).includes(busqueda)
      )
    : presupuestos;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Presupuestos</h1>
          <p className="text-sm text-slate-500 mt-1">Cotizaciones sin descontar stock</p>
        </div>
        <Link to="/presupuestos/nuevo"
          className="btn-success px-4 py-2.5 text-sm font-semibold rounded-lg shadow-sm">
          + Nuevo Presupuesto
        </Link>
      </div>

      {error && <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <SoftCard title="Filtros" icon="🔍">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue">
            <option value="">Todos los estados</option>
            {['BORRADOR','ENVIADO','ACEPTADO','RECHAZADO','VENCIDO','CONVERTIDO'].map(e => (
              <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o número..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
      </SoftCard>

      <SoftCard title={`Presupuestos (${filtrados.length})`} icon="📋">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg font-medium">Sin presupuestos</p>
            <p className="text-sm mt-1">
              <Link to="/presupuestos/nuevo" className="text-brand-blue hover:underline">Crear el primero →</Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  {['#', 'Cliente', 'Fecha', 'Válido hasta', 'Items', 'Total', 'Estado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map(p => {
                  const badgeCls = ESTADO_BADGE[p.estado] || 'bg-slate-100 text-slate-700';
                  const vencido  = p.esta_vencido;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">#{p.numero}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{p.nombre_cliente}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(p.fecha_creacion)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${vencido ? 'text-orange-600' : 'text-slate-600'}`}>
                        {fmt(p.fecha_vencimiento)}{vencido && ' ⚠️'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-center">{p.cantidad_items}</td>
                      <td className="px-4 py-3 font-bold text-green-600">${Number(p.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${badgeCls}`}>
                          {p.estado_display}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/presupuestos/${p.id}`}
                          className="text-brand-blue hover:underline text-xs font-semibold">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SoftCard>
    </div>
  );
}
