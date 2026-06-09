import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { WA_NUMBER, SITIO } from '../../config'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'
import BuscadorPorMoto from '../../components/tienda/BuscadorPorMoto'

const TRUST_ITEMS = [
  { icon: '🏪', titulo: 'Retiro en local', desc: SITIO.direccion },
  { icon: '🚚', titulo: 'Envíos a todo el país', desc: 'Coordinamos la entrega' },
  { icon: '💳', titulo: 'Pago seguro', desc: 'Mercado Pago y transferencia' },
  { icon: '💬', titulo: 'Atención por WhatsApp', desc: 'Respondemos rápido' },
  { icon: '✅', titulo: 'Stock actualizado', desc: 'Desde nuestro sistema' },
]

function getVistosRecientemente() {
  try { return JSON.parse(localStorage.getItem('avila_vistos') || '[]') } catch { return [] }
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
      <SEO
        title="Repuestos y accesorios para tu moto en Catamarca"
        description="Comprá repuestos y accesorios para motos. Buscá por modelo, consultá stock y pagá online."
      />

      {/* HERO */}
      <section className="bg-brand-dark text-white py-16 md:py-24 px-4 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-blue/20 border border-brand-blue/30 text-brand-blue text-xs font-semibold px-3 py-1 rounded-full mb-4">
            🏍️ {SITIO.localidad}, {SITIO.provincia}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Repuestos y accesorios<br />
            <span className="text-brand-blue">para tu moto</span> en Catamarca
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Buscá por modelo de moto, encontrá productos compatibles y comprá online
            con retiro en local o envío a todo el país.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#buscador-moto"
              onClick={e => {
                e.preventDefault()
                document.getElementById('buscador-moto')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              🏍️ Buscar por moto
            </a>
            <Link
              to="/catalogo"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              Ver catálogo completo
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-brand-green text-brand-green font-semibold px-8 py-3 rounded-xl hover:bg-green-950/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TRUST_ITEMS.map(item => (
              <div key={item.titulo} className="flex items-center gap-2 py-1">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-text leading-tight">{item.titulo}</p>
                  <p className="text-xs text-brand-muted leading-tight truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSCADOR POR MOTO */}
      <div id="buscador-moto">
        <BuscadorPorMoto />
      </div>

      {/* CATEGORÍAS */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-brand-text">Categorías</h2>
            {categorias.length > 12 && (
              <Link to="/catalogo" className="text-sm text-brand-blue hover:underline">
                Ver todas →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categorias.slice(0, 12).map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/catalogo?categoria=${cat.id}`)}
                className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-brand-border hover:border-brand-blue hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-brand-blue transition-colors">
                  <svg className="w-5 h-5 text-brand-blue group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-brand-text leading-tight text-center capitalize">
                  {cat.nombre.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* MARCAS */}
      {marcas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Marcas disponibles</h2>
          <div className="flex flex-wrap gap-2">
            {marcas.slice(0, 15).map(m => (
              <button
                key={m.id}
                onClick={() => navigate(`/catalogo?marca=${m.id}`)}
                className="px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-medium text-brand-muted hover:border-brand-blue hover:text-brand-blue hover:bg-red-50 transition-all"
              >
                {m.nombre}
              </button>
            ))}
            {marcas.length > 15 && (
              <button
                onClick={() => navigate('/catalogo')}
                className="px-4 py-2 rounded-full border border-brand-blue bg-red-50 text-sm font-medium text-brand-blue hover:bg-red-100 transition-all"
              >
                Ver más →
              </button>
            )}
          </div>
        </section>
      )}

      {/* PRODUCTOS DESTACADOS */}
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

      {/* VISTO RECIENTEMENTE */}
      {vistos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-brand-text">Visto recientemente</h2>
            <button
              onClick={() => { localStorage.removeItem('avila_vistos'); setVistos([]) }}
              className="text-xs text-brand-muted hover:text-brand-blue transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {vistos.slice(0, 4).map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      {/* BANNER WHATSAPP */}
      <section className="bg-brand-dark border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-2xl font-bold text-white mb-2">
            ¿No sabés qué repuesto lleva tu moto?
          </p>
          <p className="text-gray-400 mb-6">
            Escribinos por WhatsApp y te ayudamos a encontrar lo que necesitás.
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Quiero hacer una consulta sobre repuestos para mi moto.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-brand-green hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
