import { useState } from 'react'
import ImageWithFallback from './ImageWithFallback'

/**
 * BrandMarquee — tira de logos de marcas con scroll infinito animado.
 *
 * Props:
 *   title    — título de la sección
 *   subtitle — subtítulo
 *   brands   — [{ nombre, logo }]
 *   dark     — boolean: fondo oscuro (default false)
 *   speed    — 'slow' | 'normal' | 'fast'
 *   variant  — 'motos' | 'repuestos' (solo para contexto semántico)
 */
function BrandCard({ brand }) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div
      className="flex-shrink-0 w-32 h-16 mx-2.5 rounded-xl border border-white/10 bg-plate
                 flex items-center justify-center px-3
                 hover:border-brand-blue/60 hover:shadow-red-glow-sm hover:scale-105
                 transition-all duration-300 cursor-default"
      title={brand.nombre}
    >
      {brand.logo && imgOk ? (
        <img
          src={brand.logo}
          alt={brand.nombre}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="max-h-9 max-w-full object-contain"
        />
      ) : (
        <span
          className="text-white/70 font-black uppercase text-center leading-tight"
          style={{ fontSize: brand.nombre.length > 7 ? '9px' : '11px' }}
        >
          {brand.nombre}
        </span>
      )}
    </div>
  )
}

export default function BrandMarquee({
  title,
  subtitle,
  brands = [],
  dark = true,
  speed = 'normal',
  variant,
}) {
  if (!brands.length) return null

  // Triplicar para loop visual perfecto
  const repeated = [...brands, ...brands, ...brands]

  const speedCls = speed === 'fast' ? 'marquee-track-fast'
    : speed === 'slow' ? 'marquee-track-slow'
    : ''

  return (
    <section className={`py-10 overflow-hidden ${dark ? 'bg-carbon border-y border-white/5' : 'bg-white border-y border-brand-border'}`}>
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto px-4 mb-7 text-center">
          {title && (
            <h2 className={`text-lg font-bold tracking-wide ${dark ? 'text-white' : 'text-brand-text'}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={`text-sm mt-1 ${dark ? 'text-gray-500' : 'text-brand-muted'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="marquee-wrapper">
        <div className={`marquee-track ${speedCls}`}>
          {repeated.map((b, i) => (
            <BrandCard key={`${b.nombre}-${i}`} brand={b} />
          ))}
        </div>
      </div>
    </section>
  )
}
