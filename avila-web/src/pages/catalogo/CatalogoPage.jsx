import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { WA_NUMBER } from '../../config'
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

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

  useEffect(() => { setInputVal(search) }, [search])

  useEffect(() => {
    tiendaApi.getCategorias().then(r => setCategorias(r.data)).catch(() => {})
    tiendaApi.getMarcas().then(r => setMarcas(r.data)).catch(() => {})
  }, [])

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

  useEffect(() => { fetchProductos() }, [fetchProductos])

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

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
      setParam('search', val)
      tiendaApi.getProductos({ search: val, page_size: 5 })
        .then(r => setSugerencias(r.data.results))
        .catch(() => setSugerencias([]))
    }, 350)
  }

  function handleSugerenciaClick() {
    setShowSug(false)
    setSugerencias([])
  }

  useEffect(() => {
    function onClickOut(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSug(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

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
    <div>
      <SEO title="Catálogo de repuestos para motos" description={seoDesc} />

      {/* Header visual del catálogo — estética racing */}
      <div className="bg-carbon carbon-pattern speed-lines text-white py-10 px-4 mb-0 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-brand-blue to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/95 to-graphite pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1">
              <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-1">
                {modeloId && motoLabel ? '🏍️ Búsqueda por compatibilidad' : 'Todo el inventario'}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {modeloId && motoLabel
                  ? `Repuestos para ${decodeURIComponent(motoLabel)}`
                  : 'Catálogo de repuestos'
                }
              </h1>
            </div>
            {totalCount > 0 && !loading && (
              <div className="text-right flex-shrink-0">
                <span className="text-3xl font-black text-white">{totalCount}</span>
                <p className="text-xs text-gray-500">producto{totalCount !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {/* Badge moto activa */}
          {modeloId && motoLabel && (
            <div className="mt-5 flex items-center gap-3 bg-brand-blue/10 border border-brand-blue/30
                            rounded-2xl px-4 py-3 animate-slide-down">
              <div className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-blue/30
                              flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏍️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Mostrando repuestos para</p>
                <p className="text-white font-black text-sm truncate">{decodeURIComponent(motoLabel)}</p>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white
                           border border-white/15 hover:border-white/40 rounded-xl px-3 py-2
                           transition-all duration-200 flex-shrink-0 active:scale-95"
              >
                Cambiar ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Buscador + botón filtros mobile */}
      <div className="flex gap-3 mb-3">
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

        {/* Botón filtros (mobile) */}
        <button
          onClick={() => setFiltrosAbiertos(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors sm:hidden flex-shrink-0 ${
            filtrosAbiertos || hayFiltros
              ? 'border-brand-blue bg-red-50 text-brand-blue'
              : 'border-brand-border bg-white text-brand-muted'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtros
          {hayFiltros && <span className="w-2 h-2 rounded-full bg-brand-blue" />}
        </button>
      </div>

      {/* Filtros (desktop siempre visible, mobile toggle) */}
      <div className={`${filtrosAbiertos ? 'block' : 'hidden sm:block'} mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
          <select
            value={marcaId}
            onChange={e => setParam('marca', e.target.value)}
            className="input sm:w-44"
          >
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
          <select
            value={ordering}
            onChange={e => setParam('ordering', e.target.value)}
            className="input sm:w-52"
          >
            <option value="">Orden por defecto</option>
            <option value="nombre">Nombre A-Z</option>
            <option value="-nombre">Nombre Z-A</option>
            <option value="precio_web">Precio: menor a mayor</option>
            <option value="-precio_web">Precio: mayor a menor</option>
          </select>
          {hayFiltros && (
            <button
              onClick={() => { setSearchParams({}); setFiltrosAbiertos(false) }}
              className="text-sm text-brand-muted hover:text-brand-blue transition-colors whitespace-nowrap self-center"
            >
              Limpiar filtros ✕
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <span>⚠</span>
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
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-semibold text-brand-text mb-1">
            No encontramos productos con esos filtros
          </p>
          <p className="text-sm text-brand-muted mb-6">
            Probá limpiar los filtros o consultanos directamente por WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSearchParams({})}
              className="btn-secondary"
            >
              Limpiar filtros
            </button>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Busco un repuesto que no encuentro en la web. ¿Pueden ayudarme?')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consultar por WhatsApp
            </a>
          </div>
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
    </div>
  )
}
