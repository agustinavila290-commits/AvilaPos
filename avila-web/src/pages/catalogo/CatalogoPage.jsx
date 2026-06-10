import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { WA_NUMBER } from '../../config'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'
import Paginacion from '../../components/tienda/Paginacion'

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  )
}

function SidebarFilters({ categorias, marcas, categoriaId, marcaId, precioMin, precioMax, modeloId, motoLabel, hayFiltros, setParam, setSearchParams }) {
  return (
    <div className="space-y-5">

      {/* Para tu moto activa */}
      {modeloId && motoLabel && (
        <div>
          <p className="filter-label">Para tu moto</p>
          <div className="bg-red-50 border border-brand-blue/20 rounded-lg p-3">
            <p className="text-xs font-bold text-brand-blue leading-tight">{decodeURIComponent(motoLabel)}</p>
            <button
              onClick={() => setSearchParams({})}
              className="text-[10px] text-brand-muted hover:text-brand-blue mt-1.5 transition-colors"
            >
              Cambiar moto ✕
            </button>
          </div>
        </div>
      )}

      {/* Categoría */}
      <div>
        <p className="filter-label">Categoría</p>
        <div className="space-y-0.5">
          <button
            onClick={() => setParam('categoria', '')}
            className={`filter-btn ${!categoriaId ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            Todas las categorías
          </button>
          {categorias.map(c => (
            <button
              key={c.id}
              onClick={() => setParam('categoria', String(c.id))}
              className={`filter-btn ${categoriaId === String(c.id) ? 'filter-btn-active' : 'filter-btn-inactive'}`}
            >
              {c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Marca */}
      <div>
        <p className="filter-label">Marca</p>
        <select
          value={marcaId}
          onChange={e => setParam('marca', e.target.value)}
          className="input text-sm"
        >
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>

      {/* Precio */}
      <div>
        <p className="filter-label">Precio</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={precioMin}
            onChange={e => setParam('precio_min', e.target.value)}
            className="input text-sm"
            min="0"
          />
          <input
            type="number"
            placeholder="Máx"
            value={precioMax}
            onChange={e => setParam('precio_max', e.target.value)}
            className="input text-sm"
            min="0"
          />
        </div>
      </div>

      {/* Limpiar */}
      {hayFiltros && (
        <button
          onClick={() => setSearchParams({})}
          className="w-full text-sm text-brand-muted hover:text-brand-blue border border-brand-border
                     rounded-lg py-2 transition-colors hover:border-brand-blue/40 hover:bg-red-50"
        >
          Limpiar filtros ✕
        </button>
      )}
    </div>
  )
}

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const hayFiltros = !!(search || categoriaId || marcaId || modeloId || ordering || precioMin || precioMax)

  const seoDesc = search
    ? `Resultados para "${search}" en Avila Moto Repuestos`
    : 'Catálogo completo de repuestos y accesorios para motos. Filtros por categoría, marca y precio.'

  const activeFilterCount = [search, categoriaId, marcaId, modeloId, precioMin, precioMax].filter(Boolean).length

  return (
    <div className="bg-brand-bg min-h-screen">
      <SEO title="Catálogo de repuestos para motos" description={seoDesc} />

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-black text-brand-text leading-tight">
                {modeloId && motoLabel
                  ? `Repuestos para ${decodeURIComponent(motoLabel)}`
                  : 'Catálogo de repuestos'
                }
              </h1>
              {!loading && totalCount > 0 && (
                <p className="text-xs text-brand-muted mt-0.5">
                  {totalCount} producto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {modeloId && motoLabel && (
              <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-brand-blue
                               bg-red-50 border border-brand-blue/20 px-3 py-1.5 rounded-full">
                🏍️ {decodeURIComponent(motoLabel)}
                <button onClick={() => setSearchParams({})} className="hover:text-brand-blue-dark">✕</button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-5">

          {/* ─── SIDEBAR — solo desktop ─── */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-white border border-brand-border rounded-xl p-4 sticky top-[calc(3.5rem+2.25rem+1px)]">
              <SidebarFilters
                categorias={categorias}
                marcas={marcas}
                categoriaId={categoriaId}
                marcaId={marcaId}
                precioMin={precioMin}
                precioMax={precioMax}
                modeloId={modeloId}
                motoLabel={motoLabel}
                hayFiltros={hayFiltros}
                setParam={setParam}
                setSearchParams={setSearchParams}
              />
            </div>
          </aside>

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 min-w-0">

            {/* Barra superior — 2 filas en mobile, 1 en desktop */}
            <div className="flex flex-col gap-2 mb-4">

              {/* FILA 1: Buscador (full width) */}
              <div className="relative w-full" ref={searchRef}>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Buscar en el catálogo..."
                  value={inputVal}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => sugerencias.length > 0 && setShowSug(true)}
                  className="input pl-9"
                />
                {/* Dropdown sugerencias */}
                {showSug && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-card-hover z-50 overflow-hidden">
                    {sugerencias.map(p => {
                      const nombre = p.nombre_completo.charAt(0).toUpperCase() + p.nombre_completo.slice(1).toLowerCase()
                      return (
                        <Link
                          key={p.id}
                          to={`/producto/${p.id}`}
                          onClick={handleSugerenciaClick}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors border-b border-brand-border last:border-0"
                        >
                          <div className="w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-brand-border">
                            {p.imagen_url
                              ? <img src={p.imagen_url} alt={nombre} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-text truncate">{nombre}</p>
                            {p.marca && <p className="text-xs text-brand-muted uppercase font-bold">{p.marca}</p>}
                          </div>
                          <span className="text-sm font-black text-brand-blue flex-shrink-0">
                            ${parseFloat(p.precio_web).toLocaleString('es-AR')}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* FILA 2: Filtros mobile + contador + orden */}
              <div className="flex items-center gap-2">

                {/* Botón filtros — solo mobile */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold
                              transition-colors flex-shrink-0 ${
                    activeFilterCount > 0
                      ? 'border-brand-blue bg-red-50 text-brand-blue'
                      : 'border-brand-border bg-white text-brand-muted'
                  }`}
                >
                  <FilterIcon />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-brand-blue text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Contador */}
                {!loading && totalCount > 0 && (
                  <span className="text-xs text-brand-muted whitespace-nowrap flex-1">
                    <span className="font-bold text-brand-text">{totalCount}</span> producto{totalCount !== 1 ? 's' : ''}
                  </span>
                )}

                {/* Ordenamiento */}
                <select
                  value={ordering}
                  onChange={e => setParam('ordering', e.target.value)}
                  className="border border-brand-border rounded-lg px-2.5 py-2 text-xs bg-white
                             text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-blue
                             transition-colors cursor-pointer ml-auto flex-shrink-0"
                >
                  <option value="">Relevancia</option>
                  <option value="nombre">Nombre A-Z</option>
                  <option value="-nombre">Nombre Z-A</option>
                  <option value="precio_web">Precio ↑</option>
                  <option value="-precio_web">Precio ↓</option>
                </select>
              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                <span>⚠</span>
                <span className="text-sm">{error}</span>
                <button onClick={fetchProductos} className="ml-auto text-sm underline font-medium">Reintentar</button>
              </div>
            )}

            {/* Grilla */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : productosFiltrados.length === 0 && !error ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-base font-bold text-brand-text mb-1">
                  No encontramos productos con esos filtros
                </p>
                <p className="text-sm text-brand-muted mb-6">
                  Probá limpiar los filtros o consultanos directamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => setSearchParams({})} className="btn-secondary">
                    Limpiar filtros
                  </button>
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Busco un repuesto que no encuentro en la web. ¿Pueden ayudarme?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
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
      </div>

      {/* ─── DRAWER MOBILE ─── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl lg:hidden
                          flex flex-col animate-drawer-in">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-border">
              <h3 className="font-black text-brand-text">Filtrar productos</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 hover:bg-brand-bg rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SidebarFilters
                categorias={categorias}
                marcas={marcas}
                categoriaId={categoriaId}
                marcaId={marcaId}
                precioMin={precioMin}
                precioMax={precioMax}
                modeloId={modeloId}
                motoLabel={motoLabel}
                hayFiltros={hayFiltros}
                setParam={setParam}
                setSearchParams={setSearchParams}
              />
            </div>
            <div className="p-4 border-t border-brand-border">
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-primary w-full py-3"
              >
                Ver {loading ? '...' : totalCount} productos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
