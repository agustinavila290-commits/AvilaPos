import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTransferenciasPendientes, confirmarTransferencia, rechazarTransferencia } from '../services/ventasService';
import { useAuth } from '../hooks/useAuth';
import SoftCard from '../components/SoftCard';

const BADGE = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-800' },
  CONFIRMADA: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  RECHAZADA:  { label: 'Rechazada',  cls: 'bg-red-100 text-red-800' },
};

export default function Transferencias() {
  const { isAdmin } = useAuth();
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal confirmar
  const [modalConfirmar, setModalConfirmar] = useState(null); // venta obj
  const [nroOp, setNroOp] = useState('');
  const [bancoConf, setBancoConf] = useState('');
  const [cuentaDest, setCuentaDest] = useState('');
  const [obsConf, setObsConf] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Modal rechazar
  const [modalRechazar, setModalRechazar] = useState(null);
  const [obsRech, setObsRech] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTransferenciasPendientes();
      setPendientes(data.results ?? data);
    } catch {
      setError('Error al cargar transferencias pendientes');
    } finally {
      setLoading(false);
    }
  };

  const abrirConfirmar = (v) => {
    setModalConfirmar(v);
    setNroOp('');
    setBancoConf(v.transferencia_banco || '');
    setCuentaDest('');
    setObsConf('');
  };

  const handleConfirmar = async () => {
    if (!nroOp.trim()) { setError('Ingresá el número de operación.'); return; }
    try {
      setProcesando(true);
      setError('');
      await confirmarTransferencia(modalConfirmar.id, {
        transferencia_numero_operacion: nroOp.trim(),
        transferencia_banco: bancoConf.trim(),
        transferencia_cuenta_destino: cuentaDest.trim(),
        transferencia_observacion: obsConf.trim(),
      });
      setModalConfirmar(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al confirmar.');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    try {
      setProcesando(true);
      setError('');
      await rechazarTransferencia(modalRechazar.id, obsRech.trim());
      setModalRechazar(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al rechazar.');
    } finally {
      setProcesando(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transferencias Pendientes</h1>
          <p className="text-sm text-slate-500 mt-1">Ventas por transferencia que esperan confirmación bancaria</p>
        </div>
        <button onClick={cargar} className="btn-secondary px-3 py-2 text-sm">Actualizar</button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
          {error}
        </div>
      )}

      <SoftCard title="Transferencias pendientes" icon="💸">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Cargando...</div>
        ) : pendientes.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-lg font-medium">Sin transferencias pendientes</p>
            <p className="text-sm mt-1">Todas las transferencias fueron procesadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  {['#Venta', 'Fecha', 'Cliente', 'Total', 'Banco', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendientes.map(v => {
                  const badge = BADGE[v.transferencia_estado] || BADGE.PENDIENTE;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        <Link to={`/ventas/${v.id}`} className="text-brand-blue hover:underline">
                          #{v.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(v.fecha)}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{v.cliente_nombre}</td>
                      <td className="px-4 py-3 font-bold text-green-600">${Number(v.total ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{v.transferencia_banco || <span className="text-slate-400 italic">Sin especificar</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin() && v.transferencia_estado === 'PENDIENTE' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => abrirConfirmar(v)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                              style={{ backgroundColor: '#16A34A' }}
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => { setModalRechazar(v); setObsRech(''); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                              style={{ backgroundColor: '#DC2626' }}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SoftCard>

      {/* Modal Confirmar */}
      {modalConfirmar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md">
            <h2 className="text-base font-bold text-slate-800 mb-1">Confirmar transferencia — Venta #{modalConfirmar.numero}</h2>
            <p className="text-sm text-slate-500 mb-4">Total: <strong className="text-green-600">${Number(modalConfirmar.total).toFixed(2)}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Operación <span className="text-red-500">*</span></label>
                <input type="text" value={nroOp} onChange={e => setNroOp(e.target.value)}
                  className="input-field w-full" placeholder="Ej: 1234567890" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banco / Billetera</label>
                <input type="text" value={bancoConf} onChange={e => setBancoConf(e.target.value)}
                  className="input-field w-full" placeholder="Ej: Mercado Pago, Banco Galicia..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cuenta Destino / CBU / CVU</label>
                <input type="text" value={cuentaDest} onChange={e => setCuentaDest(e.target.value)}
                  className="input-field w-full" placeholder="CVU o CBU destino" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observación</label>
                <textarea value={obsConf} onChange={e => setObsConf(e.target.value)}
                  rows={2} className="input-field w-full resize-none" placeholder="Opcional..." />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={handleConfirmar} disabled={procesando || !nroOp.trim()}
                className="btn-success flex-1 py-2.5 text-sm disabled:opacity-50">
                {procesando ? 'Guardando...' : 'Confirmar transferencia'}
              </button>
              <button onClick={() => { setModalConfirmar(null); setError(''); }}
                className="btn-secondary px-4 py-2.5 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {modalRechazar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-slate-800 mb-1">Rechazar transferencia — Venta #{modalRechazar.numero}</h2>
            <p className="text-sm text-slate-500 mb-4">Esta acción marca la transferencia como rechazada.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Observación</label>
              <textarea value={obsRech} onChange={e => setObsRech(e.target.value)}
                rows={3} className="input-field w-full resize-none" placeholder="Opcional..." autoFocus />
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={handleRechazar} disabled={procesando}
                className="btn-danger flex-1 py-2.5 text-sm disabled:opacity-50">
                {procesando ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
              <button onClick={() => { setModalRechazar(null); setError(''); }}
                className="btn-secondary px-4 py-2.5 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
