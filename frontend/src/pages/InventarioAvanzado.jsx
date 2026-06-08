import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getReposicionSugerida,
  getSinMovimiento,
  getMasVendidos,
  getMargenBajo,
  getDepositos,
} from '../services/inventarioService'

const TABS = [
  { id: 'reposicion', label: 'Reposición sugerida' },
  { id: 'sin_movimiento', label: 'Sin movimiento' },
  { id: 'mas_vendidos', label: 'Más vendidos' },
  { id: 'margen_bajo', label: 'Margen bajo' },
]

function EstadoBadge({ estado }) {
  const colors = {
    SIN_STOCK: 'bg-red-100 text-red-800',
    CRITICO: 'bg-orange-100 text-orange-800',
    BAJO: 'bg-yellow-100 text-yellow-800',
    NORMAL: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[estado] || 'bg-gray-100 text-gray-600'}`}>
      {estado?.replace('_', ' ')}
    </span>
  )
}

function FiltroDeposito({ depositos, value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
    >
      <option value="">Todos los depósitos</option>
      {depositos.map(d => (
        <option key={d.id} value={d.id}>{d.nombre}</option>
      ))}
    </select>
  )
}

// ── Tab: Reposición sugerida ──────────────────────────────────
function TabReposicion({ depositos }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [depositoId, setDepositoId] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReposicionSugerida(depositoId || null)
      setData(res.results || [])
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [depositoId])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FiltroDeposito depositos={depositos} value={depositoId} onChange={setDepositoId} />
        <span className="text-sm text-gray-500">{data.length} producto(s) bajo mínimo</span>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-green-600 font-medium">
          Todo el stock está por encima del mínimo configurado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-center">Actual</th>
                <th className="px-3 py-2 text-center">Mínimo</th>
                <th className="px-3 py-2 text-center">Faltante</th>
                <th className="px-3 py-2 text-center">Reponer</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.stock_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.codigo}</td>
                  <td className="px-3 py-2">{r.nombre_completo}</td>
                  <td className="px-3 py-2 text-gray-500">{r.marca}</td>
                  <td className="px-3 py-2 text-center font-bold text-red-600">{r.cantidad_actual}</td>
                  <td className="px-3 py-2 text-center">{r.stock_minimo}</td>
                  <td className="px-3 py-2 text-center text-orange-600 font-semibold">{r.faltante}</td>
                  <td className="px-3 py-2 text-center text-blue-700 font-semibold">{r.punto_reorden}</td>
                  <td className="px-3 py-2 text-center"><EstadoBadge estado={r.estado} /></td>
                  <td className="px-3 py-2 text-center">
                    <Link
                      to={`/inventario/ajustar/${r.variante_id}/${r.deposito_id}`}
                      className="text-xs text-brand-blue underline hover:no-underline"
                    >
                      Ajustar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab: Sin movimiento ───────────────────────────────────────
function TabSinMovimiento({ depositos }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [depositoId, setDepositoId] = useState('')
  const [dias, setDias] = useState(60)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSinMovimiento(dias, depositoId || null)
      setData(res.results || [])
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [dias, depositoId])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FiltroDeposito depositos={depositos} value={depositoId} onChange={setDepositoId} />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Sin venta en los últimos
          <select
            value={dias}
            onChange={e => setDias(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            {[30, 60, 90, 120, 180, 365].map(d => (
              <option key={d} value={d}>{d} días</option>
            ))}
          </select>
        </label>
        <span className="text-sm text-gray-500">{data.length} producto(s)</span>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Sin resultados para el período seleccionado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-left">Depósito</th>
                <th className="px-3 py-2 text-center">Stock</th>
                <th className="px-3 py-2 text-right">Costo</th>
                <th className="px-3 py-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.stock_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.codigo}</td>
                  <td className="px-3 py-2">{r.nombre_completo}</td>
                  <td className="px-3 py-2 text-gray-500">{r.marca}</td>
                  <td className="px-3 py-2 text-gray-500">{r.deposito_nombre}</td>
                  <td className="px-3 py-2 text-center font-bold">{r.cantidad}</td>
                  <td className="px-3 py-2 text-right text-gray-500">${r.costo?.toLocaleString('es-AR')}</td>
                  <td className="px-3 py-2 text-right font-medium">${r.precio_mostrador?.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab: Más vendidos ─────────────────────────────────────────
function TabMasVendidos({ depositos }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [depositoId, setDepositoId] = useState('')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0, 10))

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMasVendidos({ desde, hasta, depositoId: depositoId || null })
      setData(res.results || [])
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [desde, hasta, depositoId])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FiltroDeposito depositos={depositos} value={depositoId} onChange={setDepositoId} />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Desde <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Hasta <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </label>
        <span className="text-sm text-gray-500">Top {data.length}</span>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Sin ventas en el período seleccionado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-center">Unidades vendidas</th>
                <th className="px-3 py-2 text-center">Transacciones</th>
                <th className="px-3 py-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.variante_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.codigo}</td>
                  <td className="px-3 py-2">{r.nombre_completo}</td>
                  <td className="px-3 py-2 text-gray-500">{r.marca}</td>
                  <td className="px-3 py-2 text-center font-bold text-green-700">{r.total_vendido}</td>
                  <td className="px-3 py-2 text-center">{r.cantidad_transacciones}</td>
                  <td className="px-3 py-2 text-right">${r.precio_mostrador?.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab: Margen bajo ──────────────────────────────────────────
function TabMargenBajo({ depositos }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [depositoId, setDepositoId] = useState('')
  const [umbral, setUmbral] = useState(20)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMargenBajo(umbral, depositoId || null)
      setData(res.results || [])
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [umbral, depositoId])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FiltroDeposito depositos={depositos} value={depositoId} onChange={setDepositoId} />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Margen menor a
          <input
            type="number" min="0" max="100" value={umbral}
            onChange={e => setUmbral(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          %
        </label>
        <span className="text-sm text-gray-500">{data.length} producto(s)</span>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-green-600 font-medium">
          Todos los productos tienen margen mayor al {umbral}%.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-right">Costo</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-center">Margen %</th>
                <th className="px-3 py-2 text-right">Margen $</th>
                <th className="px-3 py-2 text-center">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.variante_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.codigo}</td>
                  <td className="px-3 py-2">{r.nombre_completo}</td>
                  <td className="px-3 py-2 text-gray-500">{r.marca}</td>
                  <td className="px-3 py-2 text-right">${r.costo?.toLocaleString('es-AR')}</td>
                  <td className="px-3 py-2 text-right">${r.precio_mostrador?.toLocaleString('es-AR')}</td>
                  <td className={`px-3 py-2 text-center font-bold ${r.margen_porcentaje < 10 ? 'text-red-600' : 'text-orange-500'}`}>
                    {r.margen_porcentaje?.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">${r.margen_monto?.toLocaleString('es-AR')}</td>
                  <td className="px-3 py-2 text-center">{r.stock_actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function InventarioAvanzado() {
  const [tab, setTab] = useState('reposicion')
  const [depositos, setDepositos] = useState([])

  useEffect(() => {
    getDepositos().then(setDepositos).catch(() => setDepositos([]))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">Inventario Avanzado</h1>
          <p className="text-sm text-gray-500">Análisis de stock, márgenes y rotación</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventario/conteo" className="bg-brand-blue text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110">
            Conteo físico
          </Link>
          <Link to="/inventario/ajuste-masivo" className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200">
            Ajuste masivo
          </Link>
          <Link to="/inventario" className="text-brand-blue text-sm underline self-center ml-2">
            ← Inventario
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 gap-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {tab === 'reposicion' && <TabReposicion depositos={depositos} />}
        {tab === 'sin_movimiento' && <TabSinMovimiento depositos={depositos} />}
        {tab === 'mas_vendidos' && <TabMasVendidos depositos={depositos} />}
        {tab === 'margen_bajo' && <TabMargenBajo depositos={depositos} />}
      </div>
    </div>
  )
}
