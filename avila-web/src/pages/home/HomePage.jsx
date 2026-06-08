import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { WA_NUMBER } from '../../config'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'
import BuscadorPorMoto from '../../components/tienda/BuscadorPorMoto'

function getVistosRecientemente() {
  try {
    return JSON.parse(localStorage.getItem('avila_vistos') || '[]')
  } catch {
    return []
  }
}

export default function HomePage() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [destacados, setDestacados] = useState([])
  const [loadingDestacados, setLoadingDestacados] = useState(true)
  const [vistos, setVistos] = useState([])

  useEffect(() => {
    setVistos(getVistosRecientemente())
    tiendaApi.getCategorias().then(r => setCategorias(r.data)).catch(() => {})
    tiendaApi.getMarcas().then(r => setMarcas(r.data)).catch(() => {})
    tiendaApi.getProductos({ page: 1, page_size: 8 })
      .then(r => setDestacados(r.data.results))
      .catch(() => {})
      .finally(() => setLoadingDestacados(false))
  }, [])

  return (
    <div>
      <SEO />

      {/* Hero */}
      <section className="bg-brand-blue-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Repuestos y Accesorios para tu Moto
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Stock real · Retiro en local · Av. Pte. Castillo 1165
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/catalogo"
              className="bg-white text-brand-blue font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Ver catálogo completo
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Buscador por moto */}
      <BuscadorPorMoto />

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-brand-text mb-5">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categorias.slice(0, 12).map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/catalogo?categoria=${cat.id}`)}
                className="card p-3 text-center hover:border-brand-blue hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <svg className="w-5 h-5 text-brand-blue group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-brand-text leading-tight capitalize">{cat.nombre.toLowerCase()}</p>
              </button>
            ))}
          </div>
          {categorias.length > 12 && (
            <div className="mt-4 text-center">
              <Link to="/catalogo" className="text-sm text-brand-blue hover:underline">
                Ver todas las categorías →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Marcas — primeras 15 con productos */}
      {marcas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold text-brand-text mb-5">Marcas</h2>
          <div className="flex flex-wrap gap-2">
            {marcas.slice(0, 15).map(m => (
              <button
                key={m.id}
                onClick={() => navigate(`/catalogo?marca=${m.id}`)}
                className="px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-medium text-brand-muted hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-all"
              >
                {m.nombre}
              </button>
            ))}
            {marcas.length > 15 && (
              <button
                onClick={() => navigate('/catalogo')}
                className="px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-medium text-brand-blue hover:bg-blue-50 transition-all"
              >
                Ver más →
              </button>
            )}
          </div>
        </section>
      )}

      {/* Productos destacados */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-brand-text">Productos</h2>
          <Link to="/catalogo" className="text-sm text-brand-blue hover:underline">
            Ver todos →
          </Link>
        </div>

        {loadingDestacados ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : destacados.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {destacados.map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        ) : (
          <p className="text-brand-muted text-center py-8">No hay productos disponibles.</p>
        )}
      </section>

      {/* Visto recientemente */}
      {vistos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-brand-text">Visto recientemente</h2>
            <button
              onClick={() => { localStorage.removeItem('avila_vistos'); setVistos([]) }}
              className="text-xs text-brand-muted hover:text-brand-red transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {vistos.slice(0, 4).map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      {/* Banner WhatsApp */}
      <section className="bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">¿No encontrás lo que buscás?</p>
            <p className="text-green-100 text-sm">Consultanos por WhatsApp y te asesoramos.</p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-brand-green font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            Escribinos →
          </a>
        </div>
      </section>
    </div>
  )
}
