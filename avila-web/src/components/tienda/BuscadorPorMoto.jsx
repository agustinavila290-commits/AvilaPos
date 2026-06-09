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

  const motoSeleccionada = marcaSel && modeloSel && anioSel
    ? `${marcaSel} ${modeloSel} ${anioSel}`
    : null

  return (
    <section className="bg-brand-dark py-8 px-4 border-b-4 border-brand-blue">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-brand-blue/20 text-brand-blue text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-brand-blue/30">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Búsqueda por compatibilidad
          </div>
          <p className="text-white font-bold text-xl mb-1">
            Encontrá repuestos compatibles con tu moto
          </p>
          <p className="text-gray-400 text-sm">
            Seleccioná marca, modelo y año para ver todos los repuestos que le corresponden
          </p>
        </div>

        {/* Moto activa seleccionada */}
        {motoSeleccionada && modeloId && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="bg-brand-blue/20 border border-brand-blue/40 text-white text-sm px-4 py-1.5 rounded-full flex items-center gap-2">
              🏍️ <span className="font-semibold">{motoSeleccionada}</span>
            </span>
            <button
              onClick={handleLimpiar}
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title="Cambiar moto"
            >
              ✕
            </button>
          </div>
        )}

        {/* Selects */}
        <div className="flex flex-col sm:flex-row gap-3 items-end justify-center">
          {/* Marca */}
          <div className="flex-1 min-w-0 w-full">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Marca de moto</label>
            <select
              value={marcaSel}
              onChange={e => handleMarcaChange(e.target.value)}
              disabled={loading || modelos.length === 0}
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-40 appearance-none"
            >
              <option value="" className="text-gray-900">Seleccioná una marca</option>
              {marcas.map(m => <option key={m} value={m} className="text-gray-900">{m}</option>)}
            </select>
          </div>

          {/* Modelo */}
          <div className="flex-1 min-w-0 w-full">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Modelo</label>
            <select
              value={modeloSel}
              onChange={e => handleModeloChange(e.target.value)}
              disabled={!marcaSel || loading}
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-40 appearance-none"
            >
              <option value="" className="text-gray-900">Seleccioná un modelo</option>
              {modelosParaMarca.map(m => <option key={m} value={m} className="text-gray-900">{m}</option>)}
            </select>
          </div>

          {/* Año */}
          <div className="w-full sm:w-32">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Año</label>
            <select
              value={anioSel}
              onChange={e => setAnioSel(e.target.value)}
              disabled={!modeloSel || loading}
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-40 appearance-none"
            >
              <option value="" className="text-gray-900">Año</option>
              {aniosParaModelo.map(a => <option key={a} value={a} className="text-gray-900">{a}</option>)}
            </select>
          </div>

          {/* Botón buscar */}
          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleBuscar}
              disabled={!modeloId}
              className="flex-1 sm:flex-none bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              Ver repuestos →
            </button>
            {(marcaSel || modeloSel || anioSel) && (
              <button
                onClick={handleLimpiar}
                className="text-gray-400 hover:text-white transition-colors px-2 text-sm border border-white/20 rounded-lg"
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
