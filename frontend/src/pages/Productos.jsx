import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import productosService from '../services/productosService';
import { useAuth } from '../hooks/useAuth';
import { getModelosMoto, getProductosPorMoto, getMotosAdmin, asignarMotoMasivo } from '../services/inventarioService';

const PLACEHOLDER_IMG = (
  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

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
  const [modelosMoto, setModelosMoto] = useState([]);
  const [motoSeleccionada, setMotoSeleccionada] = useState('');
  const [filtroPorMoto, setFiltroPorMoto] = useState(false);
  const [subiendoImg, setSubiendoImg] = useState(null);
  const camaraRef = useRef(null);
  const camaraVarianteRef = useRef(null);
  // Asignación masiva
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [todasMotosAdmin, setTodasMotosAdmin] = useState([]);
  const [modalAsignMoto, setModalAsignMoto] = useState(false);
  const [motoParaAsignar, setMotoParaAsignar] = useState('');
  const [asignandoMasivo, setAsignandoMasivo] = useState(false);

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
    getModelosMoto().then(setModelosMoto).catch(() => {});
    getMotosAdmin().then(setTodasMotosAdmin).catch(() => {});
  }, [loadVariantes]);

  const handleFiltrarPorMoto = async (motoId) => {
    setMotoSeleccionada(motoId);
    if (!motoId) {
      setFiltroPorMoto(false);
      loadVariantes();
      return;
    }
    setFiltroPorMoto(true);
    setLoading(true);
    try {
      const res = await getProductosPorMoto(motoId);
      setVariantes(res.results || []);
    } catch {
      setVariantes([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;

  const handleEliminar = async (e, varianteId) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await productosService.deleteVariante(varianteId);
      setVariantes(prev => prev.filter(v => v.id !== varianteId));
    } catch {
      alert('Error al eliminar el producto');
    }
  };

  const handleCamaraClick = (e, varianteId, productoBaseId) => {
    e.stopPropagation();
    camaraVarianteRef.current = { varianteId, productoBaseId };
    camaraRef.current?.click();
  };

  const toggleSeleccion = (e, varianteId, productoBaseId) => {
    e.stopPropagation();
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(varianteId)) next.delete(varianteId);
      else next.add(varianteId);
      return next;
    });
  };

  const handleAsignMasivoConfirm = async () => {
    if (!motoParaAsignar || seleccionados.size === 0) return;
    setAsignandoMasivo(true);
    try {
      const pbIds = variantes
        .filter(v => seleccionados.has(v.id))
        .map(v => v.producto_base)
        .filter(Boolean);
      const unique = [...new Set(pbIds)];
      await asignarMotoMasivo(parseInt(motoParaAsignar), unique);
      alert(`Moto asignada a ${unique.length} producto(s).`);
      setSeleccionados(new Set());
      setModalAsignMoto(false);
      setMotoParaAsignar('');
    } catch { alert('Error al asignar'); }
    finally { setAsignandoMasivo(false); }
  };

  const handleCamaraChange = async (e) => {
    const file = e.target.files?.[0];
    const { varianteId, productoBaseId } = camaraVarianteRef.current || {};
    if (!file || !productoBaseId) return;
    setSubiendoImg(varianteId);
    try {
      await productosService.subirImagen(productoBaseId, file);
      // Recargar para mostrar thumbnail actualizado
      const fresh = await productosService.search(searchTerm || '', { page_size: 40 });
      setVariantes(fresh.results || fresh);
    } catch {
      alert('Error al subir la imagen');
    } finally {
      setSubiendoImg(null);
      if (camaraRef.current) camaraRef.current.value = '';
    }
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
      {/* Input file oculto para subida rápida de imagen desde la lista */}
      <input ref={camaraRef} type="file" accept="image/*" className="hidden" onChange={handleCamaraChange} />
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

      {/* Barra de asignación masiva */}
      {seleccionados.size > 0 && isAdmin() && (
        <div className="bg-brand-blue text-white rounded-xl p-3 flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-sm">{seleccionados.size} producto(s) seleccionado(s)</span>
          <button
            onClick={() => setModalAsignMoto(true)}
            className="px-3 py-1.5 bg-white text-brand-blue text-sm font-bold rounded-lg hover:bg-blue-50"
          >
            🏍️ Asignar moto compatible
          </button>
          <button onClick={() => setSeleccionados(new Set())} className="text-blue-200 text-sm underline ml-auto">
            Cancelar selección
          </button>
        </div>
      )}

      {/* Filtro por moto */}
      {modelosMoto.length > 0 && (
        <div className="card flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600">
            <svg className="w-4 h-4 inline mr-1 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filtrar por moto:
          </span>
          <select
            value={motoSeleccionada}
            onChange={e => handleFiltrarPorMoto(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todas las motos</option>
            {modelosMoto.map(m => (
              <option key={m.id} value={m.id}>{m.marca} {m.modelo} {m.anio}</option>
            ))}
          </select>
          {filtroPorMoto && (
            <button
              onClick={() => handleFiltrarPorMoto('')}
              className="text-xs text-red-500 underline"
            >
              Quitar filtro
            </button>
          )}
        </div>
      )}

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
            disabled={filtroPorMoto}
            className="search-input pl-12 uppercase-input disabled:opacity-50"
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
                  {isAdmin() && <th className="px-3 py-3 w-8" />}
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase w-12">Img</th>
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
                  {isAdmin() && <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {variantes.map((variante) => (
                  <tr
                    key={variante.id}
                    onClick={() => navigate(`/productos/${variante.id}`)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${seleccionados.has(variante.id) ? 'bg-blue-50' : ''}`}
                  >
                    {/* Checkbox selección masiva */}
                    {isAdmin() && (
                      <td className="px-2 py-2 w-8" onClick={e => toggleSeleccion(e, variante.id, variante.producto_base)}>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(variante.id)}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                      </td>
                    )}
                    {/* Thumbnail + cámara rápida */}
                    <td className="px-2 py-2 w-12" onClick={e => e.stopPropagation()}>
                      <div className="relative group w-10 h-10">
                        {variante.imagen_url
                          ? <img src={variante.imagen_url} alt="" className="w-10 h-10 object-cover rounded" />
                          : PLACEHOLDER_IMG
                        }
                        {isAdmin() && (
                          <button
                            onClick={e => handleCamaraClick(e, variante.id, variante.producto_base)}
                            disabled={subiendoImg === variante.id}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded flex items-center justify-center transition-opacity"
                            title="Subir imagen"
                          >
                            {subiendoImg === variante.id
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            }
                          </button>
                        )}
                      </div>
                    </td>
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
                    {isAdmin() && (
                      <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/productos/${variante.id}`); }}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={e => handleEliminar(e, variante.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal asignación masiva de moto */}
      {modalAsignMoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-4">Asignar moto compatible</h3>
            <p className="text-sm text-gray-600 mb-3">
              Seleccioná la moto a asignar a los <strong>{seleccionados.size}</strong> productos seleccionados:
            </p>
            <select
              value={motoParaAsignar}
              onChange={e => setMotoParaAsignar(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue mb-4"
            >
              <option value="">Seleccioná una moto...</option>
              {todasMotosAdmin.filter(m => m.activo).map(m => (
                <option key={m.id} value={m.id}>{m.marca} {m.modelo} {m.anio}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModalAsignMoto(false); setMotoParaAsignar(''); }} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancelar</button>
              <button
                onClick={handleAsignMasivoConfirm}
                disabled={!motoParaAsignar || asignandoMasivo}
                className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {asignandoMasivo ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
