import { useState } from 'react'

/**
 * Imagen con fallback visual elegante.
 * Si la imagen no existe o falla, muestra un gradiente + ícono/texto.
 *
 * Props:
 *   src       — ruta de la imagen
 *   alt       — texto alt
 *   fallbackText — texto a mostrar si falla (opcional)
 *   gradient  — clase de gradiente Tailwind (opcional)
 *   icon      — emoji o JSX (opcional)
 *   className — clases contenedor
 *   imgClass  — clases de la <img>
 *   lazy      — boolean (default true)
 */
export default function ImageWithFallback({
  src,
  alt = '',
  fallbackText,
  gradient = 'from-plate to-graphite',
  icon,
  className = '',
  imgClass = 'w-full h-full object-cover',
  lazy = true,
}) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
        {icon && <span className="text-4xl mb-2 select-none">{icon}</span>}
        {fallbackText && (
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider text-center px-2 leading-tight">
            {fallbackText}
          </span>
        )}
        {!icon && !fallbackText && (
          <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      onError={() => setError(true)}
      className={imgClass}
    />
  )
}
