import { useEffect } from 'react'
import { SITIO } from '../config'

export default function SEO({ title, description }) {
  useEffect(() => {
    document.title = title
      ? `${title} | ${SITIO.nombre}`
      : `${SITIO.nombre} — Repuestos y Accesorios`

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description || SITIO.descripcion)
  }, [title, description])

  return null
}
