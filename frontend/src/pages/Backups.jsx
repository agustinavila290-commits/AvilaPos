/**
 * Gestión de Backups — Fase 11
 * Backups manuales, automáticos diarios, pre-actualización y restauración.
 */
import { useState, useEffect } from 'react';
import {
  getBackupLogs,
  crearBackup,
  listarArchivosBackup,
  restaurarBackup,
  eliminarBackup,
  getEstadisticasBackup,
  descargarBackupPorNombre,
  crearBackupPreActualizacion,
} from '../services/sistemaService';

const TIPO_BADGE = {
  manual: 'bg-blue-100 text-blue-700',
  automatico: 'bg-green-100 text-green-700',
  pre_actualizacion: 'bg-yellow-100 text-yellow-700',
};
const TIPO_LABEL = {
  manual: 'Manual',
  automatico: 'Automático',
  pre_actualizacion: 'Pre-actualización',
};

export default function Backups() {
  const [logs, setLogs] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creandoBackup, setCreandoBackup] = useState(false);
  const [creandoPreAct, setCreandoPreAct] = useState(false);
  const [descargando, setDescargando] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirmación de restauración
  const [modalRestaurar, setModalRestaurar] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [logsData, archivosData, statsData] = await Promise.all([
        getBackupLogs(),
        listarArchivosBackup(),
        getEstadisticasBackup(),
      ]);
      setLogs(logsData.results || logsData);
      setArchivos(archivosData.backups || []);
      setEstadisticas(statsData);
    } catch (err) {
      setError('Error al cargar información de backups');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMsg = (tipo, msg) => {
    if (tipo === 'ok') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 8000);
  };

  const handleCrearBackup = async () => {
    setCreandoBackup(true);
    try {
      const r = await crearBackup();
      if (r.success) { mostrarMsg('ok', r.mensaje); await cargarDatos(); }
      else mostrarMsg('err', r.mensaje);
    } catch { mostrarMsg('err', 'Error al crear backup'); }
    finally { setCreandoBackup(false); }
  };

  const handlePreActualizacion = async () => {
    if (!confirm('¿Crear un backup de seguridad antes de actualizar el sistema?')) return;
    setCreandoPreAct(true);
    try {
      const r = await crearBackupPreActualizacion();
      if (r.success) { mostrarMsg('ok', '✅ ' + r.mensaje); await cargarDatos(); }
      else mostrarMsg('err', r.mensaje);
    } catch { mostrarMsg('err', 'Error al crear backup pre-actualización'); }
    finally { setCreandoPreAct(false); }
  };

  const handleDescargar = async (archivo) => {
    setDescargando(archivo.nombre);
    try {
      await descargarBackupPorNombre(archivo.nombre);
    } catch { mostrarMsg('err', 'Error al descargar el backup'); }
    finally { setDescargando(''); }
  };

  const handleRestaurar = async () => {
    if (!modalRestaurar) return;
    try {
      setError(''); setSuccess('');
      setModalRestaurar(null);
      const r = await restaurarBackup(modalRestaurar.nombre);
      if (r.success) { mostrarMsg('ok', r.mensaje); await cargarDatos(); }
      else mostrarMsg('err', r.mensaje);
    } catch { mostrarMsg('err', 'Error al restaurar backup'); }
  };

  const handleEliminar = async (archivo) => {
    if (!confirm(`¿Eliminar el backup: ${archivo.nombre}?`)) return;
    try {
      const r = await eliminarBackup(archivo.nombre);
      if (r.success) { mostrarMsg('ok', r.mensaje); await cargarDatos(); }
      else mostrarMsg('err', r.mensaje);
    } catch { mostrarMsg('err', 'Error al eliminar backup'); }
  };

  const fmt = (fecha) => fecha
    ? new Date(fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const fmtMB = (bytes) => bytes ? (bytes / 1024 / 1024).toFixed(2) + ' MB' : '0 MB';

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">💾 Gestión de Backups</h1>
          <p className="text-sm text-gray-500 mt-1">Respaldo automático diario + manual + pre-actualización</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCrearBackup}
            disabled={creandoBackup}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {creandoBackup ? '⏳ Creando...' : '💾 Backup manual'}
          </button>
          <button
            onClick={handlePreActualizacion}
            disabled={creandoPreAct}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {creandoPreAct ? '⏳...' : '🛡️ Backup pre-actualización'}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">{success}</div>}

      {/* Estadísticas + estado scheduler */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center">
            <p className="text-xs text-gray-500">Total backups</p>
            <p className="text-2xl font-bold text-gray-800">{estadisticas.total_backups}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center">
            <p className="text-xs text-gray-500">Tamaño total</p>
            <p className="text-xl font-bold text-blue-600">{estadisticas.tamanio_total_mb} MB</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center">
            <p className="text-xs text-gray-500">Exitosos</p>
            <p className="text-2xl font-bold text-green-600">{estadisticas.backups_exitosos}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center">
            <p className="text-xs text-gray-500">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">{estadisticas.backups_fallidos}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500">Scheduler automático</p>
            <p className={`text-sm font-bold mt-1 ${estadisticas.scheduler_activo ? 'text-green-600' : 'text-gray-400'}`}>
              {estadisticas.scheduler_activo ? '✅ Activo (2:00 AM)' : '⚪ Inactivo'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500">Último automático</p>
            <p className="text-xs font-medium text-gray-600 mt-1">
              {estadisticas.ultimo_backup_automatico
                ? fmt(estadisticas.ultimo_backup_automatico)
                : 'Sin registros'}
            </p>
          </div>
        </div>
      )}

      {/* Info del contenido */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex flex-wrap gap-4">
        <span>📦 Cada backup incluye:</span>
        <span>🗄️ Base de datos SQLite</span>
        <span>🖼️ Imágenes de productos</span>
        <span>🧾 Comprobantes y facturas</span>
        <span>📋 Metadata</span>
      </div>

      {/* Lista de archivos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Archivos de Backup disponibles</h2>
          <span className="text-sm text-gray-400">{archivos.length} archivo(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Archivo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tamaño</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {archivos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No hay backups disponibles. Creá el primero con el botón de arriba.
                  </td>
                </tr>
              ) : archivos.map(a => (
                <tr key={a.nombre} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-700 max-w-xs truncate">{a.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_BADGE[a.tipo] || 'bg-gray-100 text-gray-600'}`}>
                      {TIPO_LABEL[a.tipo] || a.tipo}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-gray-500">{fmt(a.fecha)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtMB(a.tamanio)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDescargar(a)}
                        disabled={descargando === a.nombre}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs disabled:opacity-50"
                      >
                        {descargando === a.nombre ? '⏳' : '⬇️ Descargar'}
                      </button>
                      <button
                        onClick={() => setModalRestaurar(a)}
                        className="text-amber-600 hover:text-amber-800 font-medium text-xs"
                      >
                        🔄 Restaurar
                      </button>
                      <button
                        onClick={() => handleEliminar(a)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de logs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Historial de ejecuciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Archivo</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tamaño</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Usuario</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Sin historial</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-700">{fmt(log.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      log.estado === 'EXITOSO' ? 'bg-green-100 text-green-700'
                      : log.estado === 'FALLIDO' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.estado}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs font-mono text-gray-500 max-w-xs truncate">
                    {log.archivo || '—'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-gray-500">
                    {log.tamanio_mb ? `${log.tamanio_mb} MB` : '—'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500">
                    {log.usuario_nombre || '🤖 Automático'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500">
                    {log.duracion ? `${log.duracion.toFixed(1)}s` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal restauración */}
      {modalRestaurar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Confirmar Restauración</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 font-semibold">ADVERTENCIA</p>
              <p className="text-sm text-yellow-700 mt-1">
                Esta acción reemplazará <strong>TODOS</strong> los datos actuales de la base de datos y los archivos media.
                El servidor debe reiniciarse después para que los cambios en la BD surtan efecto.
              </p>
            </div>
            <div className="text-sm text-gray-700 mb-4 space-y-1">
              <p><strong>Archivo:</strong> <span className="font-mono text-xs">{modalRestaurar.nombre}</span></p>
              <p><strong>Fecha:</strong> {fmt(modalRestaurar.fecha)}</p>
              <p><strong>Tamaño:</strong> {fmtMB(modalRestaurar.tamanio)}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalRestaurar(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestaurar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
              >
                Sí, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
