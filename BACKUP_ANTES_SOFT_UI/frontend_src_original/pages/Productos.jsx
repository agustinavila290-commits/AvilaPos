import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productosService from '../services/productosService';
import { useAuth } from '../hooks/useAuth';

export default function Productos() {
  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadVariantes();
  }, []);

  const loadVariantes = async () => {
    try {
      setLoading(true);
      const data = await productosService.getVariantes();
      setVariantes(data.results || data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      try {
        const data = await productosService.search(value);
        setVariantes(data.results || data);
      } catch (error) {
        console.error('Error en búsqueda:', error);
      }
    } else {
      loadVariantes();
    }
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona tu catálogo de productos</p>
        </div>
        {isAdmin() && (
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/productos/importar')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Excel
            </button>
            <button
              onClick={() => navigate('/productos/nuevo')}
              className="btn-primary flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Producto
            </button>
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="card mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por código, nombre, marca..."
            value={searchTerm}
            onChange={handleSearch}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Lista de productos */}
      <div className="card">
        {variantes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin() ? 'Comienza creando un nuevo producto o importando desde Excel.' : 'No hay productos disponibles.'}
            </p>
            {isAdmin() && (
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => navigate('/productos/importar')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Importar Excel
                </button>
                <button
                  onClick={() => navigate('/productos/nuevo')}
                  className="btn-primary"
                >
                  Crear Producto
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  {isAdmin() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  {isAdmin() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variantes.map((variante) => (
                  <tr 
                    key={variante.id} 
                    onClick={() => navigate(`/productos/${variante.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variante.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variante.producto_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variante.nombre_variante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variante.marca_nombre}
                    </td>
                    {isAdmin() && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(variante.costo)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrice(variante.precio_mostrador)}
                    </td>
                    {isAdmin() && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          variante.margen_porcentaje < 5
                            ? 'bg-red-100 text-red-800'
                            : variante.margen_porcentaje < 15
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {variante.margen_porcentaje ? variante.margen_porcentaje.toFixed(1) + '%' : 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        variante.stock_actual <= 2
                          ? 'bg-red-100 text-red-800'
                          : variante.stock_actual <= 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {variante.stock_actual || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        variante.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {variante.activo ? 'Activo' : 'Inactivo'}
                      </span>
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
