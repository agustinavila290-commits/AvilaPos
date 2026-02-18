/**
 * Página de listado de compras - Soft UI
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompras } from '../services/comprasService';
import SoftCard from '../components/SoftCard';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarCompras();
  }, [filtroEstado]);

  const cargarCompras = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filtroEstado) {
        params.estado = filtroEstado;
      }
      if (busqueda.trim()) {
        params.search = busqueda.trim();
      }
      
      const data = await getCompras(params);
      setCompras(data.results || data);
    } catch (err) {
      console.error('Error al cargar compras:', err);
      setError('Error al cargar compras');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarCompras();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">🛒 Compras</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Registro de compras a proveedores</p>
        </div>
        <Link
          to="/compras/nueva"
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          + Registrar Compra
        </Link>
      </div>

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
              <option value="PENDIENTE">Pendiente</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Número, factura, proveedor..."
                className="flex-1 search-input"
              />
              <button
                type="submit"
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </SoftCard>

      {/* Tabla de compras - Soft UI */}
      <SoftCard title="Listado de Compras" icon="📋">
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Cargando compras...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 inline-block">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base sm:text-lg">No se encontraron compras</p>
            <p className="text-sm mt-2">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Número</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Proveedor</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">N° Factura</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Items</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      #{compra.numero}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatFecha(compra.fecha)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">
                      {compra.proveedor_nombre}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {compra.numero_factura || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {compra.cantidad_items}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ${compra.total?.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg ${getEstadoColor(compra.estado_display)}`}>
                        {compra.estado_display}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/compras/${compra.id}`}
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
