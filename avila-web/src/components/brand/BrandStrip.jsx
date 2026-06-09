import { useState } from 'react'

/*
 * BrandStrip — carrusel infinito de logos de marcas.
 *
 * Props:
 *   title     — título de la sección
 *   subtitle  — subtítulo opcional
 *   brands    — array de { nombre, logo, color? }
 *   dark      — boolean: fondo oscuro vs claro
 *   speed     — 'slow' | 'normal' | 'fast'  (default 'normal')
 *
 * Los logos se toman de public/assets/brands/{tipo}/{nombre}.png
 * Si el archivo no existe, se muestra el nombre como texto con color.
 */
function BrandLogo({ brand }) {
  const [imgError, setImgError] = useState(false)

  if (!brand.logo || imgError) {
    return (
      <div
        className="w-28 h-14 mx-3 flex items-center justify-center rounded-xl border border-brand-border bg-white px-3 flex-shrink-0"
        title={brand.nombre}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider text-brand-dark text-center leading-tight"
          style={{ fontSize: brand.nombre.length > 8 ? '9px' : '11px' }}
        >
          {brand.nombre}
        </span>
      </div>
    )
  }

  return (
    <div
      className="w-28 h-14 mx-3 flex items-center justify-center rounded-xl border border-brand-border bg-white px-3 flex-shrink-0
                 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default"
      title={brand.nombre}
    >
      <img
        src={brand.logo}
        alt={brand.nombre}
        loading="lazy"
        onError={() => setImgError(true)}
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: '40px' }}
      />
    </div>
  )
}

export default function BrandStrip({ title, subtitle, brands = [], dark = false, speed = 'normal' }) {
  if (!brands.length) return null

  const speedClass = speed === 'slow' ? '[animation-duration:38s]'
    : speed === 'fast' ? '[animation-duration:16s]'
    : ''

  // Triplicamos para garantizar el loop visual perfecto
  const repeated = [...brands, ...brands, ...brands]

  return (
    <section className={`py-10 ${dark ? 'bg-brand-dark' : 'bg-white border-y border-brand-border'}`}>
      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
          {title && (
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-brand-text'}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-brand-muted'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="brand-strip-wrapper">
        <div className={`brand-strip-track ${speedClass}`}>
          {repeated.map((brand, i) => (
            <BrandLogo key={`${brand.nombre}-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
