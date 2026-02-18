/**
 * Página de Historial de Movimientos de Stock
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getMovimientos, getMovimientosPorVariante } from '../services/inventarioService';
import productosService from '../services/productosService';

export default function Movimientos() {
  const [searchParams] = useSearchParams();
  const varianteIdParam = searchParams.get('variante');
  
  const [movimientos, setMovimientos] = useState([]);
  const [variante, setVariante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    if (varianteIdParam) {
      cargarVariante();
    }
    cargarMovimientos();
  }, [varianteIdParam, filtroTipo]);

  const cargarVariante = async () => {
    try {
      const data = await productosService.getVariante(varianteIdParam);
      setVariante(data);
    } catch (err) {
      console.error('Error al cargar variante:', err);
    }
  };

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data;
      if (varianteIdParam) {
        data = await getMovimientosPorVariante(varianteIdParam);
      } else {
        const params = {};
        if (filtroTipo) {
          params.tipo = filtroTipo;
        }
        data = await getMovimientos(params);
      }
      
      setMovimientos(data);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setError('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'COMPRA':
        return 'bg-green-100 text-green-800';
      case 'VENTA':
        return 'bg-blue-100 text-blue-800';
      case 'DEVOLUCION':
        return 'bg-purple-100 text-purple-800';
      case 'ANULACION':
        return 'bg-red-100 text-red-800';
      case 'AJUSTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRANSFERENCIA':
        return 'bg-indigo-100 text-indigo-800';
      case 'INVENTARIO_INICIAL':
        return 'bg-gray-100 text-gray-800';
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Movimientos</h1>
          {variante && (
            <p className="text-gray-600 mt-1">
              Producto: {variante.codigo} - {variante.nombre_completo}
            </p>
          )}
        </div>
        <Link
          to="/inventario"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Volver al Inventario
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="COMPRA">Compra</option>
              <option value="VENTA">Venta</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="ANULACION">Anulación</option>
              <option value="AJUSTE">Ajuste Manual</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="INVENTARIO_INICIAL">Inventario Inicial</option>
            </select>
          </div>
          
          <div className="flex items-end justify-end">
            <button
              onClick={cargarMovimientos}
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
          <div className="text-center py-8">Cargando movimientos...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron movimientos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  {!variante && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depósito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Anterior
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Posterior
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(mov.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoColor(mov.tipo)}`}>
                        {mov.tipo_display}
                      </span>
                    </td>
                    {!variante && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{mov.variante_sku}</div>
                        <div className="text-gray-500 text-xs">{mov.variante_nombre}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mov.deposito_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${mov.cantidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.cantidad >= 0 ? '+' : ''}{mov.cantidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.stock_anterior}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mov.stock_posterior}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mov.usuario_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {mov.observaciones || '-'}
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
