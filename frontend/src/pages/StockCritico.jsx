/**
 * Página de Stock Crítico
 * Muestra productos con stock crítico (<=2 unidades)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocksCriticos, getDepositos } from '../services/inventarioService';

export default function StockCritico() {
  const [stocks, setStocks] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [depositoSeleccionado, setDepositoSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDepositos();
  }, []);

  useEffect(() => {
    cargarStocksCriticos();
  }, [depositoSeleccionado]);

  const cargarDepositos = async () => {
    try {
      const data = await getDepositos();
      setDepositos(data);
    } catch (err) {
      console.error('Error al cargar depósitos:', err);
    }
  };

  const cargarStocksCriticos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await getStocksCriticos(depositoSeleccionado || null);
      setStocks(data);
    } catch (err) {
      console.error('Error al cargar stocks críticos:', err);
      setError('Error al cargar stocks críticos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'SIN_STOCK':
        return 'bg-red-100 text-red-800';
      case 'CRITICO':
        return 'bg-red-100 text-red-800';
      case 'BAJO':
        return 'bg-yellow-100 text-yellow-800';
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
      default:
        return estado;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Crítico</h1>
          <p className="text-gray-600 mt-1">
            Productos con stock bajo o agotado (≤2 unidades)
          </p>
        </div>
        <Link
          to="/inventario"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Volver al Inventario
        </Link>
      </div>

      {/* Alertas */}
      {!loading && stocks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {stocks.length} producto{stocks.length !== 1 ? 's' : ''} requiere{stocks.length !== 1 ? 'n' : ''} atención
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Se recomienda realizar compras para reponer el stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por depósito
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
          
          <div className="flex items-end justify-end">
            <button
              onClick={cargarStocksCriticos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Cargando stocks críticos...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">
              ¡Excelente! No hay productos con stock crítico
            </p>
            <p className="text-gray-500 mt-1">
              Todos los productos tienen stock suficiente
            </p>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${stock.cantidad <= 0 ? 'text-red-600' : 'text-red-600'}`}>
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
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Historial
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
