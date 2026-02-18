/**
 * Página de listado de ventas
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVentas, getResumenDiario } from '../services/ventasService';
import { useAuth } from '../hooks/useAuth';

export default function Ventas() {
  const { isAdmin } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filtroEstado) {
        params.estado = filtroEstado;
      }
      
      const [ventasData, resumenData] = await Promise.all([
        getVentas(params),
        getResumenDiario()
      ]);
      
      setVentas(ventasData.results || ventasData);
      setResumen(resumenData);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    // Implementar búsqueda si hay término
    cargarDatos();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return 'bg-green-100 text-green-800';
      case 'ANULADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <Link
          to="/ventas/nueva"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Nueva Venta
        </Link>
      </div>

      {/* Resumen del día */}
      {resumen && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Resumen del Día</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{resumen.total_ventas}</p>
              <p className="text-sm text-blue-700">Ventas realizadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">${resumen.monto_total?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-blue-700">Total facturado</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Número de venta, cliente, DNI..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Cargando ventas...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron ventas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{venta.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(venta.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {venta.cliente_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cantidad_items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${venta.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.metodo_pago_display}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(venta.estado_display)}`}>
                        {venta.estado_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/ventas/${venta.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
