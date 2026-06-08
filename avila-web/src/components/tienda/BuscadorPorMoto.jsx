import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'

const STORAGE_KEY = 'avila_moto'

export default function BuscadorPorMoto() {
  const navigate = useNavigate()
  const [modelos, setModelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [marcaSel, setMarcaSel] = useState('')
  const [modeloSel, setModeloSel] = useState('')
  const [anioSel, setAnioSel] = useState('')

  useEffect(() => {
    tiendaApi.getModelosMoto()
      .then(r => {
        setModelos(r.data)
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
          if (saved.marcaSel) setMarcaSel(saved.marcaSel)
          if (saved.modeloSel) setModeloSel(saved.modeloSel)
          if (saved.anioSel) setAnioSel(saved.anioSel)
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const marcas = useMemo(() => [...new Set(modelos.map(m => m.marca))].sort(), [modelos])

  const modelosParaMarca = useMemo(() =>
    [...new Set(modelos.filter(m => m.marca === marcaSel).map(m => m.modelo))].sort(),
    [modelos, marcaSel]
  )

  const aniosParaModelo = useMemo(() =>
    modelos
      .filter(m => m.marca === marcaSel && m.modelo === modeloSel)
      .map(m => m.anio)
      .sort((a, b) => b - a),
    [modelos, marcaSel, modeloSel]
  )

  const modeloId = useMemo(() => {
    if (!marcaSel || !modeloSel || !anioSel) return null
    const found = modelos.find(
      m => m.marca === marcaSel && m.modelo === modeloSel && m.anio === parseInt(anioSel)
    )
    return found ? found.id : null
  }, [modelos, marcaSel, modeloSel, anioSel])

  useEffect(() => {
    if (marcaSel || modeloSel || anioSel) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ marcaSel, modeloSel, anioSel }))
    }
  }, [marcaSel, modeloSel, anioSel])

  function handleMarcaChange(val) {
    setMarcaSel(val)
    setModeloSel('')
    setAnioSel('')
  }

  function handleModeloChange(val) {
    setModeloSel(val)
    setAnioSel('')
  }

  function handleBuscar() {
    if (!modeloId) return
    const motoLabel = encodeURIComponent(`${marcaSel} ${modeloSel} ${anioSel}`)
    navigate(`/catalogo?modelo=${modeloId}&moto=${motoLabel}`)
  }

  function handleLimpiar() {
    setMarcaSel('')
    setModeloSel('')
    setAnioSel('')
    localStorage.removeItem(STORAGE_KEY)
  }

  if (!loading && modelos.length === 0) return null

  return (
    <section className="bg-brand-blue-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-white font-bold text-lg text-center mb-1">
          Encontrá repuestos para tu moto
        </p>
        <p className="text-blue-200 text-sm text-center mb-5">
          Seleccioná tu moto y te mostramos los productos compatibles
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-end justify-center">
          {/* Marca */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-blue-200 mb-1">Marca</label>
            <select
              value={marcaSel}
              onChange={e => handleMarcaChange(e.target.value)}
              disabled={loading || modelos.length === 0}
              className="w-full rounded-xl border border-blue-400 bg-blue-900/60 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40"
            >
              <option value="">Marca de moto</option>
              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Modelo */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-blue-200 mb-1">Modelo</label>
            <select
              value={modeloSel}
              onChange={e => handleModeloChange(e.target.value)}
              disabled={!marcaSel || loading}
              className="w-full rounded-xl border border-blue-400 bg-blue-900/60 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40"
            >
              <option value="">Modelo</option>
              {modelosParaMarca.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Año */}
          <div className="w-full sm:w-32">
            <label className="block text-xs text-blue-200 mb-1">Año</label>
            <select
              value={anioSel}
              onChange={e => setAnioSel(e.target.value)}
              disabled={!modeloSel || loading}
              className="w-full rounded-xl border border-blue-400 bg-blue-900/60 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40"
            >
              <option value="">Año</option>
              {aniosParaModelo.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleBuscar}
              disabled={!modeloId}
              className="bg-white text-brand-blue font-bold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              Buscar →
            </button>
            {(marcaSel || modeloSel || anioSel) && (
              <button
                onClick={handleLimpiar}
                className="text-blue-300 hover:text-white transition-colors text-lg px-1"
                title="Limpiar selección"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
