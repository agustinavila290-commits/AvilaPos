import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'
import Paginacion from '../../components/tienda/Paginacion'

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Autocompletado
  const [inputVal, setInputVal] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [showSug, setShowSug] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  // Filtros desde la URL
  const search = searchParams.get('search') || ''
  const categoriaId = searchParams.get('categoria') || ''
  const marcaId = searchParams.get('marca') || ''
  const modeloId = searchParams.get('modelo') || ''
  const motoLabel = searchParams.get('moto') || ''
  const ordering = searchParams.get('ordering') || ''
  const precioMin = searchParams.get('precio_min') || ''
  const precioMax = searchParams.get('precio_max') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Sync inputVal cuando cambia el param de URL (p.ej. al navegar con back)
  useEffect(() => { setInputVal(search) }, [search])

  // Cargar categorías y marcas una sola vez
  useEffect(() => {
    tiendaApi.getCategorias().then(r => setCategorias(r.data)).catch(() => {})
    tiendaApi.getMarcas().then(r => setMarcas(r.data)).catch(() => {})
  }, [])

  // Cargar productos cuando cambian los filtros
  const fetchProductos = useCallback(() => {
    setLoading(true)
    setError(null)

    const params = { page, page_size: 24 }
    if (search) params.search = search
    if (categoriaId) params.categoria = categoriaId
    if (marcaId) params.marca = marcaId
    if (modeloId) params.modelo = modeloId
    if (ordering) params.ordering = ordering

    tiendaApi.getProductos(params)
      .then(r => {
        setProductos(r.data.results)
        setTotalPages(r.data.total_pages)
        setTotalCount(r.data.count)
      })
      .catch(() => setError('No se pudo cargar el catálogo. Verificá tu conexión.'))
      .finally(() => setLoading(false))
  }, [search, categoriaId, marcaId, modeloId, ordering, page])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  // Autocompletado: debounce al escribir
  function handleSearchInput(val) {
    setInputVal(val)
    setShowSug(true)
    clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setSugerencias([])
      setParam('search', '')
      return
    }
    debounceRef.current = setTimeout(() => {
      // Actualizar URL param (dispara el fetch principal)
      setParam('search', val)
      // Fetch sugerencias rápidas
      tiendaApi.getProductos({ search: val, page_size: 5 })
        .then(r => setSugerencias(r.data.results))
        .catch(() => setSugerencias([]))
    }, 350)
  }

  function handleSugerenciaClick() {
    setShowSug(false)
    setSugerencias([])
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function onClickOut(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSug(false)
      }
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  // Filtro de precio client-side (sobre la página actual)
  const productosFiltrados = productos.filter(p => {
    const precio = parseFloat(p.precio_web)
    if (precioMin && precio < parseFloat(precioMin)) return false
    if (precioMax && precio > parseFloat(precioMax)) return false
    return true
  })

  const hayFiltros = search || categoriaId || marcaId || modeloId || ordering || precioMin || precioMax

  const seoDesc = search
    ? `Resultados para "${search}" en Avila Moto Repuestos`
    : 'Catálogo completo de repuestos y accesorios para motos. Filtros por categoría, marca y precio.'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEO title="Catálogo" description={seoDesc} />

      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-brand-text flex-1">Catálogo</h1>
        {totalCount > 0 && !loading && (
          <span className="text-sm text-brand-muted">{totalCount} producto{totalCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Badge moto activa */}
      {modeloId && motoLabel && (
        <div className="flex items-center gap-2 mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <span className="text-2xl">🏍️</span>
          <span className="text-brand-blue font-medium flex-1">
            Mostrando repuestos para: <span className="font-bold">{decodeURIComponent(motoLabel)}</span>
          </span>
          <button onClick={() => setSearchParams({})} className="text-brand-muted hover:text-brand-red transition-colors text-xs">
            Ver todo ✕
          </button>
        </div>
      )}

      {/* Fila 1: búsqueda con autocompletado + categoría */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1" ref={searchRef}>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre, marca, código..."
            value={inputVal}
            onChange={e => handleSearchInput(e.target.value)}
            onFocus={() => sugerencias.length > 0 && setShowSug(true)}
            className="input pl-9"
          />
          {/* Dropdown sugerencias */}
          {showSug && sugerencias.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-lg z-50 overflow-hidden">
              {sugerencias.map(p => {
                const nombre = p.nombre_completo.charAt(0).toUpperCase() + p.nombre_completo.slice(1).toLowerCase()
                return (
                  <Link
                    key={p.id}
                    to={`/producto/${p.id}`}
                    onClick={handleSugerenciaClick}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors border-b border-brand-border last:border-0"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-brand-border">
                      {p.imagen_url
                        ? <img src={p.imagen_url} alt={nombre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text truncate">{nombre}</p>
                      {p.marca && <p className="text-xs text-brand-muted uppercase">{p.marca}</p>}
                    </div>
                    <span className="text-sm font-bold text-brand-blue flex-shrink-0">
                      ${parseFloat(p.precio_web).toLocaleString('es-AR')}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <select
          value={categoriaId}
          onChange={e => setParam('categoria', e.target.value)}
          className="input sm:w-52"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Fila 2: marca + precio + ordenamiento + limpiar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap">
        <select value={marcaId} onChange={e => setParam('marca', e.target.value)} className="input sm:w-44">
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input
          type="number"
          placeholder="Precio mín"
          value={precioMin}
          onChange={e => setParam('precio_min', e.target.value)}
          className="input sm:w-32"
          min="0"
        />
        <input
          type="number"
          placeholder="Precio máx"
          value={precioMax}
          onChange={e => setParam('precio_max', e.target.value)}
          className="input sm:w-32"
          min="0"
        />
        <select value={ordering} onChange={e => setParam('ordering', e.target.value)} className="input sm:w-52">
          <option value="">Orden por defecto</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="-nombre">Nombre Z-A</option>
          <option value="precio_web">Precio: menor a mayor</option>
          <option value="-precio_web">Precio: mayor a menor</option>
        </select>
        {hayFiltros && (
          <button onClick={() => setSearchParams({})} className="text-sm text-brand-muted hover:text-brand-red transition-colors whitespace-nowrap self-center">
            Limpiar filtros ✕
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <span className="text-lg">⚠</span>
          <span>{error}</span>
          <button onClick={fetchProductos} className="ml-auto text-sm underline">Reintentar</button>
        </div>
      )}

      {/* Grilla */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : productosFiltrados.length === 0 && !error ? (
        <div className="text-center py-20 text-brand-muted">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No se encontraron productos</p>
          <p className="text-sm mt-1">Probá con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosFiltrados.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && (
        <Paginacion
          currentPage={page}
          totalPages={totalPages}
          onPageChange={n => setParam('page', String(n))}
        />
      )}
    </div>
  )
}
