/**
 * Página de logs de auditoría
 * Solo accesible para administradores
 */
import { useState, useEffect } from 'react';
import { getAuditLogs, getEstadisticasAudit } from '../services/sistemaService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    cargarDatos();
  }, [page, filtroAccion, filtroUsuario, fechaDesde, fechaHasta]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        ...(filtroAccion && { accion: filtroAccion }),
        ...(filtroUsuario && { search: filtroUsuario }),
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta })
      };
      
      const [logsData, statsData] = await Promise.all([
        getAuditLogs(params),
        getEstadisticasAudit()
      ]);
      
      setLogs(logsData.results || logsData);
      setTotalPages(Math.ceil((logsData.count || 0) / 20));
      setEstadisticas(statsData);
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setError('Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroAccion('');
    setFiltroUsuario('');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAccionColor = (accion) => {
    const colors = {
      'CREAR': 'bg-green-100 text-green-800',
      'MODIFICAR': 'bg-blue-100 text-blue-800',
      'ELIMINAR': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'VENTA': 'bg-green-100 text-green-800',
      'COMPRA': 'bg-orange-100 text-orange-800',
      'AJUSTE_STOCK': 'bg-yellow-100 text-yellow-800',
      'ANULACION': 'bg-red-100 text-red-800',
      'DEVOLUCION': 'bg-indigo-100 text-indigo-800',
    };
    
    return colors[accion] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !logs.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Registro detallado de acciones del sistema
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Logs</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.total_logs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Acción Más Común</p>
            <p className="text-xl font-bold text-blue-600">
              {estadisticas.por_accion?.[0]?.accion || '-'}
            </p>
            <p className="text-sm text-gray-500">
              {estadisticas.por_accion?.[0]?.total || 0} veces
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Usuario Más Activo</p>
            <p className="text-xl font-bold text-green-600">
              {estadisticas.por_usuario?.[0]?.usuario__username || '-'}
            </p>
            <p className="text-sm text-gray-500">
              {estadisticas.por_usuario?.[0]?.total || 0} acciones
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Acción
            </label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todas</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VENTA">Venta</option>
              <option value="COMPRA">Compra</option>
              <option value="AJUSTE_STOCK">Ajuste Stock</option>
              <option value="ANULACION">Anulación</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="CREAR">Crear</option>
              <option value="MODIFICAR">Modificar</option>
              <option value="ELIMINAR">Eliminar</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acción
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay logs que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatFecha(log.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.usuario_nombre || 'Sistema'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccionColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {log.descripcion}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
