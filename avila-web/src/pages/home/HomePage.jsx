import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { WA_NUMBER, SITIO } from '../../config'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'
import BuscadorPorMoto from '../../components/tienda/BuscadorPorMoto'
import BrandMarquee from '../../components/ui/BrandMarquee'
import CategoryShowcase from '../../components/ui/CategoryShowcase'
import AnimatedSection from '../../components/ui/AnimatedSection'

const MARCAS_MOTOS = [
  { nombre: 'Honda',    logo: '/assets/brands/motos/honda.png' },
  { nombre: 'Yamaha',   logo: '/assets/brands/motos/yamaha.png' },
  { nombre: 'Motomel',  logo: '/assets/brands/motos/motomel.png' },
  { nombre: 'Corven',   logo: '/assets/brands/motos/corven.png' },
  { nombre: 'Zanella',  logo: '/assets/brands/motos/zanella.png' },
  { nombre: 'Gilera',   logo: '/assets/brands/motos/gilera.png' },
  { nombre: 'Bajaj',    logo: '/assets/brands/motos/bajaj.png' },
  { nombre: 'Benelli',  logo: '/assets/brands/motos/benelli.png' },
  { nombre: 'Guerrero', logo: '/assets/brands/motos/guerrero.png' },
  { nombre: 'Keller',   logo: '/assets/brands/motos/keller.png' },
  { nombre: 'Mondial',  logo: '/assets/brands/motos/mondial.png' },
  { nombre: 'Suzuki',   logo: '/assets/brands/motos/suzuki.png' },
]

const MARCAS_REPUESTOS = [
  { nombre: 'NGK',      logo: '/assets/brands/repuestos/ngk.png' },
  { nombre: 'Bosch',    logo: '/assets/brands/repuestos/bosch.png' },
  { nombre: 'Castrol',  logo: '/assets/brands/repuestos/castrol.png' },
  { nombre: 'Motul',    logo: '/assets/brands/repuestos/motul.png' },
  { nombre: 'Pirelli',  logo: '/assets/brands/repuestos/pirelli.png' },
  { nombre: 'Michelin', logo: '/assets/brands/repuestos/michelin.png' },
  { nombre: 'Yuasa',    logo: '/assets/brands/repuestos/yuasa.png' },
  { nombre: 'Metzeler', logo: '/assets/brands/repuestos/metzeler.png' },
  { nombre: 'DID',      logo: '/assets/brands/repuestos/did.png' },
  { nombre: 'Vini',     logo: '/assets/brands/repuestos/vini.png' },
  { nombre: 'Elf',      logo: '/assets/brands/repuestos/elf.png' },
  { nombre: 'Ipone',    logo: '/assets/brands/repuestos/ipone.png' },
]

const TRUST = [
  { icon: '🏪', label: 'Retiro en local',        sub: SITIO.direccion },
  { icon: '🚚', label: 'Envíos a todo el país',  sub: 'Coordinamos la entrega' },
  { icon: '💳', label: 'Pago seguro',            sub: 'Mercado Pago y transferencia' },
  { icon: '💬', label: 'Atención WhatsApp',      sub: 'Respondemos rápido' },
  { icon: '✅', label: 'Stock actualizado',       sub: 'Desde nuestro sistema' },
  { icon: '🔧', label: 'Todas las marcas',        sub: 'Honda, Yamaha, Zanella…' },
]

