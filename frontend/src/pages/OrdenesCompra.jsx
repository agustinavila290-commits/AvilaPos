import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrdenes } from '../services/comprasService'

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EMITIDA', label: 'Emitida' },
  { value: 'RECIBIDA_PARCIAL', label: 'Recibida parcialmente' },
  { value: 'RECIBIDA_TOTAL', label: 'Recibida totalmente' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const estadoColor = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  EMITIDA: 'bg-blue-100 text-blue-700',
  RECIBIDA_PARCIAL: 'bg-yellow-100 text-yellow-700',
  RECIBIDA_TOTAL: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-600',
}

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (estado) params.estado = estado
      if (busqueda) params.search = busqueda
      const data = await getOrdenes(params)
      setOrdenes(Array.isArray(data) ? data : (data?.results || []))
    } catch {
      setOrdenes([])
    } finally {
      setLoading(false)
    }
  }, [estado, busqueda])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">Órdenes de Compra</h1>
          <p className="text-sm text-gray-500">Pedidos a proveedores con recepción parcial o total</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/compras/ordenes/nueva"
            className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110"
          >
            + Nueva orden
          </Link>
          <Link to="/compras" className="text-brand-blue text-sm underline self-center ml-2">
            ← Compras
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <input
          type="search"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por número, referencia o proveedor..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <span className="text-sm text-gray-400">{ordenes.length} orden(es)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Cargando...</div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="mb-3">No hay órdenes de compra.</p>
            <Link
              to="/compras/ordenes/nueva"
              className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110"
            >
              Crear primera orden
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-left">Referencia</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Ítems</th>
                <th className="px-3 py-2 text-center">Recibido</th>
                <th className="px-3 py-2 text-right">Total est.</th>
                <th className="px-3 py-2 text-left">Fecha emisión</th>
                <th className="px-3 py-2 text-left">Fecha esperada</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(o => (
                <tr key={o.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/compras/ordenes/${o.id}`)}>
                  <td className="px-3 py-2 font-bold text-brand-blue">#{o.numero}</td>
                  <td className="px-3 py-2 font-medium">{o.proveedor_nombre}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{o.numero_referencia || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoColor[o.estado] || ''}`}>
                      {o.estado_display}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">{o.cantidad_items}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${o.porcentaje_recibido}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{o.porcentaje_recibido}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${(o.total_estimado || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(o.fecha_emision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {o.fecha_esperada ? new Date(o.fecha_esperada + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <Link to={`/compras/ordenes/${o.id}`} className="text-brand-blue underline text-xs">
                      Ver
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
