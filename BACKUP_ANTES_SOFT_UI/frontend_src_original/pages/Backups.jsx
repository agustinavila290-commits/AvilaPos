/**
 * Página de gestión de backups
 * Solo accesible para administradores
 */
import { useState, useEffect } from 'react';
import {
  getBackupLogs,
  crearBackup,
  listarArchivosBackup,
  restaurarBackup,
  eliminarBackup,
  getEstadisticasBackup,
  descargarBackup
} from '../services/sistemaService';

export default function Backups() {
  const [logs, setLogs] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creandoBackup, setCreandoBackup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Confirmación de restauración
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [archivoARestaurar, setArchivoARestaurar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [logsData, archivosData, statsData] = await Promise.all([
        getBackupLogs(),
        listarArchivosBackup(),
        getEstadisticasBackup()
      ]);
      
      setLogs(logsData.results || logsData);
      setArchivos(archivosData.backups || []);
      setEstadisticas(statsData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar información de backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearBackup = async () => {
    try {
      setCreandoBackup(true);
      setError('');
      setSuccess('');
      
      const response = await crearBackup();
      
      if (response.success) {
        setSuccess(response.mensaje);
        await cargarDatos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      console.error('Error al crear backup:', err);
      setError('Error al crear backup');
    } finally {
      setCreandoBackup(false);
    }
  };

  const handleRestaurarClick = (archivo) => {
    setArchivoARestaurar(archivo);
    setMostrarConfirmacion(true);
  };

  const handleRestaurarConfirmar = async () => {
    try {
      setError('');
      setSuccess('');
      setMostrarConfirmacion(false);
      
      const response = await restaurarBackup(archivoARestaurar.nombre);
      
      if (response.success) {
        setSuccess(response.mensaje);
        await cargarDatos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      console.error('Error al restaurar backup:', err);
      setError('Error al restaurar backup');
    }
  };

  const handleEliminar = async (archivo) => {
    if (!confirm(`¿Está seguro de eliminar el backup: ${archivo.nombre}?`)) {
      return;
    }
    
    try {
      const response = await eliminarBackup(archivo.nombre);
      
      if (response.success) {
        setSuccess(response.mensaje);
        await cargarDatos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      console.error('Error al eliminar backup:', err);
      setError('Error al eliminar backup');
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Backups</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Respaldos automáticos de la base de datos
          </p>
        </div>
        <button
          onClick={handleCrearBackup}
          disabled={creandoBackup}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 font-semibold text-sm sm:text-base whitespace-nowrap"
        >
          {creandoBackup ? '⏳ Creando...' : '💾 Crear Backup Ahora'}
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Backups</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{estadisticas.total_backups}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs sm:text-sm text-gray-600">Tamaño Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{estadisticas.tamanio_total_mb} MB</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs sm:text-sm text-gray-600">Exitosos</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{estadisticas.backups_exitosos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs sm:text-sm text-gray-600">Fallidos</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{estadisticas.backups_fallidos}</p>
          </div>
        </div>
      )}

      {/* Lista de archivos de backup */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Archivos de Backup</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay backups disponibles
                  </td>
                </tr>
              ) : (
                archivos.map((archivo) => (
                  <tr key={archivo.nombre} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {archivo.nombre}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">
                      {formatFecha(archivo.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {archivo.tamanio_mb} MB
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleRestaurarClick(archivo)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleEliminar(archivo)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Historial de Backups</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay historial de backups
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatFecha(log.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.estado === 'EXITOSO'
                          ? 'bg-green-100 text-green-800'
                          : log.estado === 'FALLIDO'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.estado}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">
                      {log.archivo || '-'}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                      {log.usuario_nombre || 'Automático'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación de restauración */}
      {mostrarConfirmacion && archivoARestaurar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-red-600">⚠️ Confirmar Restauración</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-900 mb-4">
                ¿Está seguro de que desea restaurar este backup?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ ADVERTENCIA
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Esta acción reemplazará TODOS los datos actuales de la base de datos.
                  Los cambios no guardados se perderán.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Archivo:</strong> {archivoARestaurar.nombre}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Fecha:</strong> {formatFecha(archivoARestaurar.fecha)}
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setArchivoARestaurar(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestaurarConfirmar}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
