import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useAuth } from '../../context/AuthContext'
import { tiendaApi } from '../../services/api'
import SEO from '../../components/SEO'

const METODOS_PAGO = [
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    desc: 'Tarjeta, débito, QR o saldo MP',
    icon: '💳',
  },
  {
    id: 'transferencia',
    label: 'Transferencia bancaria',
    desc: 'Te enviamos los datos por WhatsApp',
    icon: '🏦',
  },
  {
    id: 'efectivo',
    label: 'Efectivo al retirar',
    desc: 'Solo disponible con retiro en local',
    icon: '💵',
  },
]

function CampoTexto({ label, name, value, onChange, error, type = 'text', placeholder, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-brand-text">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'border-brand-red focus:ring-brand-red' : ''}`}
      />
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  )
}

function ResumenCarrito({ items, totalPrecio }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-brand-text mb-3">Resumen del pedido</h3>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-brand-muted truncate max-w-[180px]">
              {item.nombre} <span className="font-medium text-brand-text">×{item.cantidad}</span>
            </span>
            <span className="font-medium text-brand-text flex-shrink-0 ml-2">
              ${(item.precio_web * item.cantidad).toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-brand-border pt-3 flex justify-between font-bold">
        <span>Total</span>
        <span className="text-brand-blue">${totalPrecio.toLocaleString('es-AR')}</span>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrecio, dispatch } = useCarrito()
  const { user } = useAuth()

  const [puntosRetiro, setPuntosRetiro] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: '',
    tipoEntrega: 'retiro',
    puntoRetiroId: '',
    direccion: '',
    localidad: '',
    cp: '',
    provincia: '',
    metodoPago: 'mercadopago',
  })

  const [errores, setErrores] = useState({})

  useEffect(() => {
    tiendaApi.getPuntosRetiro()
      .then(r => {
        setPuntosRetiro(r.data)
        if (r.data.length > 0) {
          setForm(f => ({ ...f, puntoRetiroId: String(r.data[0].id) }))
        }
      })
      .catch(() => {})
  }, [])

  // Si el carrito está vacío, redirigir al catálogo
  useEffect(() => {
    if (items.length === 0) navigate('/catalogo', { replace: true })
  }, [items, navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errores[name]) setErrores(e => ({ ...e, [name]: null }))
  }

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.email.trim()) e.email = 'El email es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'

    if (form.tipoEntrega === 'retiro' && !form.puntoRetiroId) {
      e.puntoRetiroId = 'Seleccioná un punto de retiro'
    }
    if (form.tipoEntrega === 'envio') {
      if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria'
      if (!form.localidad.trim()) e.localidad = 'La localidad es obligatoria'
    }
    if (form.tipoEntrega === 'envio' && form.metodoPago === 'efectivo') {
      e.metodoPago = 'El pago en efectivo solo está disponible con retiro en local'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      return
    }

    setLoading(true)
    setErrorGeneral(null)

    const body = {
      line_items: items.map(i => ({ variante_id: i.id, cantidad: i.cantidad })),
      datos_cliente: {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        localidad: form.localidad,
        cp: form.cp,
        provincia: form.provincia,
      },
      tipo_entrega: form.tipoEntrega,
      ...(form.tipoEntrega === 'retiro'
        ? { punto_retiro_id: parseInt(form.puntoRetiroId) }
        : {}),
    }

    try {
      const res = await tiendaApi.crearPedido(body)
      const { venta_id, venta_numero } = res.data

      dispatch({ type: 'VACIAR' })

      if (form.metodoPago === 'mercadopago') {
        try {
          const base = window.location.origin
          const mpRes = await tiendaApi.crearPreferenciaMercadoPago({
            venta_id,
            back_urls: {
              success: `${base}/confirmacion/${venta_numero}?status=approved&pago=mercadopago`,
              pending: `${base}/confirmacion/${venta_numero}?status=pending&pago=mercadopago`,
              failure: `${base}/confirmacion/${venta_numero}?status=failure&pago=mercadopago`,
            },
            auto_return: 'approved',
          })
          window.location.href = mpRes.data.init_point
        } catch {
          navigate(`/confirmacion/${venta_numero}?pago=mercadopago&error=mp`)
        }
      } else {
        navigate(`/confirmacion/${venta_numero}?pago=${form.metodoPago}`)
      }
    } catch (err) {
      const detalle = err.response?.data?.detalle
      if (Array.isArray(detalle)) {
        setErrorGeneral(detalle.join(' · '))
      } else {
        setErrorGeneral(err.response?.data?.error || 'Ocurrió un error al procesar el pedido. Intentá de nuevo.')
      }
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  const efectivoConEnvio = form.tipoEntrega === 'envio' && form.metodoPago === 'efectivo'

  return (
    <>
    <SEO title="Finalizar pedido" />
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-brand-muted mb-6">
        <Link to="/carrito" className="hover:text-brand-text transition-colors">← Volver al carrito</Link>
      </div>

      <h1 className="text-2xl font-bold text-brand-text mb-8">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Sección 1: Datos personales */}
            <div className="card p-5">
              <h2 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-blue text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                Datos de contacto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <CampoTexto label="Nombre completo" name="nombre" value={form.nombre} onChange={handleChange} error={errores.nombre} placeholder="Juan Pérez" required />
                </div>
                <CampoTexto label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errores.email} placeholder="juan@ejemplo.com" required />
                <CampoTexto label="Teléfono / WhatsApp" name="telefono" type="tel" value={form.telefono} onChange={handleChange} error={errores.telefono} placeholder="2664 000000" required />
              </div>
            </div>

            {/* Sección 2: Entrega */}
            <div className="card p-5">
              <h2 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-blue text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { id: 'retiro', label: 'Retiro en local', desc: 'Av. Pte. Castillo 1165', icon: '🏪' },
                  { id: 'envio', label: 'Envío a domicilio', desc: 'Coordinar por WhatsApp', icon: '🚚' },
                ].map(op => (
                  <label
                    key={op.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.tipoEntrega === op.id
                        ? 'border-brand-blue bg-blue-50'
                        : 'border-brand-border hover:border-brand-blue/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value={op.id}
                      checked={form.tipoEntrega === op.id}
                      onChange={handleChange}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <p className="font-medium text-sm">{op.icon} {op.label}</p>
                      <p className="text-xs text-brand-muted">{op.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Punto de retiro */}
              {form.tipoEntrega === 'retiro' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-brand-text">
                    Punto de retiro <span className="text-brand-red">*</span>
                  </label>
                  {puntosRetiro.length > 0 ? (
                    <select
                      name="puntoRetiroId"
                      value={form.puntoRetiroId}
                      onChange={handleChange}
                      className={`input ${errores.puntoRetiroId ? 'border-brand-red' : ''}`}
                    >
                      {puntosRetiro.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}{p.direccion_texto ? ` — ${p.direccion_texto}` : ''}
                          {p.horarios ? ` (${p.horarios})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-brand-muted p-2 bg-brand-bg rounded-lg">Av. Pte. Castillo 1165 — Local principal</p>
                  )}
                  {errores.puntoRetiroId && <p className="text-xs text-brand-red">{errores.puntoRetiroId}</p>}
                </div>
              )}

              {/* Datos de envío */}
              {form.tipoEntrega === 'envio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="sm:col-span-2">
                    <CampoTexto label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} error={errores.direccion} placeholder="Calle 123" required />
                  </div>
                  <CampoTexto label="Localidad" name="localidad" value={form.localidad} onChange={handleChange} error={errores.localidad} placeholder="San Luis" required />
                  <CampoTexto label="Código postal" name="cp" value={form.cp} onChange={handleChange} placeholder="5700" />
                  <CampoTexto label="Provincia" name="provincia" value={form.provincia} onChange={handleChange} placeholder="San Luis" />
                </div>
              )}
            </div>

            {/* Sección 3: Pago */}
            <div className="card p-5">
              <h2 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-blue text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
                Método de pago
              </h2>
              <div className="flex flex-col gap-2">
                {METODOS_PAGO.map(mp => {
                  const deshabilitado = mp.id === 'efectivo' && form.tipoEntrega === 'envio'
                  return (
                    <label
                      key={mp.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                        deshabilitado
                          ? 'border-brand-border opacity-40 cursor-not-allowed'
                          : form.metodoPago === mp.id
                          ? 'border-brand-blue bg-blue-50 cursor-pointer'
                          : 'border-brand-border hover:border-brand-blue/40 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        value={mp.id}
                        checked={form.metodoPago === mp.id}
                        onChange={handleChange}
                        disabled={deshabilitado}
                        className="mt-0.5 accent-brand-blue"
                      />
                      <div>
                        <p className="font-medium text-sm">{mp.icon} {mp.label}</p>
                        <p className="text-xs text-brand-muted">{mp.desc}</p>
                      </div>
                    </label>
                  )
                })}
                {errores.metodoPago && <p className="text-xs text-brand-red mt-1">{errores.metodoPago}</p>}
              </div>
            </div>

            {/* Error general */}
            {errorGeneral && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠ {errorGeneral}
              </div>
            )}
          </div>

          {/* Sidebar: Resumen */}
          <div className="flex flex-col gap-4">
            <ResumenCarrito items={items} totalPrecio={totalPrecio} />

            <button
              type="submit"
              disabled={loading || efectivoConEnvio}
              className="btn-primary w-full py-3 text-base rounded-xl disabled:opacity-50"
            >
              {loading
                ? 'Procesando...'
                : form.metodoPago === 'mercadopago'
                ? 'Pagar con Mercado Pago →'
                : 'Confirmar pedido →'}
            </button>

            <p className="text-xs text-brand-muted text-center">
              Al confirmar aceptás nuestras condiciones de venta.
            </p>
          </div>
        </div>
      </form>
    </div>
    </>
  )
}
