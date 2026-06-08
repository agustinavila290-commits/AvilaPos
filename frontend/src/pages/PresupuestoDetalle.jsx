import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getPresupuesto, descargarPdfPresupuesto,
  convertirPresupuesto, marcarEnviado,
} from '../services/presupuestosService';
import { useAuth } from '../hooks/useAuth';
import SoftCard from '../components/SoftCard';
import { openWhatsApp, msgPresupuestoVencer, formatPhone } from '../utils/whatsapp';
import { EMPRESA } from '../constants/empresa';

const ESTADO_BADGE = {
  BORRADOR:   'bg-slate-100 text-slate-700',
  ENVIADO:    'bg-blue-100 text-blue-800',
  ACEPTADO:   'bg-green-100 text-green-800',
  RECHAZADO:  'bg-red-100 text-red-800',
  VENCIDO:    'bg-orange-100 text-orange-800',
  CONVERTIDO: 'bg-purple-100 text-purple-800',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';
const fmtdt = (d) => d ? new Date(d).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

export default function PresupuestoDetalle() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const [pres, setPres]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Convertir a venta
  const [mostrarConvertir, setMostrarConvertir] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [convirtiendo, setConvirtiendo] = useState(false);

  // PDF
  const [descargando, setDescargando] = useState(false);

  useEffect(() => { cargar(); }, [id]);

  const cargar = async () => {
    try { setLoading(true); setError(''); setPres(await getPresupuesto(id)); }
    catch { setError('Error al cargar el presupuesto'); }
    finally { setLoading(false); }
  };

  const handleDescargarPdf = async () => {
    try {
      setDescargando(true);
      const resp = await descargarPdfPresupuesto(id);
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `presupuesto_${String(pres.numero).padStart(5,'0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Error al descargar el PDF'); }
    finally { setDescargando(false); }
  };

  const handleImprimirPdf = async () => {
    try {
      setDescargando(true);
      const resp = await descargarPdfPresupuesto(id);
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch { setError('Error al abrir el PDF'); }
    finally { setDescargando(false); }
  };

  const handleWhatsApp = () => {
    if (!pres) return;
    const lineas = pres.items.map(i =>
      `• ${i.nombre || i.codigo} x${i.cantidad} = $${Number(i.subtotal).toFixed(2)}`
    ).join('\n');
    const vto = pres.fecha_vencimiento ? `Válido hasta: ${fmt(pres.fecha_vencimiento)}\n` : '';
    const obs = pres.observaciones ? `\nObs: ${pres.observaciones}` : '';
    const msg =
      `*Presupuesto #${String(pres.numero).padStart(5,'0')} - ${EMPRESA.nombre}*\n` +
      `Fecha: ${fmt(pres.fecha_creacion)}\n${vto}` +
      `\n*Detalle:*\n${lineas}\n` +
      `\n*Total: $${Number(pres.total).toFixed(2)}*${obs}\n\n` +
      `Para consultas: Tel ${EMPRESA.telefono}`;
    const tel = pres.cliente?.telefono?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${tel ? `549${tel}` : ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarcarEnviado = async () => {
    try { await marcarEnviado(id); cargar(); }
    catch (e) { setError(e.response?.data?.error || 'Error'); }
  };

  const handleConvertir = async () => {
    try {
      setConvirtiendo(true);
      setError('');
      const resp = await convertirPresupuesto(id, metodoPago);
      navigate(`/ventas/${resp.venta_id}`);
    } catch (e) { setError(e.response?.data?.error || 'Error al convertir'); }
    finally { setConvirtiendo(false); }
  };

  if (loading) return <div className="text-center py-16 text-slate-400">Cargando...</div>;
  if (!pres)   return <div className="text-center py-16 text-slate-400">Presupuesto no encontrado</div>;

  const badgeCls = ESTADO_BADGE[pres.estado] || 'bg-slate-100 text-slate-700';
  const editable = !['CONVERTIDO'].includes(pres.estado);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Presupuesto #{String(pres.numero).padStart(5,'0')}</h1>
          <p className="text-sm text-slate-500 mt-1">{fmtdt(pres.fecha_creacion)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleImprimirPdf} disabled={descargando}
            className="btn-primary px-3 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
            🖨️ Imprimir
          </button>
          <button onClick={handleDescargarPdf} disabled={descargando}
            className="btn-secondary px-3 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50">
            ⬇️ PDF
          </button>
          <button onClick={handleWhatsApp}
            className="px-3 py-2 text-sm font-semibold rounded-lg text-white flex items-center gap-1.5"
            style={{ backgroundColor: '#25D366' }}>
            💬 WhatsApp
          </button>
          {editable && pres.estado === 'BORRADOR' && (
            <button onClick={handleMarcarEnviado}
              className="btn-secondary px-3 py-2 text-sm">
              Marcar enviado
            </button>
          )}
          {editable && (
            <button onClick={() => setMostrarConvertir(true)}
              className="btn-success px-3 py-2 text-sm font-semibold">
              ✓ Convertir a venta
            </button>
          )}
          <Link to="/presupuestos" className="btn-secondary px-3 py-2 text-sm">← Volver</Link>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Modal convertir */}
      {mostrarConvertir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-slate-800 mb-1">Convertir a venta</h2>
            <p className="text-sm text-slate-500 mb-4">Total: <strong className="text-green-600">${Number(pres.total).toFixed(2)}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Método de pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { v: 'EFECTIVO',      l: 'Contado',  c: '#16A34A' },
                    { v: 'TRANSFERENCIA', l: 'Transfer.', c: '#7C3AED' },
                    { v: 'TARJETA',       l: 'Tarjeta',   c: '#2563EB' },
                  ].map(({ v, l, c }) => (
                    <button key={v} onClick={() => setMetodoPago(v)}
                      className="py-2 rounded-lg text-xs font-bold transition-all"
                      style={metodoPago === v
                        ? { backgroundColor: c, color: '#fff', border: `1px solid ${c}` }
                        : { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleConvertir} disabled={convirtiendo}
                className="btn-success flex-1 py-2.5 text-sm disabled:opacity-50">
                {convirtiendo ? 'Convirtiendo...' : 'Confirmar'}
              </button>
              <button onClick={() => setMostrarConvertir(false)}
                className="btn-secondary px-4 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          <SoftCard title="Productos" icon="📦">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    {['Código','Descripción','P. Unit.','Cant.','Subtotal'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pres.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{item.codigo}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 text-xs">{item.nombre}</td>
                      <td className="px-4 py-2.5 text-slate-700">${Number(item.precio_unitario).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-800">{item.cantidad}</td>
                      <td className="px-4 py-2.5 font-bold text-green-600">${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>

          {pres.observaciones && (
            <SoftCard title="Observaciones" icon="📝">
              <p className="text-sm text-slate-700 whitespace-pre-line">{pres.observaciones}</p>
            </SoftCard>
          )}

          {pres.venta_numero && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-sm">
              ✓ Convertido a <Link to={`/ventas/${pres.venta}`} className="text-purple-700 font-bold hover:underline">Venta #{pres.venta_numero}</Link>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          <SoftCard title="Estado" icon="📌">
            <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${badgeCls}`}>
              {pres.estado_display}
            </span>
            {pres.esta_vencido && (
              <p className="text-xs text-orange-600 mt-2 font-medium">⚠️ Presupuesto vencido</p>
            )}
          </SoftCard>

          <SoftCard title="Cliente" icon="👤">
            <div className="text-sm space-y-1">
              <p className="font-semibold text-slate-800">{pres.nombre_cliente}</p>
              {pres.cliente_info?.dni && <p className="text-slate-500">DNI: {pres.cliente_info.dni}</p>}
              {pres.cliente_info?.telefono && <p className="text-slate-500">Tel: {pres.cliente_info.telefono}</p>}
            </div>
          </SoftCard>

          <SoftCard title="Validez" icon="📅">
            <div className="text-sm space-y-1">
              <p><span className="font-semibold text-slate-600">Creado:</span> {fmt(pres.fecha_creacion)}</p>
              <p><span className="font-semibold text-slate-600">Válido hasta:</span> {fmt(pres.fecha_vencimiento)}</p>
            </div>
          </SoftCard>

          <SoftCard title="Totales" icon="💰">
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span><span className="font-semibold">${Number(pres.subtotal).toFixed(2)}</span>
              </div>
              {Number(pres.descuento_monto) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento ({pres.descuento_porcentaje}%):</span>
                  <span>-${Number(pres.descuento_monto).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base">
                <span>TOTAL:</span><span className="text-green-600">${Number(pres.total).toFixed(2)}</span>
              </div>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
