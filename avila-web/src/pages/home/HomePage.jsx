import { useState, useEffect } from 'react'
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
import WhatsAppCTA from '../../components/ui/WhatsAppCTA'

// ── Marcas de motos ─────────────────────────────────────────────────────────
// Cargar logos en: public/assets/brands/motos/{nombre}.png
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

// ── Marcas de repuestos ─────────────────────────────────────────────────────
// Cargar logos en: public/assets/brands/repuestos/{nombre}.png
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

// ── Trust items ─────────────────────────────────────────────────────────────
const TRUST = [
  { icon: '🏪', label: 'Retiro en local',          sub: SITIO.direccion },
  { icon: '🚚', label: 'Envíos a todo el país',    sub: 'Coordinamos la entrega' },
  { icon: '💳', label: 'Pago seguro',              sub: 'Mercado Pago y transferencia' },
  { icon: '💬', label: 'Atención por WhatsApp',    sub: 'Respondemos rápido' },
  { icon: '✅', label: 'Stock actualizado',         sub: 'Desde nuestro sistema' },
  { icon: '🔧', label: 'Todas las marcas',          sub: 'Honda, Yamaha, Zanella…' },
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
        title="Tu moto, tus repuestos — Avila Moto Repuestos"
        description="Buscá repuestos por modelo, consultá stock y comprá online con retiro en local o envío a todo el país."
      />

      {/* ══════════════════════════════════════════════════════════════
          HERO RACING
          Imagen: public/assets/ai/banners/hero-main.webp (opcional)
          Sin imagen → fondo carbon/graphite con efecto visual
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[85vh] md:min-h-[75vh] flex items-center overflow-hidden bg-carbon"
        style={{
          backgroundImage: 'url(/assets/ai/banners/hero-main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Overlay oscuro con degradado rojo sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/98 via-carbon/85 to-carbon/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-transparent to-transparent" />

        {/* Patrón de velocidad */}
        <div className="absolute inset-0 speed-lines pointer-events-none" />

        {/* Halo rojo */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[500px] rounded-full
                        bg-gradient-radial from-brand-blue/10 to-transparent
                        pointer-events-none blur-3xl" />

        {/* Líneas decorativas diagonales */}
        <div className="absolute right-0 top-0 bottom-0 w-32 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute inset-0 border-l border-brand-blue/10 -skew-x-6" />
          <div className="absolute inset-0 border-l border-brand-blue/5 translate-x-8 -skew-x-6" />
        </div>

        {/* Acento rojo vertical */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-brand-blue to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 mb-6
                            bg-brand-blue/15 border border-brand-blue/30
                            text-brand-blue text-xs font-black
                            px-4 py-2 rounded-full uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              {SITIO.localidad}, {SITIO.provincia}
            </div>

            {/* Título */}
            <h1 className="animate-fade-in-up text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-5"
                style={{ animationDelay: '100ms' }}>
              Tu moto,<br />
              tus repuestos,<br />
              <span className="text-gradient-red">en un solo lugar.</span>
            </h1>

            {/* Subtítulo */}
            <p className="animate-fade-in-up text-gray-300 text-base md:text-xl mb-8 leading-relaxed max-w-xl"
               style={{ animationDelay: '200ms' }}>
              Buscá por modelo, encontrá productos compatibles y comprá online
              con retiro en local o envío a todo el país.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3 mb-10"
                 style={{ animationDelay: '300ms' }}>
              <a
                href="#buscador-moto"
                onClick={e => {
                  e.preventDefault()
                  document.getElementById('buscador-moto')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center gap-2
                           bg-brand-blue hover:bg-brand-blue-dark
                           text-white font-black px-8 py-4 rounded-xl text-base
                           transition-all duration-200 hover:-translate-y-0.5
                           hover:shadow-red-glow active:scale-95"
              >
                🏍️ Buscar por moto
              </a>
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center
                           btn-ghost font-black px-8 py-4 text-base"
              >
                Ver catálogo
              </Link>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Quiero consultar repuestos para mi moto.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2
                           border-2 border-avila-green text-avila-green
                           hover:bg-avila-green hover:text-white
                           font-bold px-6 py-4 rounded-xl text-sm
                           transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                {WA_SVG} WhatsApp
              </a>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up flex gap-8 pt-6 border-t border-white/10"
                 style={{ animationDelay: '400ms' }}>
              {[
                { valor: '+5.000', label: 'Productos' },
                { valor: '12',     label: 'Marcas de motos' },
                { valor: '100%',   label: 'Stock real' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white leading-none">{s.valor}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chevron scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST SIGNALS — banda horizontal
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-graphite border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            {TRUST.map(item => (
              <div key={item.label} className="flex items-center gap-2.5 py-3 px-2">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-tight truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 leading-tight truncate">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BUSCADOR POR MOTO
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
          MARCAS DE REPUESTOS — marquee (velocidad diferente)
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
          MARCAS DEL CATÁLOGO (dinámicas de la API)
      ══════════════════════════════════════════════════════════════ */}
      {marcas.length > 0 && (
        <section className="bg-brand-bg py-10 px-4">
          <AnimatedSection>
            <div className="max-w-6xl mx-auto">
              <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-2">Disponibles en stock</p>
              <h2 className="text-xl font-black text-brand-text mb-5">Marcas en catálogo</h2>
              <div className="flex flex-wrap gap-2">
                {marcas.slice(0, 20).map(m => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/catalogo?marca=${m.id}`)}
                    className="px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-semibold
                               text-brand-muted hover:border-brand-blue hover:text-brand-blue hover:bg-red-50
                               hover:shadow-sm transition-all duration-200 active:scale-95"
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
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-1">Disponibles ahora</p>
                <h2 className="text-2xl md:text-3xl font-black text-brand-text">Productos en stock</h2>
              </div>
              <Link
                to="/catalogo"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-blue
                           border border-brand-blue rounded-xl px-5 py-2.5
                           hover:bg-brand-blue hover:text-white transition-all duration-200"
              >
                Ver todos →
              </Link>
            </div>
          </AnimatedSection>

          {loadingDestacados ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : destacados.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {destacados.map((p, i) => (
                  <AnimatedSection key={p.id} delay={i * 55} direction="up">
                    <ProductCard producto={p} />
                  </AnimatedSection>
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link to="/catalogo" className="btn-primary px-8 py-3 text-base inline-flex">
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
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BANNER WHATSAPP
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-carbon overflow-hidden speed-lines">
        <div className="absolute inset-0 bg-gradient-to-r from-carbon to-graphite" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[200px] bg-red-glow pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center">
          <AnimatedSection>
            <p className="text-xs font-black text-avila-green uppercase tracking-[0.2em] mb-3">
              Asesoramiento sin costo
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
              ¿No sabés qué repuesto<br />lleva tu moto?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              Mandanos marca, modelo y año por WhatsApp y te ayudamos
              a encontrar exactamente lo que necesitás.
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Quiero consultar repuestos.\nMarca:\nModelo:\nAño:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-avila-green hover:bg-green-600
                         text-white font-black px-10 py-4 rounded-xl text-base
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
