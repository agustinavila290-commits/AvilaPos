import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getConteos,
  getConteo,
  crearConteo,
  actualizarItemConteo,
  finalizarConteo,
  cancelarConteo,
  getDepositos,
} from '../services/inventarioService'

// ── Lista de conteos ──────────────────────────────────────────
function ListaConteos() {
  const [conteos, setConteos] = useState([])
  const [loading, setLoading] = useState(true)
  const [depositos, setDepositos] = useState([])
  const [creando, setCreando] = useState(false)
  const [depositoId, setDepositoId] = useState('')
  const [obs, setObs] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getConteos(), getDepositos()]).then(([c, d]) => {
      setConteos(c)
      setDepositos(d)
      if (d.length > 0) setDepositoId(String(d[0].id))
    }).finally(() => setLoading(false))
  }, [])

  const handleCrear = async () => {
    if (!depositoId) return
    setCreando(true)
    try {
      const conteo = await crearConteo({ deposito: depositoId, observaciones: obs })
      navigate(`/inventario/conteo/${conteo.id}`)
    } catch (e) {
      alert('Error al crear conteo: ' + (e?.response?.data?.detail || e.message))
      setCreando(false)
    }
  }

  const estadoColor = { ABIERTO: 'text-blue-600', FINALIZADO: 'text-green-600', CANCELADO: 'text-gray-400' }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">Conteo Físico de Inventario</h1>
          <p className="text-sm text-gray-500">Contá el stock real y ajustá automáticamente las diferencias</p>
        </div>
        <Link to="/inventario/avanzado" className="text-brand-blue text-sm underline">← Inventario avanzado</Link>
      </div>

      {/* Nuevo conteo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <h2 className="font-semibold text-gray-700 mb-3">Iniciar nuevo conteo</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Depósito</label>
            <select
              value={depositoId}
              onChange={e => setDepositoId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">Observaciones (opcional)</label>
            <input
              type="text" value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Ej: Conteo mensual de junio"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <button
            onClick={handleCrear}
            disabled={creando || !depositoId}
            className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {creando ? 'Iniciando...' : 'Iniciar conteo'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Se cargarán automáticamente todos los productos del depósito seleccionado.</p>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Historial de conteos</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : conteos.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay conteos registrados.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Depósito</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-center">Items</th>
                <th className="px-3 py-2 text-center">Contados</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {conteos.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">#{c.id}</td>
                  <td className="px-3 py-2 font-medium">{c.deposito_nombre}</td>
                  <td className="px-3 py-2 text-gray-500">{c.usuario_nombre}</td>
                  <td className={`px-3 py-2 font-semibold ${estadoColor[c.estado] || ''}`}>{c.estado_display}</td>
                  <td className="px-3 py-2 text-center">{c.total_items}</td>
                  <td className="px-3 py-2 text-center">{c.items_contados}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(c.fecha_inicio).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Link to={`/inventario/conteo/${c.id}`} className="text-brand-blue underline text-xs">
                      {c.estado === 'ABIERTO' ? 'Continuar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Detalle de un conteo ──────────────────────────────────────
function DetalleConteo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conteo, setConteo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [finalizando, setFinalizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const inputRefs = useRef({})

  const recargar = () => {
    setLoading(true)
    getConteo(id).then(setConteo).finally(() => setLoading(false))
  }

  useEffect(() => { recargar() }, [id])

  const handleCantidad = async (varianteId, valor) => {
    const cantidad = parseInt(valor, 10)
    if (isNaN(cantidad) || cantidad < 0) return
    setGuardando(varianteId)
    try {
      await actualizarItemConteo(id, varianteId, cantidad)
      setConteo(prev => ({
        ...prev,
        detalles: prev.detalles.map(d =>
          d.variante === varianteId ? { ...d, cantidad_contada: cantidad, diferencia: cantidad - d.cantidad_sistema } : d
        )
      }))
    } catch (e) {
      alert('Error al guardar: ' + (e?.response?.data?.error || e.message))
    } finally {
      setGuardando(null)
    }
  }

  const handleFinalizar = async () => {
    if (!confirm('¿Finalizar el conteo? Se ajustará el stock para todas las diferencias registradas.')) return
    setFinalizando(true)
    try {
      const res = await finalizarConteo(id)
      alert(`Conteo finalizado.\nAjustados: ${res.ajustados}\nSin cambio: ${res.sin_cambio}\nSin contar: ${res.sin_contar}`)
      navigate('/inventario/conteo')
    } catch (e) {
      alert('Error: ' + (e?.response?.data?.error || e.message))
      setFinalizando(false)
    }
  }

  const handleCancelar = async () => {
    if (!confirm('¿Cancelar el conteo? No se aplicará ningún ajuste.')) return
    setCancelando(true)
    try {
      await cancelarConteo(id)
      navigate('/inventario/conteo')
    } catch (e) {
      alert('Error: ' + (e?.response?.data?.error || e.message))
      setCancelando(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Cargando conteo...</div>
  if (!conteo) return <div className="text-center py-10 text-red-500">Conteo no encontrado.</div>

  const esAbierto = conteo.estado === 'ABIERTO'
  const detallesFiltrados = (conteo.detalles || []).filter(d =>
    !filtro || d.nombre_completo?.toLowerCase().includes(filtro.toLowerCase()) || d.codigo?.toLowerCase().includes(filtro.toLowerCase())
  )
  const contados = (conteo.detalles || []).filter(d => d.cantidad_contada !== null).length
  const total = (conteo.detalles || []).length
  const diferencias = (conteo.detalles || []).filter(d => d.diferencia !== null && d.diferencia !== 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">
            Conteo #{conteo.id} — {conteo.deposito_nombre}
          </h1>
          <p className="text-sm text-gray-500">
            {conteo.estado_display} · {contados}/{total} contados · {diferencias} diferencia(s)
          </p>
        </div>
        <Link to="/inventario/conteo" className="text-brand-blue text-sm underline">← Volver</Link>
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-6 text-sm text-center">
          <div><p className="text-2xl font-bold text-brand-blue">{total}</p><p className="text-gray-400">Total items</p></div>
          <div><p className="text-2xl font-bold text-green-600">{contados}</p><p className="text-gray-400">Contados</p></div>
          <div><p className="text-2xl font-bold text-orange-500">{total - contados}</p><p className="text-gray-400">Pendientes</p></div>
          <div><p className="text-2xl font-bold text-red-500">{diferencias}</p><p className="text-gray-400">Con diferencia</p></div>
        </div>
        {/* Barra */}
        <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: total > 0 ? `${(contados / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <input
          type="search" value={filtro} onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por código o nombre..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        {esAbierto && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelando ? 'Cancelando...' : 'Cancelar conteo'}
            </button>
            <button
              onClick={handleFinalizar}
              disabled={finalizando || contados === 0}
              className="bg-brand-green text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {finalizando ? 'Finalizando...' : 'Finalizar y ajustar'}
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-brand-blue-dark text-white text-xs uppercase">
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-center">Sistema</th>
              <th className="px-3 py-2 text-center">Contado</th>
              <th className="px-3 py-2 text-center">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {detallesFiltrados.map(d => {
              const diff = d.diferencia
              const diffColor = diff === null ? '' : diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
              return (
                <tr key={d.id} className={`border-b ${diff !== null && diff !== 0 ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                  <td className="px-3 py-2 font-mono text-xs">{d.codigo}</td>
                  <td className="px-3 py-2 text-sm">{d.nombre_completo}</td>
                  <td className="px-3 py-2 text-center font-medium">{d.cantidad_sistema}</td>
                  <td className="px-3 py-2 text-center">
                    {esAbierto ? (
                      <input
                        ref={el => { inputRefs.current[d.variante] = el }}
                        type="number"
                        min="0"
                        defaultValue={d.cantidad_contada ?? ''}
                        placeholder="—"
                        disabled={guardando === d.variante}
                        onBlur={e => handleCantidad(d.variante, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleCantidad(d.variante, e.target.value)
                          }
                        }}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                      />
                    ) : (
                      <span className="font-medium">{d.cantidad_contada ?? '—'}</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${diffColor}`}>
                    {diff === null ? '—' : diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              )
            })}
            {detallesFiltrados.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Router interno ─────────────────────────────────────────────
export default function ConteoStock() {
  const { id } = useParams()
  return id ? <DetalleConteo /> : <ListaConteos />
}
