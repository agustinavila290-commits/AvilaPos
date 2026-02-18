/**
 * Página principal de Inventario
 * Lista todos los stocks por depósito
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocks, getDepositos, getStocksCriticos } from '../services/inventarioService';
import { useAuth } from '../hooks/useAuth';

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
      setDepositos(data);
      // Seleccionar depósito principal por defecto
      const principal = data.find(d => d.es_principal);
      if (principal) {
        setDepositoSeleccionado(principal.id);
      }
    } catch (err) {
      console.error('Error al cargar depósitos:', err);
      setError('Error al cargar depósitos');
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
      
      setStocks(data);
    } catch (err) {
      console.error('Error al cargar stocks:', err);
      setError('Error al cargar stocks');
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
        return 'bg-red-100 text-red-800';
      case 'CRITICO':
        return 'bg-red-100 text-red-800';
      case 'BAJO':
        return 'bg-yellow-100 text-yellow-800';
      case 'NORMAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <div className="flex gap-2">
          <Link
            to="/inventario/critico"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Ver Stock Crítico
          </Link>
          
          {isAdmin() && (
            <Link
              to="/inventario/movimientos"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ver Movimientos
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Depósito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depósito
            </label>
            <select
              value={depositoSeleccionado}
              onChange={(e) => setDepositoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los depósitos</option>
              {depositos.map((deposito) => (
                <option key={deposito.id} value={deposito.id}>
                  {deposito.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar producto
            </label>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="SKU, código de barras, nombre..."
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

          {/* Filtro stock crítico */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloStockCritico}
                onChange={(e) => setSoloStockCritico(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Solo stock crítico
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabla de Stocks */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Cargando stocks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron productos en stock
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depósito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
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
                {stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stock.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.nombre_completo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.marca}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.deposito_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${stock.cantidad <= 0 ? 'text-red-600' : stock.cantidad <= 2 ? 'text-red-600' : stock.cantidad <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {stock.cantidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(stock.estado)}`}>
                        {getEstadoTexto(stock.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/inventario/movimientos?variante=${stock.variante}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Ver Historial
                      </Link>
                      {isAdmin() && (
                        <Link
                          to={`/inventario/ajustar/${stock.variante}/${stock.deposito}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ajustar
                        </Link>
                      )}
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
