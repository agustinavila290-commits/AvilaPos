import { useEffect, useRef, useState } from 'react'

/**
 * Wrapper que revela su contenido al entrar en el viewport.
 * Usa IntersectionObserver — sin librerías externas, muy liviano.
 *
 * Props:
 *   delay     — delay en ms antes de iniciar la animación
 *   direction — 'up' | 'left' | 'right' | 'none'
 *   className — clases extra
 *   once      — si es false, se re-anima cada vez que entra al viewport
 */
export default function AnimatedSection({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const initial = {
    up:    'opacity-0 translate-y-6',
    left:  'opacity-0 -translate-x-6',
    right: 'opacity-0 translate-x-6',
    none:  'opacity-0',
  }[direction] ?? 'opacity-0 translate-y-6'

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : initial} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
