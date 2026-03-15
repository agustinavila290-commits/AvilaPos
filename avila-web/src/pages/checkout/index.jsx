import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { crearPedido, getPuntosRetiro, crearPreferenciaMercadoPago } from '../../services/tiendaService'
import MapaPuntosRetiro from '../../components/tienda/MapaPuntosRetiro'
import MapaEntrega from '../../components/tienda/MapaEntrega'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalMonto, vaciar } = useCarrito()
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    localidad: '',
    cp: '',
    provincia: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [metodoPago, setMetodoPago] = useState('manual') // 'manual' | 'mercadopago'
  const [tipoEntrega, setTipoEntrega] = useState('retiro') // 'retiro' | 'envio'
  const [puntosRetiro, setPuntosRetiro] = useState([])
  const [puntoRetiroId, setPuntoRetiroId] = useState('')
  const [coordenadasEntrega, setCoordenadasEntrega] = useState({ lat: null, lng: null })

  useEffect(() => {
    async function cargarPuntos() {
      try {
        const lista = await getPuntosRetiro()
        setPuntosRetiro(lista)
        if (lista.length > 0) {
          setPuntoRetiroId(String(lista[0].id))
        }
      } catch (e) {
        // No bloqueamos el checkout si falla, solo mostramos mensaje genérico
        console.error('Error cargando puntos de retiro', e)
      }
    }
    cargarPuntos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('El carrito está vacío')
      return
    }
    if (tipoEntrega === 'retiro') {
      if (!puntoRetiroId) {
        setError('Seleccioná un punto de retiro')
        return
      }
    } else if (tipoEntrega === 'envio') {
      if (!form.direccion.trim() || !form.localidad.trim()) {
        setError('Para envío a domicilio completá dirección y localidad')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const data = await crearPedido({
        line_items: items.map((i) => ({
          variante_id: i.variante_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_web,
        })),
        datos_cliente: form,
        observaciones: 'Pedido tienda web',
        tipo_entrega: tipoEntrega,
        punto_retiro_id: tipoEntrega === 'retiro' ? Number(puntoRetiroId) : undefined,
        lat_entrega: tipoEntrega === 'envio' && typeof coordenadasEntrega.lat === 'number' ? coordenadasEntrega.lat : undefined,
        lng_entrega: tipoEntrega === 'envio' && typeof coordenadasEntrega.lng === 'number' ? coordenadasEntrega.lng : undefined,
      })

      vaciar()

      if (metodoPago === 'mercadopago') {
        try {
          const pref = await crearPreferenciaMercadoPago(data.venta_id)
          if (pref.init_point) {
            window.location.href = pref.init_point
            return
          }
        } catch (e) {
          console.error('Error creando preferencia de Mercado Pago', e)
          // Si falla MP, seguimos al flujo normal de confirmación
        }
      }

      navigate(`/confirmacion/${data.venta_numero}`, { state: { venta: data } })
    } catch (err) {
      setError(err.message || 'Error al crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !loading) {
    navigate('/carrito')
    return null
  }

  return (
    <section className="content">
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1>Checkout</h1>

        {error && (
          <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <p style={{ marginBottom: '1.5rem' }}>
          Total: <strong>${totalMonto.toLocaleString('es-AR')}</strong>
        </p>

        {/* Método de entrega */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--avila-gris-claro)', borderRadius: '0.5rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>Método de entrega</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>
              <input
                type="radio"
                name="tipo_entrega"
                value="retiro"
                checked={tipoEntrega === 'retiro'}
                onChange={() => setTipoEntrega('retiro')}
              />{' '}
              Retiro en el local
            </label>
            <label>
              <input
                type="radio"
                name="tipo_entrega"
                value="envio"
                checked={tipoEntrega === 'envio'}
                onChange={() => setTipoEntrega('envio')}
              />{' '}
              Envío a domicilio
            </label>
          </div>

          {tipoEntrega === 'retiro' && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>Punto de retiro:</p>
              {puntosRetiro.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--avila-gris)' }}>
                  No hay puntos de retiro configurados en este momento.
                </p>
              ) : (
                <>
                  <select
                    className="input-field"
                    value={puntoRetiroId}
                    onChange={(e) => setPuntoRetiroId(e.target.value)}
                  >
                    {puntosRetiro.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.direccion_texto ? `- ${p.direccion_texto}` : ''}
                      </option>
                    ))}
                  </select>
                  <MapaPuntosRetiro
                    puntos={puntosRetiro}
                    seleccionadoId={puntoRetiroId}
                    onSelect={setPuntoRetiroId}
                  />
                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--avila-gris)' }}>
                    Podés elegir el punto desde la lista o tocando el marcador en el mapa.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              Nombre *
              <input
                type="text"
                className="input-field"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>
            <label>
              Email *
              <input
                type="email"
                className="input-field"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Teléfono *
              <input
                type="tel"
                className="input-field"
                required
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
            <label>
              Dirección (para envío)
              <input
                type="text"
                className="input-field"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                disabled={tipoEntrega === 'retiro'}
              />
            </label>
            <label>
              Localidad
              <input
                type="text"
                className="input-field"
                value={form.localidad}
                onChange={(e) => setForm({ ...form, localidad: e.target.value })}
                disabled={tipoEntrega === 'retiro'}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <label style={{ flex: 1 }}>
                CP
                <input
                  type="text"
                  className="input-field"
                  value={form.cp}
                  onChange={(e) => setForm({ ...form, cp: e.target.value })}
                  disabled={tipoEntrega === 'retiro'}
                />
              </label>
              <label style={{ flex: 2 }}>
                Provincia
                <input
                  type="text"
                  className="input-field"
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                  disabled={tipoEntrega === 'retiro'}
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--avila-gris-claro)', borderRadius: '0.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>Método de pago</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>
                <input
                  type="radio"
                  name="metodo_pago"
                  value="manual"
                  checked={metodoPago === 'manual'}
                  onChange={() => setMetodoPago('manual')}
                />{' '}
                Coordinar pago (transferencia / efectivo)
              </label>
              <label>
                <input
                  type="radio"
                  name="metodo_pago"
                  value="mercadopago"
                  checked={metodoPago === 'mercadopago'}
                  onChange={() => setMetodoPago('mercadopago')}
                />{' '}
                Pagar ahora con Mercado Pago
              </label>
            </div>
          </div>

          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--avila-gris)' }}>
            Te contactaremos para coordinar pago y entrega.
          </p>

          {tipoEntrega === 'envio' && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                Podés marcar en el mapa el punto aproximado de entrega.
              </p>
              <MapaEntrega
                lat={coordenadasEntrega.lat}
                lng={coordenadasEntrega.lng}
                onChange={(coords) => setCoordenadasEntrega(coords)}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--avila-gris)' }}>
                Esto es opcional, pero nos ayuda a ubicar mejor tu zona.
              </p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
