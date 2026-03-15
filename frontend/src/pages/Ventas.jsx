/**
 * Página de listado de ventas - Soft UI
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVentas, getResumenDiario } from '../services/ventasService';
import MetricCard from '../components/MetricCard';
import SoftCard from '../components/SoftCard';

export default function Ventas() {
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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">💰 Ventas</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestión de ventas realizadas</p>
        </div>
        <Link
          to="/ventas/nueva"
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          + Nueva Venta
        </Link>
      </div>

      {/* Resumen del día - Soft UI */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <MetricCard
            title="Ventas Realizadas"
            value={resumen.total_ventas}
            icon="📊"
            color="blue"
            subtitle="Hoy"
          />
          <MetricCard
            title="Total Facturado"
            value={`$${Number(resumen.monto_total ?? 0).toFixed(2)}`}
            icon="💵"
            color="green"
            subtitle="Hoy"
          />
        </div>
      )}

      {/* Filtros - Soft UI */}
      <SoftCard title="Filtros" icon="🔍">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
            >
              <option value="">Todos</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2 sm:gap-3 lg:gap-4">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Número de venta, cliente, DNI..."
                className="flex-1 search-input"
              />
              <button
                type="submit"
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </SoftCard>

      {/* Tabla de ventas - Soft UI */}
      <SoftCard title="Listado de Ventas" icon="📋">
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            <div className="animate-spin inline-block w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Cargando ventas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 inline-block">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base sm:text-lg">No se encontraron ventas</p>
            <p className="text-sm mt-2">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Número
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Fecha
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Cliente
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Items
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Total
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Método Pago
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-800 truncate">
                      #{venta.numero}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {formatFecha(venta.fecha)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 font-medium truncate min-w-0">
                      {venta.cliente_nombre}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {venta.cantidad_items}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600">
                      ${Number(venta.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {venta.metodo_pago_display}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg ${getEstadoColor(venta.estado_display)}`}>
                        {venta.estado_display}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <Link
                        to={`/ventas/${venta.id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Ver Detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SoftCard>
    </div>
  );
}