const WA_SVG = (
  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

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
  const [heroSearch, setHeroSearch] = useState('')
  const heroInputRef = useRef(null)

  useEffect(() => {
    setVistos(getVistosRecientemente())
    tiendaApi.getCategorias().then(r => setCategorias(r.data)).catch(() => {})
    tiendaApi.getMarcas().then(r => setMarcas(r.data)).catch(() => {})
    tiendaApi.getProductos({ page: 1, page_size: 8 })
      .then(r => setDestacados(r.data.results))
      .catch(() => {})
      .finally(() => setLoadingDestacados(false))
  }, [])

  function handleHeroSearch(e) {
    e.preventDefault()
    if (heroSearch.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(heroSearch.trim())}`)
    } else {
      navigate('/catalogo')
    }
  }

  const topCategorias = categorias.slice(0, 8)

  return (
    <div>
      <SEO
        title="Repuestos para tu moto — Avila Moto Repuestos"
        description="Buscá repuestos por modelo, consultá stock y comprá online con retiro en local o envío a todo el país."
      />

      {/* ══════════════════════════════════════════════════════════════
          HERO COMERCIAL
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-brand-text text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 text-center">

          {/* Badge ubicación */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20
                          text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            {SITIO.localidad}, {SITIO.provincia}
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
            Repuestos para tu moto<br />
            <span className="text-brand-blue">en un solo lugar</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-lg mx-auto">
            Comprá online con retiro en local o envío a todo el país.
            Stock real actualizado desde nuestro sistema.
          </p>

          {/* BUSCADOR HERO */}
          <form
            onSubmit={handleHeroSearch}
            className="relative max-w-2xl mx-auto mb-6"
          >
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              ref={heroInputRef}
              type="search"
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              placeholder="¿Qué repuesto buscás?"
              className="w-full bg-white text-brand-text rounded-xl pl-12 pr-[7rem] py-4 text-base
                         shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/40
                         placeholder:text-brand-muted"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2
                         bg-brand-blue hover:bg-brand-blue-dark text-white font-black
                         px-5 py-2.5 rounded-lg text-sm transition-colors active:scale-95"
            >
              Buscar
            </button>
          </form>

          {/* Chips de categorías rápidas */}
          {topCategorias.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {topCategorias.map(c => (
                <Link
                  key={c.id}
                  to={`/catalogo?categoria=${c.id}`}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white/80
                             text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  {c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1).toLowerCase()}
                </Link>
              ))}
              <Link
                to="/catalogo"
                className="bg-brand-blue/20 hover:bg-brand-blue/30 border border-brand-blue/40 text-brand-blue
                           text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
              >
                Ver todo →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST SIGNALS — scroll horizontal en mobile, grid en desktop
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-brand-border">
        {/* Mobile: scroll horizontal */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <div className="flex items-stretch px-4 py-1" style={{ width: 'max-content' }}>
            {TRUST.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 py-3 px-3 flex-shrink-0 ${
                  i < TRUST.length - 1 ? 'border-r border-brand-border' : ''
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-brand-text leading-tight whitespace-nowrap">{item.label}</p>
                  <p className="text-[10px] text-brand-muted leading-tight whitespace-nowrap">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop: grid */}
        <div className="hidden sm:block max-w-6xl mx-auto px-4 py-2">
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-px">
            {TRUST.map(item => (
              <div key={item.label} className="flex items-center gap-2.5 py-3 px-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand-text leading-tight truncate">{item.label}</p>
                  <p className="text-[10px] text-brand-muted leading-tight truncate">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BUSCADOR POR MOTO (sección oscura — keep)
      ══════════════════════════════════════════════════════════════ */}
      <BuscadorPorMoto />

      {/* ══════════════════════════════════════════════════════════════
          MARCAS DE MOTOS — marquee
      ══════════════════════════════════════════════════════════════ */}
      <BrandMarquee
        title="Repuestos para las motos más usadas en Argentina"
        subtitle="Buscá por tu modelo y encontrá las piezas compatibles al instante"
        brands={MARCAS_MOTOS}
        dark={true}
        speed="normal"
        variant="motos"
      />

      {/* ══════════════════════════════════════════════════════════════
          CATEGORÍAS VISUALES
      ══════════════════════════════════════════════════════════════ */}
      <CategoryShowcase categorias={categorias} />

      {/* ══════════════════════════════════════════════════════════════
          MARCAS DE REPUESTOS — marquee
      ══════════════════════════════════════════════════════════════ */}
      <BrandMarquee
        title="Trabajamos con marcas reconocidas"
        subtitle="Repuestos, aceites, cubiertas y accesorios de primera calidad"
        brands={MARCAS_REPUESTOS}
        dark={true}
        speed="slow"
        variant="repuestos"
      />

      {/* ══════════════════════════════════════════════════════════════
          MARCAS DEL CATÁLOGO (dinámicas)
      ══════════════════════════════════════════════════════════════ */}
      {marcas.length > 0 && (
        <section className="bg-brand-bg py-10 px-4">
          <AnimatedSection>
            <div className="max-w-6xl mx-auto">
              <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-1">Disponibles en stock</p>
              <h2 className="text-xl font-black text-brand-text mb-5">Marcas en catálogo</h2>
              <div className="flex flex-wrap gap-2">
                {marcas.slice(0, 20).map(m => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/catalogo?marca=${m.id}`)}
                    className="px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-semibold
                               text-brand-muted hover:border-brand-blue hover:text-brand-blue hover:bg-red-50
                               hover:shadow-card transition-all duration-200 active:scale-95"
                  >
                    {m.nombre}
                  </button>
                ))}
                {marcas.length > 20 && (
                  <button
                    onClick={() => navigate('/catalogo')}
                    className="px-4 py-2 rounded-full border border-brand-blue bg-red-50 text-sm font-bold
                               text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
                  >
                    +{marcas.length - 20} más →
                  </button>
                )}
              </div>
            </div>
          </AnimatedSection>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PRODUCTOS DESTACADOS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-1">Disponibles ahora</p>
                <h2 className="text-2xl font-black text-brand-text">Productos en stock</h2>
              </div>
              <Link
                to="/catalogo"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-blue
                           border border-brand-blue/30 rounded-xl px-4 py-2
                           hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-200"
              >
                Ver todos →
              </Link>
            </div>
          </AnimatedSection>

          {loadingDestacados ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : destacados.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {destacados.map((p, i) => (
                  <AnimatedSection key={p.id} delay={i * 50} direction="up">
                    <ProductCard producto={p} />
                  </AnimatedSection>
                ))}
              </div>
              <div className="mt-6 text-center sm:hidden">
                <Link to="/catalogo" className="btn-primary px-8 py-3 text-sm inline-flex">
                  Ver todo el catálogo →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-brand-muted text-center py-8">No hay productos disponibles.</p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          VISTO RECIENTEMENTE
      ══════════════════════════════════════════════════════════════ */}
      {vistos.length > 0 && (
        <section className="py-10 px-4 bg-brand-bg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-text">Visto recientemente</h2>
              <button
                onClick={() => { localStorage.removeItem('avila_vistos'); setVistos([]) }}
                className="text-xs text-brand-muted hover:text-brand-blue transition-colors"
              >
                Limpiar
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {vistos.slice(0, 4).map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BANNER WHATSAPP
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-carbon overflow-hidden speed-lines">
        <div className="absolute inset-0 bg-gradient-to-r from-carbon to-graphite" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[200px] bg-red-glow pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 text-center">
          <AnimatedSection>
            <p className="text-xs font-black text-avila-green uppercase tracking-[0.2em] mb-3">
              Asesoramiento sin costo
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
              ¿No encontrás el repuesto<br />que buscás?
            </h2>
            <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
              Mandanos marca, modelo y año por WhatsApp y te ayudamos
              a encontrar exactamente lo que necesitás.
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Quiero consultar repuestos.\nMarca:\nModelo:\nAño:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-avila-green hover:bg-green-600
                         text-white font-black px-8 py-4 rounded-xl text-base
                         transition-all duration-200 hover:-translate-y-1
                         hover:shadow-xl hover:shadow-green-900/50 active:scale-95"
            >
              {WA_SVG} Consultar por WhatsApp
            </a>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
