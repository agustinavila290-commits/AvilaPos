import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from './AnimatedSection'

/**
 * Categorías de la tienda con imagen o gradiente de fallback.
 * Colocar imágenes en: public/assets/ai/categories/{key}.webp
 *
 * Props:
 *   categorias — array del API [{ id, nombre }]
 */

// Mapeo de categorías conocidas a imágenes y gradientes
// Agregar imágenes en: public/assets/ai/categories/
const CAT_CONFIG = {
  aceite:      { icon: '🛢️', grad: 'from-yellow-700 to-orange-800',  img: '/assets/ai/categories/aceites.webp',     label: 'Aceites y lubricantes' },
  aceites:     { icon: '🛢️', grad: 'from-yellow-700 to-orange-800',  img: '/assets/ai/categories/aceites.webp',     label: 'Aceites y lubricantes' },
  cubierta:    { icon: '⭕',  grad: 'from-slate-700 to-slate-900',    img: '/assets/ai/categories/cubiertas.webp',   label: 'Cubiertas' },
  cubiertas:   { icon: '⭕',  grad: 'from-slate-700 to-slate-900',    img: '/assets/ai/categories/cubiertas.webp',   label: 'Cubiertas' },
  casco:       { icon: '🪖',  grad: 'from-gray-700 to-gray-900',      img: '/assets/ai/categories/cascos.webp',      label: 'Cascos' },
  cascos:      { icon: '🪖',  grad: 'from-gray-700 to-gray-900',      img: '/assets/ai/categories/cascos.webp',      label: 'Cascos' },
  transmision: { icon: '⚙️',  grad: 'from-blue-800 to-blue-950',      img: '/assets/ai/categories/transmision.webp', label: 'Transmisión' },
  freno:       { icon: '🔴',  grad: 'from-red-800 to-red-950',        img: '/assets/ai/categories/frenos.webp',      label: 'Frenos' },
  frenos:      { icon: '🔴',  grad: 'from-red-800 to-red-950',        img: '/assets/ai/categories/frenos.webp',      label: 'Frenos' },
  bateria:     { icon: '🔋',  grad: 'from-green-800 to-green-950',    img: '/assets/ai/categories/baterias.webp',    label: 'Baterías' },
  baterias:    { icon: '🔋',  grad: 'from-green-800 to-green-950',    img: '/assets/ai/categories/baterias.webp',    label: 'Baterías' },
  filtro:      { icon: '🔩',  grad: 'from-indigo-800 to-indigo-950',  img: '/assets/ai/categories/filtros.webp',     label: 'Filtros' },
  filtros:     { icon: '🔩',  grad: 'from-indigo-800 to-indigo-950',  img: '/assets/ai/categories/filtros.webp',     label: 'Filtros' },
  accesorio:   { icon: '✨',  grad: 'from-purple-800 to-purple-950',  img: '/assets/ai/categories/accesorios.webp',  label: 'Accesorios' },
  accesorios:  { icon: '✨',  grad: 'from-purple-800 to-purple-950',  img: '/assets/ai/categories/accesorios.webp',  label: 'Accesorios' },
  iluminacion: { icon: '💡',  grad: 'from-amber-700 to-amber-900',    img: '/assets/ai/categories/iluminacion.webp', label: 'Iluminación' },
  herramienta: { icon: '🔧',  grad: 'from-zinc-700 to-zinc-900',      img: '/assets/ai/categories/herramientas.webp',label: 'Herramientas' },
  camara:      { icon: '💨',  grad: 'from-teal-700 to-teal-900',      img: '/assets/ai/categories/camaras.webp',     label: 'Cámaras' },
  motor:       { icon: '⚡',  grad: 'from-cyan-800 to-cyan-950',      img: '/assets/ai/categories/motor.webp',       label: 'Motor' },
  carroceria:  { icon: '🏍️', grad: 'from-stone-700 to-stone-900',    img: '/assets/ai/categories/carroceria.webp',  label: 'Carrocería' },
  general:     { icon: '📦',  grad: 'from-zinc-600 to-zinc-800',      img: null, label: 'General' },
}

function getCatConfig(nombre) {
  const key = nombre.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')
  return CAT_CONFIG[key] || {
    icon: '📦',
    grad: 'from-zinc-700 to-zinc-900',
    img: null,
    label: nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(),
  }
}

function CatCard({ cat, onNavigate }) {
  const [imgError, setImgError] = useState(false)
  const cfg = getCatConfig(cat.nombre)
  const label = cfg.label !== 'General' ? cfg.label : (cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1).toLowerCase())

  return (
    <button
      onClick={() => onNavigate(`/catalogo?categoria=${cat.id}`)}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
    >
      {/* Fondo: imagen o gradiente */}
      {cfg.img && !imgError ? (
        <img
          src={cfg.img}
          alt={label}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.grad} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
          <span className="text-5xl opacity-40 select-none">{cfg.icon}</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent
                      group-hover:from-black/90 transition-all duration-300" />

      {/* Borde rojo en hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-blue/70
                      rounded-2xl transition-all duration-300" />

      {/* Contenido */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">{cfg.icon}</span>
          <p className="text-sm font-bold leading-tight drop-shadow">{label}</p>
        </div>
        <span className="text-xs text-white/60 font-medium group-hover:text-brand-blue transition-colors duration-200">
          Ver productos →
        </span>
      </div>
    </button>
  )
}

export default function CategoryShowcase({ categorias = [] }) {
  const navigate = useNavigate()

  if (!categorias.length) return null

  // Priorizar categorías conocidas + mostrar hasta 10
  const priorityKeys = ['aceite', 'aceites', 'cubierta', 'cubiertas', 'casco', 'cascos', 'freno', 'frenos', 'bateria', 'baterias']
  const sorted = [
    ...categorias.filter(c => priorityKeys.some(k => c.nombre.toLowerCase().includes(k))),
    ...categorias.filter(c => !priorityKeys.some(k => c.nombre.toLowerCase().includes(k))),
  ]
  const shown = sorted.slice(0, 10)

  return (
    <section className="bg-brand-bg py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] mb-1">
                Encontrá lo que buscás
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-brand-text">
                Categorías principales
              </h2>
            </div>
            <button
              onClick={() => navigate('/catalogo')}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-blue
                         hover:underline transition-colors"
            >
              Ver todo →
            </button>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {shown.map((cat, i) => (
            <AnimatedSection key={cat.id} delay={i * 60} direction="up">
              <CatCard cat={cat} onNavigate={navigate} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
