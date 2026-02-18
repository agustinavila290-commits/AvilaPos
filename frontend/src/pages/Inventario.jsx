/**
 * Página principal de Inventario - Soft UI
 * Lista todos los stocks por depósito
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocks, getDepositos, getStocksCriticos } from '../services/inventarioService';
import { useAuth } from '../hooks/useAuth';
import SoftCard from '../components/SoftCard';

export default function Inventario() {
  const { user, isAdmin } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [depositoSeleccionado, setDepositoSeleccionado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [soloStockCritico, setSoloStockCritico] = useState(false);

  useEffect(() => {
    cargarDepositos();
  }, []);

  useEffect(() => {
    cargarStocks();
  }, [depositoSeleccionado, soloStockCritico]);

  const cargarDepositos = async () => {
    try {
      const data = await getDepositos();
      const lista = Array.isArray(data) ? data : (data?.results ?? []);
      setDepositos(lista);
      // Seleccionar depósito principal por defecto
      const principal = lista.find(d => d.es_principal);
      if (principal) {
        setDepositoSeleccionado(principal.id);
      }
    } catch (err) {
      console.error('Error al cargar depósitos:', err);
      setError('Error al cargar depósitos');
      setDepositos([]);
    }
  };

  const cargarStocks = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data;
      if (soloStockCritico) {
        data = await getStocksCriticos(depositoSeleccionado || null);
      } else {
        const params = {};
        if (depositoSeleccionado) {
          params.deposito = depositoSeleccionado;
        }
        if (busqueda.trim()) {
          params.search = busqueda.trim();
        }
        data = await getStocks(params);
      }
      const listaStocks = Array.isArray(data) ? data : (data?.results ?? []);
      setStocks(listaStocks);
    } catch (err) {
      console.error('Error al cargar stocks:', err);
      setError('Error al cargar stocks');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarStocks();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'SIN_STOCK':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'CRITICO':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'BAJO':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'NORMAL':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'SIN_STOCK':
        return 'Sin Stock';
      case 'CRITICO':
        return 'Crítico';
      case 'BAJO':
        return 'Bajo';
      case 'NORMAL':
        return 'Normal';
      default:
        return estado;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">📦 Inventario</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Control de stock por depósito</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            to="/inventario/critico"
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base text-center"
          >
            ⚠️ Stock Crítico
          </Link>
          
          {isAdmin() && (
            <Link
              to="/inventario/movimientos"
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base text-center"
            >
              Ver Movimientos
            </Link>
          )}
        </div>
      </div>

      {/* Filtros - Soft UI */}
      <SoftCard title="Filtros" icon="🔍">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {/* Depósito */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Depósito
            </label>
            <select
              value={depositoSeleccionado}
              onChange={(e) => setDepositoSeleccionado(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
            >
              <option value="">Todos los depósitos</option>
              {(Array.isArray(depositos) ? depositos : []).map((deposito) => (
                <option key={deposito.id} value={deposito.id}>
                  {deposito.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar producto
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2 sm:gap-3 lg:gap-4">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="SKU, código de barras, nombre..."
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

          {/* Filtro stock crítico */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloStockCritico}
                onChange={(e) => setSoloStockCritico(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Solo stock crítico
              </span>
            </label>
          </div>
        </div>
      </SoftCard>

      {/* Tabla de Stocks - Soft UI */}
      <SoftCard title="Listado de Stock" icon="📋">
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Cargando stocks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 inline-block">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base sm:text-lg">No se encontraron productos en stock</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    SKU
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Producto
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">
                    Marca
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Depósito
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      {stock.codigo}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-800 font-medium">
                      {stock.nombre_completo}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {stock.marca}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {stock.deposito_nombre}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${stock.cantidad <= 0 ? 'text-red-600' : stock.cantidad <= 2 ? 'text-red-600' : stock.cantidad <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {stock.cantidad}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg ${getEstadoColor(stock.estado)}`}>
                        {getEstadoTexto(stock.estado)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/inventario/movimientos?variante=${stock.variante}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Ver Historial
                      </Link>
                      {isAdmin() && (
                        <>
                          <span className="mx-2 text-gray-300">|</span>
                          <Link
                            to={`/inventario/ajustar/${stock.variante}/${stock.deposito}`}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                          >
                            Ajustar
                          </Link>
                        </>
                      )}
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
