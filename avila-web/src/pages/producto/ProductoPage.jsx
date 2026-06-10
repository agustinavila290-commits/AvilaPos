import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'
import { useCarrito } from '../../context/CarritoContext'
import { WA_NUMBER, SITIO, WA_MESSAGES, ENVIO_GRATIS_DESDE } from '../../config'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'

function normalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const WA_SVG = (
  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function SkeletonDetalle() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-xl skeleton-light" />
        <div className="flex flex-col gap-4">
          <div className="h-3 skeleton-light rounded w-24" />
          <div className="h-7 skeleton-light rounded w-4/5" />
          <div className="h-7 skeleton-light rounded w-3/5" />
          <div className="h-10 skeleton-light rounded w-40 mt-2" />
          <div className="h-12 skeleton-light rounded-xl mt-4" />
          <div className="h-12 skeleton-light rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function ProductoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useCarrito()

  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [relacionados, setRelacionados] = useState([])
  const [copiado, setCopiado] = useState(false)
  const [imgSeleccionada, setImgSeleccionada] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setCantidad(1)
    setAgregado(false)
    setRelacionados([])
    tiendaApi.getProducto(id)
      .then(r => setProducto(r.data))
      .catch(err => {
        if (err.response?.status === 404) setError('not_found')
        else setError('error')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!producto) return
    try {
      const key = 'avila_vistos'
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      const sin = prev.filter(p => p.id !== producto.id)
      const entry = {
        id: producto.id,
        nombre_completo: producto.nombre_completo,
        precio_web: producto.precio_web,
        imagen_url: producto.imagen_url,
        marca: producto.marca,
        stock: producto.stock,
      }
      localStorage.setItem(key, JSON.stringify([entry, ...sin].slice(0, 8)))
    } catch {}
  }, [producto?.id])

  useEffect(() => {
    if (!producto?.categoria_id) return
    tiendaApi.getProductos({ categoria: producto.categoria_id, page_size: 5 })
      .then(r => {
        const otros = r.data.results.filter(p => p.id !== producto.id)
        setRelacionados(otros.slice(0, 4))
      })
      .catch(() => {})
  }, [producto?.categoria_id, producto?.id])

  function agregarAlCarrito() {
    if (!producto || sinStock) return
    const item = {
      id: producto.id,
      nombre: normalizar(producto.nombre_completo),
      precio_web: precio,
      imagen_url: producto.imagen_url,
    }
    dispatch({ type: 'AGREGAR', producto: item })
    if (cantidad > 1) {
      for (let i = 1; i < cantidad; i++) {
        dispatch({ type: 'AGREGAR', producto: item })
      }
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  function copiarEnlace() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
      .catch(() => {})
  }

  if (loading) return <SkeletonDetalle />

  if (error === 'not_found') return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-xl font-bold mb-2">Producto no encontrado</h1>
      <p className="text-brand-muted mb-6">Este producto no existe o fue dado de baja.</p>
      <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
    </div>
  )

  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-brand-muted mb-4">No se pudo cargar el producto.</p>
      <button onClick={() => window.location.reload()} className="btn-primary">Reintentar</button>
    </div>
  )

  const precio = parseFloat(producto.precio_web)
  const sinStock = producto.stock <= 0
  const stockBajo = !sinStock && producto.stock <= 5
  const envioGratis = precio >= ENVIO_GRATIS_DESDE

  const waConsultaUrl = WA_MESSAGES.consultaProducto(normalizar(producto.nombre_completo), producto.codigo)
  const waDisponibilidadUrl = WA_MESSAGES.sinStock(normalizar(producto.nombre_completo), producto.codigo)
  const waCompartirUrl = WA_MESSAGES.compartirProducto(normalizar(producto.nombre_completo), window.location.href)

  return (
    <>
    <div className="bg-brand-bg pb-24 md:pb-8">
      <SEO
        title={normalizar(producto.nombre_completo)}
        description={producto.descripcion || `${normalizar(producto.nombre_completo)} — ${producto.marca || ''} — $${precio.toLocaleString('es-AR')}. Disponible en Avila Moto Repuestos.`}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-brand-muted">
            <Link to="/" className="hover:text-brand-blue transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/catalogo" className="hover:text-brand-blue transition-colors">Catálogo</Link>
            <span>/</span>
            <span className="text-brand-text font-medium truncate max-w-xs">{normalizar(producto.nombre_completo)}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* ─── GALERÍA ─── */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-white border border-brand-border flex items-center justify-center shadow-card">
              {producto.imagenes?.length > 0
                ? <img
                    src={producto.imagenes[imgSeleccionada]?.url || producto.imagenes[0]?.url}
                    alt={normalizar(producto.nombre_completo)}
                    className="w-full h-full object-cover"
                  />
                : producto.imagen_url
                ? <img src={producto.imagen_url} alt={normalizar(producto.nombre_completo)} className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center text-gray-200 gap-3">
                    <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-300">Sin imagen</span>
                  </div>
              }
            </div>
            {producto.imagenes?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {producto.imagenes.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setImgSeleccionada(idx)}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === imgSeleccionada ? 'border-brand-blue' : 'border-transparent hover:border-brand-border'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── INFO — sticky en desktop ─── */}
          <div className="flex flex-col gap-3 md:sticky md:top-[calc(3.5rem+2.25rem+1px)] md:self-start">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {producto.categoria && (
                <span className="text-xs bg-red-50 text-brand-blue font-semibold px-2.5 py-0.5 rounded-full border border-red-200">
                  {normalizar(producto.categoria)}
                </span>
              )}
              {producto.marca && (
                <span className="text-xs bg-gray-100 text-brand-text font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  {producto.marca}
                </span>
              )}
            </div>

            {/* Nombre */}
            <h1 className="text-xl font-bold text-brand-text leading-snug">
              {normalizar(producto.nombre_completo)}
            </h1>

            {producto.codigo && (
              <p className="text-xs text-brand-muted">
                Código: <span className="font-mono text-brand-text font-medium">{producto.codigo}</span>
              </p>
            )}

            {/* Precio */}
            <div className="flex items-baseline gap-3 mt-1">
              <p className={`text-4xl font-black leading-none ${sinStock ? 'text-gray-300 line-through text-2xl' : 'text-brand-blue'}`}>
                ${precio.toLocaleString('es-AR')}
              </p>
            </div>

            {/* Stock + Envío gratis */}
            <div className="flex flex-wrap items-center gap-2">
              {sinStock
                ? <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Sin stock
                  </span>
                : stockBajo
                ? <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" /> Últimas {producto.stock} unidades
                  </span>
                : <span className="inline-flex items-center gap-1.5 text-sm text-brand-green font-semibold">
                    <span className="w-2 h-2 rounded-full bg-brand-green inline-block" /> En stock
                  </span>
              }
              {envioGratis && !sinStock && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-600 text-white">
                  🚚 Envío gratis
                </span>
              )}
            </div>

            {producto.descripcion && (
              <p className="text-sm text-brand-muted leading-relaxed border-t border-brand-border pt-3 mt-1">
                {producto.descripcion}
              </p>
            )}

            {/* Sin stock: solo WA */}
            {sinStock ? (
              <a
                href={waDisponibilidadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-brand-green hover:bg-green-700
                           text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-2"
              >
                {WA_SVG} Consultar disponibilidad por WhatsApp
              </a>
            ) : (
              <>
                {/* Cantidad */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden bg-white shadow-card">
                    <button
                      onClick={() => setCantidad(c => Math.max(1, c - 1))}
                      className="w-10 h-10 flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors text-lg font-bold"
                    >−</button>
                    <span className="w-10 text-center font-bold text-brand-text">{cantidad}</span>
                    <button
                      onClick={() => setCantidad(c => Math.min(producto.stock, c + 1))}
                      className="w-10 h-10 flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors text-lg font-bold"
                    >+</button>
                  </div>
                  <button
                    onClick={agregarAlCarrito}
                    className={`flex-1 py-3 rounded-xl font-black text-base transition-all active:scale-[0.98] ${
                      agregado
                        ? 'bg-brand-green text-white'
                        : 'bg-brand-blue hover:bg-brand-blue-dark text-white shadow-card hover:shadow-card-hover'
                    }`}
                  >
                    {agregado ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                  </button>
                </div>

                {agregado && (
                  <button
                    onClick={() => navigate('/carrito')}
                    className="btn-secondary text-sm py-2.5 w-full"
                  >
                    Ver carrito →
                  </button>
                )}
              </>
            )}

            {/* Consultar por WhatsApp */}
            <a
              href={waConsultaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-brand-green text-brand-green
                         font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
            >
              {WA_SVG} Consultar por WhatsApp
            </a>

            {/* Trust badges — scroll horizontal en mobile, grid en desktop */}
            <div className="mt-1">
              {/* Mobile: scroll */}
              <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                  {[
                    { icon: '🚚', titulo: 'Envío', sub: 'A todo el país' },
                    { icon: '🏪', titulo: 'Retiro', sub: SITIO.direccion },
                    { icon: '💳', titulo: 'Pago seguro', sub: 'MP y transferencia' },
                    { icon: '💬', titulo: 'WhatsApp', sub: 'Respondemos rápido' },
                  ].map(item => (
                    <div key={item.titulo} className="flex items-center gap-2 bg-white border border-brand-border rounded-xl px-3 py-2.5 shadow-card flex-shrink-0">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-brand-text leading-tight whitespace-nowrap">{item.titulo}</p>
                        <p className="text-[10px] text-brand-muted leading-tight whitespace-nowrap">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Desktop: grid 2x2 */}
              <div className="hidden md:grid grid-cols-2 gap-2">
                {[
                  { icon: '🚚', titulo: 'Envío a todo el país', sub: 'Coordinamos la entrega' },
                  { icon: '🏪', titulo: 'Retiro en local', sub: SITIO.direccion },
                  { icon: '💳', titulo: 'Pago seguro', sub: 'MP y transferencia' },
                  { icon: '💬', titulo: 'Atención WA', sub: 'Respondemos rápido' },
                ].map(item => (
                  <div key={item.titulo} className="flex items-start gap-2 bg-white border border-brand-border rounded-xl p-3 shadow-card">
                    <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-brand-text leading-tight">{item.titulo}</p>
                      <p className="text-[10px] text-brand-muted leading-tight">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compartir */}
            <div className="flex gap-2">
              <button
                onClick={copiarEnlace}
                className="flex-1 flex items-center justify-center gap-1.5 border border-brand-border text-brand-muted
                           py-2 rounded-xl hover:bg-brand-bg transition-colors text-xs font-medium"
              >
                {copiado
                  ? <><span className="text-brand-green">✓</span> ¡Enlace copiado!</>
                  : <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar enlace
                    </>
                }
              </button>
              <a
                href={waCompartirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-brand-border text-brand-muted
                           px-4 py-2 rounded-xl hover:bg-brand-bg transition-colors text-xs font-medium"
              >
                {WA_SVG} Compartir
              </a>
            </div>
          </div>
        </div>

        {/* Compatibilidad */}
        {producto.motos_compatibles?.length > 0 && (
          <div className="mt-8 bg-white border border-brand-border rounded-xl p-5 shadow-card">
            <h2 className="text-base font-bold text-brand-text mb-4">🏍️ Compatible con estas motos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left pb-2 text-brand-muted font-medium text-xs">Marca</th>
                    <th className="text-left pb-2 text-brand-muted font-medium text-xs">Modelo</th>
                    <th className="text-left pb-2 text-brand-muted font-medium text-xs">Año</th>
                    <th className="sr-only">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {producto.motos_compatibles.map(m => (
                    <tr key={m.id} className="border-b border-brand-border last:border-0">
                      <td className="py-2 font-semibold text-brand-text">{m.marca}</td>
                      <td className="py-2 text-brand-muted">{m.modelo}</td>
                      <td className="py-2 text-brand-muted">{m.anio}</td>
                      <td className="py-2">
                        <Link
                          to={`/catalogo?modelo=${m.id}&moto=${encodeURIComponent(`${m.marca} ${m.modelo} ${m.anio}`)}`}
                          className="text-xs text-brand-blue hover:underline font-medium"
                        >
                          Ver todos →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-10 border-t border-brand-border pt-8">
            <h2 className="text-base font-bold text-brand-text mb-4">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relacionados.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>

    {/* BARRA FIJA MOBILE */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-brand-border px-4 py-3
                    flex items-center gap-3 z-50 md:hidden"
         style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.10)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-brand-muted truncate leading-tight">{normalizar(producto.nombre_completo)}</p>
        <p className="text-2xl font-black text-brand-blue leading-none mt-0.5">${precio.toLocaleString('es-AR')}</p>
      </div>
      {sinStock ? (
        <a
          href={waDisponibilidadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-brand-green text-white font-black px-5 py-3 rounded-xl text-sm flex-shrink-0"
        >
          {WA_SVG} Consultar
        </a>
      ) : (
        <button
          onClick={agregarAlCarrito}
          className={`font-black px-5 py-3 rounded-xl text-sm flex-shrink-0 transition-all active:scale-95 ${
            agregado ? 'bg-brand-green text-white' : 'bg-brand-blue text-white'
          }`}
        >
          {agregado ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
      )}
    </div>
    </>
  )
}
