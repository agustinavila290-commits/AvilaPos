import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrden, getProveedores, createProveedor } from '../services/comprasService'
import productosService from '../services/productosService'
import { getDepositos } from '../services/inventarioService'

const DEBOUNCE = 200

export default function NuevaOrdenCompra() {
  const navigate = useNavigate()
  const [proveedores, setProveedores] = useState([])
  const [depositos, setDepositos] = useState([])
  const [proveedorId, setProveedorId] = useState('')
  const [depositoId, setDepositoId] = useState('')
  const [fechaEsperada, setFechaEsperada] = useState('')
  const [numeroReferencia, setNumeroReferencia] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [notasProveedor, setNotasProveedor] = useState('')
  const [items, setItems] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [modalProveedor, setModalProveedor] = useState(false)
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', telefono: '', email: '' })
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    Promise.all([
      getProveedores({ activo: true, page_size: 200 }),
      getDepositos(),
    ]).then(([p, d]) => {
      const provList = Array.isArray(p) ? p : (p?.results || [])
      setProveedores(provList)
      setDepositos(d)
      if (d.length > 0) setDepositoId(String(d[0].id))
    })
  }, [])

  const buscarProductos = useCallback(async (term) => {
    if (!term.trim()) { setResultados([]); return }
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setBuscando(true)
    try {
      const data = await productosService.search(term, { page_size: 20, signal: abortRef.current.signal })
      setResultados(data?.results || data || [])
    } catch (e) {
      if (e.code !== 'ERR_CANCELED') setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarProductos(busqueda), DEBOUNCE)
    return () => clearTimeout(debounceRef.current)
  }, [busqueda, buscarProductos])

  const agregarItem = (variante) => {
    if (items.some(i => i.variante_id === variante.id)) return
    setItems(prev => [...prev, {
      variante_id: variante.id,
      codigo: variante.codigo,
      nombre: variante.nombre_completo,
      costo_actual: parseFloat(variante.costo || 0),
      cantidad_pedida: 1,
      costo_estimado: parseFloat(variante.costo || 0) || '',
    }])
    setBusqueda('')
    setResultados([])
  }

  const actualizarItem = (idx, campo, valor) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it))
  }

  const quitarItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const totalEstimado = items.reduce((sum, it) => {
    const q = parseInt(it.cantidad_pedida) || 0
    const c = parseFloat(it.costo_estimado) || 0
    return sum + q * c
  }, 0)

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre.trim()) return
    try {
      const p = await createProveedor(nuevoProveedor)
      setProveedores(prev => [...prev, p])
      setProveedorId(String(p.id))
      setModalProveedor(false)
      setNuevoProveedor({ nombre: '', telefono: '', email: '' })
    } catch (e) {
      alert('Error: ' + (e?.response?.data?.nombre?.[0] || e.message))
    }
  }

  const handleGuardar = async () => {
    setError('')
    if (!proveedorId) { setError('Seleccioná un proveedor.'); return }
    if (!depositoId) { setError('Seleccioná un depósito.'); return }
    if (items.length === 0) { setError('Agregá al menos un producto.'); return }

    setGuardando(true)
    try {
      const payload = {
        proveedor_id: parseInt(proveedorId),
        deposito_id: parseInt(depositoId),
        fecha_esperada: fechaEsperada || null,
        numero_referencia: numeroReferencia || null,
        observaciones: observaciones || null,
        notas_proveedor: notasProveedor || null,
        items: items.map(it => ({
          variante_id: it.variante_id,
          cantidad_pedida: parseInt(it.cantidad_pedida) || 1,
          costo_estimado: parseFloat(it.costo_estimado) || null,
        })),
      }
      const orden = await createOrden(payload)
      navigate(`/compras/ordenes/${orden.id}`)
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.detail || 'Error al crear la orden.')
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-blue-dark">Nueva Orden de Compra</h1>
          <p className="text-sm text-gray-500">Creá un pedido a un proveedor antes de recibir la mercadería</p>
        </div>
        <Link to="/compras/ordenes" className="text-brand-blue text-sm underline">← Órdenes</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario izquierdo */}
        <div className="lg:col-span-1 space-y-4">
          {/* Proveedor */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Proveedor</h2>
            <select
              value={proveedorId}
              onChange={e => setProveedorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue mb-2"
            >
              <option value="">Seleccioná un proveedor...</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button
              onClick={() => setModalProveedor(true)}
              className="text-xs text-brand-blue underline"
            >
              + Nuevo proveedor
            </button>
          </div>

          {/* Depósito y fechas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-700">Detalles</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Depósito de destino</label>
              <select
                value={depositoId}
                onChange={e => setDepositoId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha esperada de entrega</label>
              <input
                type="date" value={fechaEsperada} onChange={e => setFechaEsperada(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">N° referencia proveedor</label>
              <input
                type="text" value={numeroReferencia} onChange={e => setNumeroReferencia(e.target.value)}
                placeholder="Ej: cotización #001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Observaciones internas</label>
              <textarea
                value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={2} placeholder="Notas internas..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas para el proveedor</label>
              <textarea
                value={notasProveedor} onChange={e => setNotasProveedor(e.target.value)}
                rows={2} placeholder="Se imprimirán en la orden..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-brand-blue-dark text-white rounded-xl p-4">
            <p className="text-xs opacity-70 mb-1">Total estimado</p>
            <p className="text-2xl font-bold">${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs opacity-70 mt-1">{items.length} producto(s)</p>
          </div>

          {error && <p className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">{error}</p>}

          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full bg-brand-green text-white py-2.5 rounded-lg font-semibold text-sm hover:brightness-110 disabled:opacity-50"
          >
            {guardando ? 'Creando...' : 'Crear orden de compra'}
          </button>
        </div>

        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Buscador */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Agregar productos</h2>
            <input
              type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por código, nombre o marca..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            {buscando && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
            {resultados.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {resultados.map(v => (
                  <button
                    key={v.id}
                    onClick={() => agregarItem(v)}
                    disabled={items.some(i => i.variante_id === v.id)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="font-mono text-xs text-gray-400 mr-2">{v.codigo}</span>
                    <span className="font-medium">{v.nombre_completo}</span>
                    <span className="ml-2 text-gray-400 text-xs">— ${parseFloat(v.costo || 0).toLocaleString('es-AR')}</span>
                    {items.some(i => i.variante_id === v.id) && <span className="ml-2 text-green-500 text-xs">✓ Ya agregado</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Buscá productos arriba para agregarlos a la orden
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-center">Cant. pedida</th>
                    <th className="px-3 py-2 text-right">Costo estimado</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const subtotal = (parseInt(it.cantidad_pedida) || 0) * (parseFloat(it.costo_estimado) || 0)
                    return (
                      <tr key={it.variante_id} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{it.codigo}</td>
                        <td className="px-3 py-2 text-sm">{it.nombre}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number" min="1" value={it.cantidad_pedida}
                            onChange={e => actualizarItem(idx, 'cantidad_pedida', e.target.value)}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number" min="0" step="0.01" value={it.costo_estimado}
                            onChange={e => actualizarItem(idx, 'costo_estimado', e.target.value)}
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => quitarItem(idx)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-3 py-2 text-right font-semibold text-sm">Total estimado:</td>
                    <td className="px-3 py-2 text-right font-bold text-brand-blue">
                      ${totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal nuevo proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-4">Nuevo Proveedor</h3>
            <div className="space-y-3">
              <input
                type="text" placeholder="Nombre *" value={nuevoProveedor.nombre}
                onChange={e => setNuevoProveedor(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="text" placeholder="Teléfono" value={nuevoProveedor.telefono}
                onChange={e => setNuevoProveedor(p => ({ ...p, telefono: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="email" placeholder="Email" value={nuevoProveedor.email}
                onChange={e => setNuevoProveedor(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setModalProveedor(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancelar</button>
              <button
                onClick={handleCrearProveedor}
                disabled={!nuevoProveedor.nombre.trim()}
                className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
