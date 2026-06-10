import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { tiendaApi } from '../../services/api'

const STORAGE_KEY = 'avila_moto'

const MotoIcon = () => (
  <svg className="w-12 h-12 text-brand-blue/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
)

const ChevronDown = () => (
  <svg className="w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

function SelectField({ label, value, onChange, disabled, placeholder, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border-2 border-white/15 bg-white/8 text-white
                     pl-4 pr-9 py-3 text-sm font-medium
                     focus:outline-none focus:border-brand-blue/70 focus:ring-0
                     disabled:opacity-40 disabled:cursor-not-allowed
                     appearance-none cursor-pointer
                     transition-colors duration-200
                     hover:border-white/30
                     [background:rgba(255,255,255,0.06)]"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <option value="" style={{ background: '#1C1C26', color: '#9CA3AF' }}>{placeholder}</option>
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown />
        </div>
      </div>
    </div>
  )
}

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
    modelos.filter(m => m.marca === marcaSel && m.modelo === modeloSel).map(m => m.anio).sort((a, b) => b - a),
    [modelos, marcaSel, modeloSel]
  )
  const modeloId = useMemo(() => {
    if (!marcaSel || !modeloSel || !anioSel) return null
    return modelos.find(m => m.marca === marcaSel && m.modelo === modeloSel && m.anio === parseInt(anioSel))?.id ?? null
  }, [modelos, marcaSel, modeloSel, anioSel])

  useEffect(() => {
    if (marcaSel || modeloSel || anioSel) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ marcaSel, modeloSel, anioSel }))
    }
  }, [marcaSel, modeloSel, anioSel])

  function handleMarcaChange(val) { setMarcaSel(val); setModeloSel(''); setAnioSel('') }
  function handleModeloChange(val) { setModeloSel(val); setAnioSel('') }

  function handleBuscar() {
    if (!modeloId) return
    navigate(`/catalogo?modelo=${modeloId}&moto=${encodeURIComponent(`${marcaSel} ${modeloSel} ${anioSel}`)}`)
  }

  function handleLimpiar() {
    setMarcaSel(''); setModeloSel(''); setAnioSel('')
    localStorage.removeItem(STORAGE_KEY)
  }

  if (!loading && modelos.length === 0) return null

  const motoSeleccionada = marcaSel && modeloSel && anioSel ? `${marcaSel} ${modeloSel} ${anioSel}` : null
  const progreso = [marcaSel, modeloSel, anioSel].filter(Boolean).length

  return (
    <section className="relative bg-carbon carbon-pattern overflow-hidden" id="buscador-moto">
      {/* Líneas decorativas de velocidad */}
      <div className="absolute inset-0 speed-lines opacity-40 pointer-events-none" />

      {/* Halo rojo de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px]
                      bg-red-glow opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-blue/20 border border-brand-blue/30
                          text-brand-blue text-xs font-black px-4 py-1.5 rounded-full mb-4
                          uppercase tracking-[0.15em]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Buscador por compatibilidad
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            Encontrá el repuesto{' '}
            <span className="text-gradient-red">exacto</span>{' '}
            para tu moto
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Seleccioná marca, modelo y año para ver todos los productos compatibles al instante.
          </p>
        </div>

        {/* Moto ya seleccionada */}
        {motoSeleccionada && modeloId ? (
          <div className="mb-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-2xl
                          flex flex-col sm:flex-row items-center gap-4 animate-slide-down">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/30
                              flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🏍️</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Tu moto seleccionada</p>
                <p className="text-white font-black text-lg">{motoSeleccionada}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleBuscar}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold
                           px-6 py-2.5 rounded-xl text-sm transition-all duration-200
                           hover:-translate-y-0.5 hover:shadow-red-glow-sm active:scale-95"
              >
                Ver repuestos →
              </button>
              <button
                onClick={handleLimpiar}
                className="text-gray-400 hover:text-white border border-white/20 hover:border-white/40
                           px-3 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-95"
                title="Cambiar moto"
              >
                Cambiar ✕
              </button>
            </div>
          </div>
        ) : (
          /* Barra de progreso */
          progreso > 0 && (
            <div className="mb-5 flex items-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < progreso ? 'bg-brand-blue' : 'bg-white/10'}`} />
              ))}
              <span className="text-xs text-gray-500 ml-1">{progreso}/3</span>
            </div>
          )
        )}

        {/* Selects */}
        {!(motoSeleccionada && modeloId) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SelectField
              label="Marca"
              value={marcaSel}
              onChange={handleMarcaChange}
              disabled={loading || modelos.length === 0}
              placeholder="Seleccioná marca"
            >
              {marcas.map(m => <option key={m} value={m} className="bg-plate">{m}</option>)}
            </SelectField>

            <SelectField
              label="Modelo"
              value={modeloSel}
              onChange={handleModeloChange}
              disabled={!marcaSel}
              placeholder={marcaSel ? 'Seleccioná modelo' : '— primero elegí marca —'}
            >
              {modelosParaMarca.map(m => <option key={m} value={m} className="bg-plate">{m}</option>)}
            </SelectField>

            <SelectField
              label="Año"
              value={anioSel}
              onChange={setAnioSel}
              disabled={!modeloSel}
              placeholder={modeloSel ? 'Seleccioná año' : '— primero elegí modelo —'}
            >
              {aniosParaModelo.map(a => <option key={a} value={a} className="bg-plate">{a}</option>)}
            </SelectField>
          </div>
        )}

        {/* Botón buscar */}
        {!(motoSeleccionada && modeloId) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBuscar}
              disabled={!modeloId}
              className="bg-brand-blue hover:bg-brand-blue-dark disabled:bg-white/5 disabled:text-gray-600
                         text-white font-black px-10 py-4 rounded-xl text-base
                         transition-all duration-200 hover:-translate-y-0.5 hover:shadow-red-glow
                         active:scale-95 disabled:cursor-not-allowed disabled:transform-none
                         disabled:shadow-none flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              {modeloId ? `Buscar repuestos para ${marcaSel} ${modeloSel}` : 'Buscar repuestos'}
            </button>

            {(marcaSel || modeloSel || anioSel) && (
              <button
                onClick={handleLimpiar}
                className="text-gray-500 hover:text-white border border-white/10 hover:border-white/30
                           px-4 py-4 rounded-xl text-sm transition-all duration-200 active:scale-95"
              >
                Limpiar selección
              </button>
            )}
          </div>
        )}

        {/* Tip si no hay datos */}
        {loading && (
          <p className="text-center text-gray-600 text-sm mt-4">Cargando modelos...</p>
        )}
      </div>
    </section>
  )
}
