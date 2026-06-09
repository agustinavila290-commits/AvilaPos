import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrden, getProveedores, createProveedor, previewPdfOrden } from '../services/comprasService'
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
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState('')

  // Modal nuevo proveedor
  const [modalProveedor, setModalProveedor] = useState(false)
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', telefono: '', email: '' })

  // Modal nuevo producto
  const [modalNuevoProducto, setModalNuevoProducto] = useState(false)
  const [marcas, setMarcas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false)
  const [creandoProducto, setCreandoProducto] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    codigo: '',
    nombre_variante: 'Única',
    marca_id: '',
    categoria_id: '',
    costo: '',
    precio_mostrador: '',
  })
  const [nuevaMarca, setNuevaMarca] = useState('')
  const [creandoMarca, setCreandoMarca] = useState(false)

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

  // ── Exportar PDF ─────────────────────────────────────────────────
  const exportarPDF = async () => {
    if (items.length === 0) { setError('Agregá al menos un producto para exportar el PDF.'); return }
    setExportando(true)
    setError('')
    try {
      const payload = {
        proveedor_id: proveedorId ? parseInt(proveedorId) : null,
        deposito_id: depositoId ? parseInt(depositoId) : null,
        fecha_esperada: fechaEsperada || null,
        numero_referencia: numeroReferencia || null,
        observaciones: observaciones || null,
        notas_proveedor: notasProveedor || null,
        items: items.map(it => ({
          variante_id: it.variante_id || null,
          nombre: it.nombre,
          codigo: it.codigo,
          cantidad_pedida: parseInt(it.cantidad_pedida) || 1,
          costo_estimado: parseFloat(it.costo_estimado) || null,
        })),
      }
      const blob = await previewPdfOrden(payload)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (e) {
      setError('Error al generar el PDF. Intentá de nuevo.')
    } finally {
      setExportando(false)
    }
  }

  // ── Crear proveedor ──────────────────────────────────────────────
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

  // ── Modal nuevo producto ─────────────────────────────────────────
  const abrirModalNuevoProducto = async () => {
    setNuevoProducto(prev => ({ ...prev, nombre: busqueda.trim() }))
    setModalNuevoProducto(true)
    if (marcas.length === 0) {
      setCargandoCatalogos(true)
      try {
        const [m, c] = await Promise.all([
          productosService.getMarcas({ activo: true }),
          productosService.getCategorias({ activo: true }),
        ])
        const marcasList = Array.isArray(m) ? m : (m?.results || [])
        const catsList = Array.isArray(c) ? c : (c?.results || [])
        setMarcas(marcasList)
        setCategorias(catsList)
        if (catsList.length > 0) setNuevoProducto(prev => ({ ...prev, categoria_id: String(catsList[0].id) }))
      } catch {
        // continuar sin catalogos
      } finally {
        setCargandoCatalogos(false)
      }
    }
  }

  const cerrarModalNuevoProducto = () => {
    setModalNuevoProducto(false)
    setNuevoProducto({ nombre: '', codigo: '', nombre_variante: 'Única', marca_id: '', categoria_id: '', costo: '', precio_mostrador: '' })
    setNuevaMarca('')
    setCreandoMarca(false)
  }

  const handleCrearMarca = async () => {
    if (!nuevaMarca.trim()) return
    setCreandoMarca(true)
    try {
      const m = await productosService.createMarca({ nombre: nuevaMarca.trim(), activo: true })
      setMarcas(prev => [...prev, m])
      setNuevoProducto(prev => ({ ...prev, marca_id: String(m.id) }))
      setNuevaMarca('')
    } catch (e) {
      alert('Error al crear la marca: ' + (e?.response?.data?.nombre?.[0] || e.message))
    } finally {
      setCreandoMarca(false)
    }
  }

  const handleCrearProducto = async () => {
    const { nombre, codigo, nombre_variante, marca_id, categoria_id, costo, precio_mostrador } = nuevoProducto
    if (!nombre.trim()) { alert('Ingresá el nombre del producto.'); return }
    if (!codigo.trim()) { alert('Ingresá el código del producto.'); return }
    if (!marca_id) { alert('Seleccioná o creá una marca.'); return }

    setCreandoProducto(true)
    try {
      const payload = {
        nombre: nombre.trim(),
        marca: parseInt(marca_id),
        categoria: categoria_id ? parseInt(categoria_id) : undefined,
        variantes: [{
          nombre_variante: nombre_variante.trim() || 'Única',
          codigo: codigo.trim(),
          costo: parseFloat(costo) || 0,
          precio_mostrador: parseFloat(precio_mostrador) || 0,
          activo: true,
        }],
      }
      const producto = await productosService.createProducto(payload)
      // El producto devuelto tiene variantes
      const variante = producto.variantes?.[0]
      if (variante) {
        setItems(prev => [...prev, {
          variante_id: variante.id,
          codigo: variante.codigo,
          nombre: variante.nombre_completo || `${nombre.trim()} ${nombre_variante.trim()}`.trim(),
          costo_actual: parseFloat(variante.costo || 0),
          cantidad_pedida: 1,
          costo_estimado: parseFloat(costo) || '',
        }])
      }
      cerrarModalNuevoProducto()
      setBusqueda('')
      setResultados([])
    } catch (e) {
      const errData = e?.response?.data
      const msg = errData?.variantes?.[0]?.codigo?.[0]
        || errData?.detail
        || errData?.error
        || e.message
      alert('Error al crear el producto: ' + msg)
    } finally {
      setCreandoProducto(false)
    }
  }

  // ── Guardar orden ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────
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

          {/* Botones de acción */}
          <button
            onClick={exportarPDF}
            disabled={exportando || items.length === 0}
            className="w-full bg-white border border-brand-blue text-brand-blue py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {exportando ? (
              'Generando PDF...'
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Exportar PDF
              </>
            )}
          </button>

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
                    {items.some(i => i.variante_id === v.id) && <span className="ml-2 text-green-500 text-xs">Ya agregado</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Opción crear producto cuando no hay resultados */}
            {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && (
              <div className="mt-2 border border-dashed border-orange-300 rounded-lg p-3 bg-orange-50">
                <p className="text-sm text-orange-700 mb-2">
                  No se encontró "<span className="font-semibold">{busqueda}</span>" en el inventario.
                </p>
                <button
                  onClick={abrirModalNuevoProducto}
                  className="text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-orange-600"
                >
                  + Crear nuevo producto
                </button>
              </div>
            )}

            {/* Acceso rápido a crear producto siempre visible */}
            <div className="mt-3 text-right">
              <button
                onClick={abrirModalNuevoProducto}
                className="text-xs text-gray-400 hover:text-brand-blue underline"
              >
                + Crear producto que no existe
              </button>
            </div>
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
                      <tr key={it.variante_id ?? idx} className="border-b">
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

      {/* ── Modal nuevo proveedor ──────────────────────────────────── */}
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

      {/* ── Modal nuevo producto ───────────────────────────────────── */}
      {modalNuevoProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-1">Crear nuevo producto</h3>
            <p className="text-xs text-gray-500 mb-4">El producto se agregará al inventario y quedará disponible para futuros pedidos.</p>

            {cargandoCatalogos ? (
              <p className="text-sm text-gray-400 text-center py-4">Cargando marcas y categorías...</p>
            ) : (
              <div className="space-y-3">
                {/* Nombre del producto */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del producto *</label>
                  <input
                    type="text"
                    placeholder="Ej: Filtro de aceite, Pastilla de freno..."
                    value={nuevoProducto.nombre}
                    onChange={e => setNuevoProducto(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                {/* Código */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
                  <input
                    type="text"
                    placeholder="Ej: FOA-1234"
                    value={nuevoProducto.codigo}
                    onChange={e => setNuevoProducto(p => ({ ...p, codigo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Marca *</label>
                  <select
                    value={nuevoProducto.marca_id}
                    onChange={e => setNuevoProducto(p => ({ ...p, marca_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Seleccioná una marca...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="text"
                      placeholder="Crear nueva marca..."
                      value={nuevaMarca}
                      onChange={e => setNuevaMarca(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && nuevaMarca.trim() && handleCrearMarca()}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <button
                      onClick={handleCrearMarca}
                      disabled={!nuevaMarca.trim() || creandoMarca}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                    >
                      {creandoMarca ? '...' : '+ Crear'}
                    </button>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                  <select
                    value={nuevoProducto.categoria_id}
                    onChange={e => setNuevoProducto(p => ({ ...p, categoria_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                {/* Nombre de variante */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Variante</label>
                  <input
                    type="text"
                    placeholder="Única"
                    value={nuevoProducto.nombre_variante}
                    onChange={e => setNuevoProducto(p => ({ ...p, nombre_variante: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Costo</label>
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="0.00"
                      value={nuevoProducto.costo}
                      onChange={e => setNuevoProducto(p => ({ ...p, costo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio mostrador</label>
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="0.00"
                      value={nuevoProducto.precio_mostrador}
                      onChange={e => setNuevoProducto(p => ({ ...p, precio_mostrador: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={cerrarModalNuevoProducto}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearProducto}
                disabled={creandoProducto || cargandoCatalogos || !nuevoProducto.nombre.trim() || !nuevoProducto.codigo.trim() || !nuevoProducto.marca_id}
                className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {creandoProducto ? 'Creando...' : 'Crear y agregar a la orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
