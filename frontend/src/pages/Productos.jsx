import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import productosService from '../services/productosService';
import { useAuth } from '../hooks/useAuth';

const DEBOUNCE_MS = 200;

export default function Productos() {
  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const searchAbortRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const loadVariantes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productosService.getVariantes();
      setVariantes(data.results || data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (term) => {
    const t = term.trim();
    if (!t) {
      loadVariantes();
      return;
    }
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    const signal = searchAbortRef.current.signal;
    setSearching(true);
    try {
      const data = await productosService.search(t, { page_size: 40, signal });
      if (signal?.aborted) return;
      setVariantes(data.results || data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error en búsqueda:', err);
    } finally {
      setSearching(false);
    }
  }, [loadVariantes]);

  useEffect(() => {
    loadVariantes();
  }, [loadVariantes]);

  const mountedRef = useRef(false);
  // Debounce: al dejar de escribir, buscar tras DEBOUNCE_MS
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      if (mountedRef.current) loadVariantes();
      mountedRef.current = true;
      return;
    }
    mountedRef.current = true;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      runSearch(term);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [searchTerm, loadVariantes, runSearch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Al salir del input (blur), buscar de inmediato con lo que haya escrito
  const handleSearchBlur = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (searchTerm.trim()) {
      runSearch(searchTerm);
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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">📦 Productos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona tu catálogo de productos</p>
        </div>
        {isAdmin() && (
          <div className="flex gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={() => navigate('/productos/importar')}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base flex items-center gap-2"
            >
              📥 Importar Excel
            </button>
            <button
              onClick={() => navigate('/productos/nuevo')}
              className="btn-primary flex items-center gap-2"
            >
              + Nuevo
            </button>
          </div>
        )}
      </div>

      {/* Búsqueda - Soft UI */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por código, nombre de producto o marca..."
            value={searchTerm}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
            className="search-input pl-12 uppercase-input"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Buscando...</div>
          )}
        </div>
      </div>

      {/* Lista de productos - Soft UI */}
      <div className="card">
        {variantes.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">No hay productos</h3>
            <p className="mt-2 text-sm text-gray-600">
              {isAdmin() ? 'Comienza creando un nuevo producto o importando desde Excel.' : 'No hay productos disponibles.'}
            </p>
            {isAdmin() && (
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => navigate('/productos/importar')}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
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
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Código</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Variante</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Marca</th>
                  {isAdmin() && (
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Costo</th>
                  )}
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Precio</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">P. Tarjeta</th>
                  {isAdmin() && (
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Margen</th>
                  )}
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Stock</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {variantes.map((variante) => (
                  <tr 
                    key={variante.id} 
                    onClick={() => navigate(`/productos/${variante.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-800 truncate">
                      {variante.codigo}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-800 truncate min-w-0">
                      {variante.producto_nombre}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate min-w-0">
                      {variante.nombre_variante}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate min-w-0">
                      {variante.marca_nombre}
                    </td>
                    {isAdmin() && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatPrice(variante.costo)}
                      </td>
                    )}
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600">
                      {formatPrice(variante.precio_mostrador)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-blue-600">
                      {formatPrice(variante.precio_tarjeta ?? 0)}
                    </td>
                    {isAdmin() && (
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold rounded-lg ${
                          variante.margen_porcentaje < 5
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : variante.margen_porcentaje < 15
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {variante.margen_porcentaje ? variante.margen_porcentaje.toFixed(1) + '%' : 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-lg ${
                        variante.stock_actual <= 2
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : variante.stock_actual <= 5
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {variante.stock_actual || 0}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-lg ${
                        variante.activo
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
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
