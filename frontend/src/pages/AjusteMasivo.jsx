import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDepositos, ajusteMasivo } from '../services/inventarioService'
import { getStocks } from '../services/inventarioService'

export default function AjusteMasivo() {
  const navigate = useNavigate()
  const [depositos, setDepositos] = useState([])
  const [depositoId, setDepositoId] = useState('')
  const [stocks, setStocks] = useState([])
  const [cargandoStocks, setCargandoStocks] = useState(false)
  const [items, setItems] = useState({}) // varianteId -> nuevaCantidad (string)
  const [obs, setObs] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    getDepositos().then(d => {
      setDepositos(d)
      if (d.length > 0) setDepositoId(String(d[0].id))
    })
  }, [])

  useEffect(() => {
    if (!depositoId) return
    setCargandoStocks(true)
    setItems({})
    getStocks({ deposito: depositoId, page_size: 500 })
      .then(data => {
        const rows = data?.results || data || []
        setStocks(rows)
      })
      .finally(() => setCargandoStocks(false))
  }, [depositoId])

  const handleCantidad = (varianteId, valor) => {
    setItems(prev => ({ ...prev, [varianteId]: valor }))
  }

  const cambiosCount = Object.values(items).filter(v => v !== '' && v !== undefined).length

  const handleGuardar = async () => {
    if (cambiosCount === 0) return
    if (!confirm(`¿Confirmar el ajuste masivo de ${cambiosCount} producto(s)?`)) return
    setGuardando(true)
    try {
      const itemsData = Object.entries(items)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([varianteId, nuevaCantidad]) => ({
          variante_id: parseInt(varianteId),
          nueva_cantidad: parseInt(nuevaCantidad),
        }))

      const res = await ajusteMasivo({
        deposito_id: parseInt(depositoId),
        items: itemsData,
        observaciones_generales: obs || 'Ajuste masivo de inventario',
      })
      setResultado(res)
      setItems({})
    } catch (e) {
      alert('Error al guardar: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setGuardando(false)
    }
  }

  const stocksFiltrados = stocks.filter(s => {
    if (!busqueda) return true
    const term = busqueda.toLowerCase()
    return (
      s.codigo?.toLowerCase().includes(term) ||
      s.nombre_completo?.toLowerCase().includes(term) ||
      s.marca?.toLowerCase().includes(term)
    )
  })

  if (resultado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h2 className="text-xl font-bold text-green-700 mb-2">Ajuste masivo completado</h2>
          <div className="grid grid-cols-3 gap-4 my-5 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{resultado.procesados}</p>
              <p className="text-xs text-gray-500">Procesados</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600">
                {resultado.resultados?.filter(r => r.ajustado).length ?? 0}
              </p>
              <p className="text-xs text-gray-500">Ajustados</p>
            </div>
            <div className={`${resultado.errores > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-3`}>
              <p className={`text-2xl font-bold ${resultado.errores > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {resultado.errores}
              </p>
              <p className="text-xs text-gray-500">Errores</p>
            </div>
          </div>
          {resultado.detalle_errores?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 text-left mb-4 text-sm">
              <p className="font-semibold text-red-700 mb-1">Errores:</p>
              {resultado.detalle_errores.map((e, i) => (
                <p key={i} className="text-red-600">• Variante #{e.variante_id}: {e.error}</p>
              ))}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setResultado(null)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Hacer otro ajuste
            </button>
            <Link
              to="/inventario"
              className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110"
            >
              Ir a Inventario
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">Ajuste Masivo de Stock</h1>
          <p className="text-sm text-gray-500">
            Editá la nueva cantidad de cada producto. Solo se guardan los campos que modifiques.
          </p>
        </div>
        <Link to="/inventario/avanzado" className="text-brand-blue text-sm underline">← Inventario avanzado</Link>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
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
          <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
          <input
            type="text" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ej: Corrección conteo anual"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando || cambiosCount === 0}
          className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : `Guardar ${cambiosCount > 0 ? `(${cambiosCount})` : ''}`}
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-3">
        <input
          type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por código, nombre o marca..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <span className="ml-3 text-sm text-gray-400">{stocksFiltrados.length} productos</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargandoStocks ? (
          <div className="text-center py-10 text-gray-400">Cargando productos...</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-blue-dark text-white text-xs uppercase">
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-center">Stock actual</th>
                <th className="px-3 py-2 text-center">Nueva cantidad</th>
              </tr>
            </thead>
            <tbody>
              {stocksFiltrados.map(s => {
                const vid = String(s.variante)
                const editado = items[vid] !== undefined && items[vid] !== ''
                return (
                  <tr key={s.id} className={`border-b ${editado ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-2 font-mono text-xs">{s.codigo}</td>
                    <td className="px-3 py-2">{s.nombre_completo}</td>
                    <td className="px-3 py-2 text-gray-500">{s.marca}</td>
                    <td className="px-3 py-2 text-center font-bold">{s.cantidad}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={items[vid] ?? ''}
                        onChange={e => handleCantidad(vid, e.target.value)}
                        placeholder={String(s.cantidad)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </td>
                  </tr>
                )
              })}
              {stocksFiltrados.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {cambiosCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-brand-blue text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span className="font-medium">{cambiosCount} cambio(s) pendiente(s)</span>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-white text-brand-blue px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar ahora'}
          </button>
        </div>
      )}
    </div>
  )
}
