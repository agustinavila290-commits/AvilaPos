import { useState, useEffect, useRef } from 'react'
import {
  getMotosAdmin, crearMoto, eliminarMoto, toggleMotoActivo, importarMotosExcel
} from '../services/inventarioService'

export default function GestionMotos() {
  const [motos, setMotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '' })
  const [guardando, setGuardando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await getMotosAdmin()
      setMotos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const motosFiltradas = motos.filter(m =>
    `${m.marca} ${m.modelo} ${m.anio}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleCrear = async (e) => {
    e.preventDefault()
    if (!form.marca.trim() || !form.modelo.trim() || !form.anio) return
    setGuardando(true)
    try {
      const nueva = await crearMoto({ marca: form.marca.trim(), modelo: form.modelo.trim(), anio: parseInt(form.anio) })
      setMotos(prev => [...prev, nueva].sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo) || a.anio - b.anio))
      setForm({ marca: '', modelo: '', anio: '' })
    } catch (e) {
      alert('Error: ' + (e?.response?.data?.error || e.message))
    } finally {
      setGuardando(false)
    }
  }

  const handleToggle = async (id) => {
    const updated = await toggleMotoActivo(id)
    setMotos(prev => prev.map(m => m.id === id ? { ...m, activo: updated.activo } : m))
  }

  const handleEliminar = async (id, label) => {
    if (!confirm(`¿Eliminar "${label}"? También se quitará de todos los productos.`)) return
    await eliminarMoto(id)
    setMotos(prev => prev.filter(m => m.id !== id))
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    setImportResult(null)
    try {
      const res = await importarMotosExcel(file)
      setImportResult(res)
      cargar()
    } catch (err) {
      alert('Error al importar: ' + (err?.response?.data?.error || err.message))
    } finally {
      setImportando(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Marcas únicas para sugerencia de autocompletado
  const marcasUnicas = [...new Set(motos.map(m => m.marca))].sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">🏍️ Catálogo de motos</h1>
          <p className="text-sm text-gray-500">Gestioná las marcas y modelos para asignar compatibilidad de productos</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importando}
            className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {importando ? 'Importando...' : '📥 Importar Excel'}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`border rounded-xl p-4 text-sm ${importResult.total_errores > 0 && importResult.creados === 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`font-semibold mb-1 ${importResult.total_errores > 0 && importResult.creados === 0 ? 'text-red-800' : 'text-green-800'}`}>
            Import completado
          </p>
          <p className="text-gray-700">
            ✅ Creados: <strong>{importResult.creados}</strong> &nbsp;|&nbsp;
            ⏭ Ya existían: <strong>{importResult.existentes}</strong> &nbsp;|&nbsp;
            ❌ Errores: <strong>{importResult.total_errores || 0}</strong>
          </p>
          {importResult.columnas_detectadas && (
            <p className="text-xs text-gray-500 mt-1">
              Columnas usadas — marca: <em>{importResult.columnas_detectadas.marca}</em>,
              modelo: <em>{importResult.columnas_detectadas.modelo}</em>,
              año: <em>{importResult.columnas_detectadas.anio}</em>
            </p>
          )}
          {importResult.errores?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Ver primeros errores</summary>
              <ul className="mt-1 space-y-0.5">
                {importResult.errores.map((e, i) => (
                  <li key={i} className="text-xs text-red-700 font-mono">
                    Fila {e.fila}: {e.marca} / {e.modelo} / {e.anio} — {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Agregar modelo</h2>
        <form onSubmit={handleCrear} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-gray-500 mb-1">Marca *</label>
            <input
              list="marcas-list"
              type="text"
              value={form.marca}
              onChange={e => setForm(p => ({ ...p, marca: e.target.value }))}
              placeholder="Honda, Yamaha..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
            <datalist id="marcas-list">
              {marcasUnicas.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-gray-500 mb-1">Modelo *</label>
            <input
              type="text"
              value={form.modelo}
              onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))}
              placeholder="CG 150, FZ 2.0..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Año *</label>
            <input
              type="number"
              min="1990" max="2035"
              value={form.anio}
              onChange={e => setForm(p => ({ ...p, anio: e.target.value }))}
              placeholder="2022"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {guardando ? '...' : '+ Agregar'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-2">
          Para carga masiva usá "Importar Excel" con columnas: <span className="font-mono">marca | modelo | anio</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            type="search"
            placeholder="Buscar marca, modelo o año..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <p className="text-xs text-gray-400 mt-1">{motosFiltradas.length} modelos</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Cargando...</div>
        ) : motosFiltradas.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Sin resultados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-4 py-2 text-left">Marca</th>
                <th className="px-4 py-2 text-left">Modelo</th>
                <th className="px-4 py-2 text-center">Año</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {motosFiltradas.map(m => (
                <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold">{m.marca}</td>
                  <td className="px-4 py-2">{m.modelo}</td>
                  <td className="px-4 py-2 text-center font-mono">{m.anio}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleToggle(m.id)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${m.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleEliminar(m.id, `${m.marca} ${m.modelo} ${m.anio}`)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Eliminar
                    </button>
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
