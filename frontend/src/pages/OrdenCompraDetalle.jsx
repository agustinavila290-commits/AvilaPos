import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getOrden, emitirOrden, recibirOrden, cancelarOrden } from '../services/comprasService'

const estadoColor = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  EMITIDA: 'bg-blue-100 text-blue-700',
  RECIBIDA_PARCIAL: 'bg-yellow-100 text-yellow-700',
  RECIBIDA_TOTAL: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-600',
}

export default function OrdenCompraDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState(null)

  // Recepción
  const [recepcionItems, setRecepcionItems] = useState({})
  const [factura, setFactura] = useState('')
  const [fechaCompra, setFechaCompra] = useState('')
  const [obsCompra, setObsCompra] = useState('')
  const [recibiendo, setRecibiendo] = useState(false)
  const [modoRecepcion, setModoRecepcion] = useState(false)

  const recargar = () => {
    setLoading(true)
    getOrden(id).then(o => {
      setOrden(o)
      // Inicializar cantidades a recibir con la cantidad pendiente
      const init = {}
      o.detalles?.forEach(d => {
        init[d.id] = {
          cantidad_a_recibir: d.cantidad_pendiente,
          costo_real: d.costo_estimado || d.costo_actual || '',
          actualizar_costo: true,
          actualizar_precio: false,
        }
      })
      setRecepcionItems(init)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { recargar() }, [id])

  const handleEmitir = async () => {
    if (!confirm('¿Emitir esta orden? Cambiará el estado a EMITIDA.')) return
    setAccion('emitir')
    try {
      await emitirOrden(id)
      recargar()
    } catch (e) {
      alert(e?.response?.data?.error || 'Error al emitir')
    } finally {
      setAccion(null)
    }
  }

  const handleCancelar = async () => {
    if (!confirm('¿Cancelar esta orden? No se puede deshacer.')) return
    setAccion('cancelar')
    try {
      await cancelarOrden(id)
      navigate('/compras/ordenes')
    } catch (e) {
      alert(e?.response?.data?.error || 'Error al cancelar')
      setAccion(null)
    }
  }

  const handleRecibir = async () => {
    const itemsData = Object.entries(recepcionItems)
      .map(([detalleId, vals]) => ({
        detalle_id: parseInt(detalleId),
        cantidad_a_recibir: parseInt(vals.cantidad_a_recibir) || 0,
        costo_real: parseFloat(vals.costo_real) || null,
        actualizar_costo: vals.actualizar_costo,
        actualizar_precio: vals.actualizar_precio,
      }))
      .filter(i => i.cantidad_a_recibir > 0)

    if (itemsData.length === 0) {
      alert('Ingresá al menos una cantidad mayor a 0 para recibir.')
      return
    }

    if (!confirm(`¿Confirmar recepción de ${itemsData.length} ítem(s)?`)) return

    setRecibiendo(true)
    try {
      const res = await recibirOrden(id, {
        items: itemsData,
        numero_factura: factura || null,
        fecha_compra: fechaCompra || null,
        observaciones_compra: obsCompra || null,
      })
      alert(`Recepción registrada.\nCompra generada: #${res.compra_generada?.numero}\nTotal: $${res.compra_generada?.total}`)
      setModoRecepcion(false)
      recargar()
    } catch (e) {
      alert(e?.response?.data?.error || 'Error al registrar recepción')
    } finally {
      setRecibiendo(false)
    }
  }

  const updateRecepcion = (detalleId, campo, valor) => {
    setRecepcionItems(prev => ({
      ...prev,
      [detalleId]: { ...prev[detalleId], [campo]: valor }
    }))
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Cargando...</div>
  if (!orden) return <div className="text-center py-10 text-red-500">Orden no encontrada.</div>

  const puedeEmitir = orden.estado === 'BORRADOR'
  const puedeRecibir = ['EMITIDA', 'RECIBIDA_PARCIAL'].includes(orden.estado)
  const puedeCancelar = !['CANCELADA', 'RECIBIDA_TOTAL'].includes(orden.estado)

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">
            Orden de Compra #{orden.numero}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoColor[orden.estado]}`}>
              {orden.estado_display}
            </span>
            <span className="text-sm text-gray-500">{orden.proveedor_nombre}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">{orden.deposito_nombre}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {puedeEmitir && (
            <button
              onClick={handleEmitir}
              disabled={accion === 'emitir'}
              className="bg-brand-blue text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {accion === 'emitir' ? 'Emitiendo...' : 'Emitir orden'}
            </button>
          )}
          {puedeRecibir && !modoRecepcion && (
            <button
              onClick={() => setModoRecepcion(true)}
              className="bg-brand-green text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110"
            >
              Registrar recepción
            </button>
          )}
          {puedeCancelar && (
            <button
              onClick={handleCancelar}
              disabled={accion === 'cancelar'}
              className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar orden
            </button>
          )}
          <Link to="/compras/ordenes" className="text-brand-blue text-sm underline self-center">← Volver</Link>
        </div>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-400">Emisión</p>
          <p className="font-medium text-sm">{new Date(orden.fecha_emision).toLocaleDateString('es-AR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-400">Fecha esperada</p>
          <p className="font-medium text-sm">{orden.fecha_esperada ? new Date(orden.fecha_esperada + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-400">Total estimado</p>
          <p className="font-bold text-brand-blue">${(orden.total_estimado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-400">Recibido</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${orden.porcentaje_recibido}%` }} />
            </div>
            <span className="text-sm font-bold text-green-600">{orden.porcentaje_recibido}%</span>
          </div>
        </div>
      </div>

      {orden.observaciones && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-sm text-yellow-800">
          {orden.observaciones}
        </div>
      )}

      {/* Modo recepción */}
      {modoRecepcion && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <h2 className="font-semibold text-green-800 mb-3">Registrar recepción</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">N° de factura proveedor</label>
              <input
                type="text" value={factura} onChange={e => setFactura(e.target.value)}
                placeholder="Opcional"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha de factura</label>
              <input
                type="date" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
              <input
                type="text" value={obsCompra} onChange={e => setObsCompra(e.target.value)}
                placeholder="Opcional"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRecibir}
              disabled={recibiendo}
              className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {recibiendo ? 'Registrando...' : 'Confirmar recepción'}
            </button>
            <button
              onClick={() => setModoRecepcion(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de ítems */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-brand-blue-dark text-white text-xs uppercase">
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-center">Pedido</th>
              <th className="px-3 py-2 text-center">Recibido</th>
              <th className="px-3 py-2 text-center">Pendiente</th>
              <th className="px-3 py-2 text-right">Costo est.</th>
              <th className="px-3 py-2 text-right">Costo real</th>
              {modoRecepcion && <>
                <th className="px-3 py-2 text-center">A recibir</th>
                <th className="px-3 py-2 text-right">Costo real ahora</th>
                <th className="px-3 py-2 text-center">Act. costo</th>
              </>}
              <th className="px-3 py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(orden.detalles || []).map(d => {
              const rec = recepcionItems[d.id] || {}
              const esPendiente = d.cantidad_pendiente > 0
              return (
                <tr key={d.id} className={`border-b ${d.completado ? 'bg-green-50' : ''} hover:bg-gray-50`}>
                  <td className="px-3 py-2 font-mono text-xs">{d.codigo}</td>
                  <td className="px-3 py-2 text-sm">{d.nombre_completo}</td>
                  <td className="px-3 py-2 text-center font-medium">{d.cantidad_pedida}</td>
                  <td className="px-3 py-2 text-center text-green-600 font-medium">{d.cantidad_recibida}</td>
                  <td className={`px-3 py-2 text-center font-bold ${esPendiente ? 'text-orange-500' : 'text-gray-300'}`}>
                    {d.cantidad_pendiente}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {d.costo_estimado ? `$${parseFloat(d.costo_estimado).toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {d.costo_real ? `$${parseFloat(d.costo_real).toLocaleString('es-AR')}` : '—'}
                  </td>
                  {modoRecepcion && <>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number" min="0" max={d.cantidad_pendiente}
                        value={rec.cantidad_a_recibir ?? d.cantidad_pendiente}
                        onChange={e => updateRecepcion(d.id, 'cantidad_a_recibir', e.target.value)}
                        disabled={!esPendiente}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" min="0" step="0.01"
                        value={rec.costo_real ?? d.costo_estimado ?? ''}
                        onChange={e => updateRecepcion(d.id, 'costo_real', e.target.value)}
                        disabled={!esPendiente}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={rec.actualizar_costo ?? true}
                        onChange={e => updateRecepcion(d.id, 'actualizar_costo', e.target.checked)}
                        disabled={!esPendiente}
                        className="accent-brand-blue"
                      />
                    </td>
                  </>}
                  <td className="px-3 py-2 text-center">
                    {d.completado
                      ? <span className="text-green-600 text-xs font-semibold">Completo</span>
                      : d.cantidad_recibida > 0
                        ? <span className="text-yellow-600 text-xs font-semibold">Parcial</span>
                        : <span className="text-gray-400 text-xs">Pendiente</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {orden.notas_proveedor && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">Notas para el proveedor:</p>
          <p>{orden.notas_proveedor}</p>
        </div>
      )}
    </div>
  )
}
