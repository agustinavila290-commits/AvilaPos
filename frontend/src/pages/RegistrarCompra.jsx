/**
 * Página para registrar compras (solo admin) - Soft UI
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCompra, getProveedores, createProveedor, subirAdjuntoFactura } from '../services/comprasService';
import { getDepositoPrincipal } from '../services/inventarioService';
import productosService from '../services/productosService';
import SoftCard from '../components/SoftCard';

const DEBOUNCE_MS = 200;

export default function RegistrarCompra() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado principal
  const [proveedor, setProveedor] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [deposito, setDeposito] = useState(null);
  const [items, setItems] = useState([]);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaCompra, setFechaCompra] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // UI
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Modal crear proveedor
  const [modalProveedor, setModalProveedor] = useState(false);
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    razon_social: '',
    cuit: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: ''
  });
  const [savingProveedor, setSavingProveedor] = useState(false);
  const [errorProveedor, setErrorProveedor] = useState('');
  // Imágenes de facturas (antes de enviar; después se suben a la compra creada)
  const [imagenesFactura, setImagenesFactura] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [provs, dep] = await Promise.all([
        getProveedores(),
        getDepositoPrincipal()
      ]);
      const lista = Array.isArray(provs) ? provs : (provs?.results ?? []);
      setProveedores(lista);
      setDeposito(dep);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setProveedores([]);
    }
  };

  const searchAbortRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const runSearchProducto = useCallback(async (term) => {
    const t = (typeof term === 'string' ? term : '').trim();
    if (!t) return;
    setError('');
    setBusquedaRealizada(false);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    const signal = searchAbortRef.current.signal;
    setBuscandoProducto(true);
    try {
      const data = await productosService.search(t, { page_size: 40, signal });
      if (signal?.aborted) return;
      const resultados = data.results || data;
      setProductosEncontrados(Array.isArray(resultados) ? resultados : []);
      setBusquedaRealizada(true);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error al buscar producto:', err);
      setError('Error al buscar producto');
      setBusquedaRealizada(true);
    } finally {
      setBuscandoProducto(false);
    }
  }, []);

  // Debounce: al dejar de escribir, buscar tras DEBOUNCE_MS
  useEffect(() => {
    const term = busquedaProducto.trim();
    if (!term) return;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      runSearchProducto(term);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [busquedaProducto, runSearchProducto]);

  const buscarProducto = (e) => {
    e?.preventDefault?.();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    runSearchProducto(busquedaProducto);
  };

  const handleBusquedaProductoBlur = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (busquedaProducto.trim()) runSearchProducto(busquedaProducto);
  };

  const agregarItem = (variante) => {
    // Verificar si ya está en la lista
    const existe = items.find(item => item.variante.id === variante.id);
    
    if (existe) {
      setError('El producto ya está agregado a la compra');
      return;
    }
    
    // Agregar nuevo
    setItems([...items, {
      variante,
      cantidad: 1,
      costo_unitario: variante.costo || 0,
      precio_venta_sugerido: variante.precio_venta || 0,
      actualizar_costo: true,
      actualizar_precio: false
    }]);
    
    // Limpiar búsqueda
    setBusquedaProducto('');
    setProductosEncontrados([]);
    setBusquedaRealizada(false);
    setError('');
  };

  // Si volvemos de crear un producto, agregarlo a la compra
  useEffect(() => {
    const varianteCreada = location.state?.varianteRecienCreada;
    if (!varianteCreada?.id) return;
    const variante = {
      ...varianteCreada,
      nombre_completo: varianteCreada.nombre_completo || varianteCreada.nombre_variante || varianteCreada.codigo || '',
      precio_venta: varianteCreada.precio_venta ?? varianteCreada.precio_mostrador ?? 0
    };
    setItems(prev => {
      if (prev.some(item => item.variante.id === variante.id)) return prev;
      return [...prev, {
        variante,
        cantidad: 1,
        costo_unitario: variante.costo ?? 0,
        precio_venta_sugerido: variante.precio_venta ?? 0,
        actualizar_costo: true,
        actualizar_precio: false
      }];
    });
    setBusquedaProducto('');
    setProductosEncontrados([]);
    setBusquedaRealizada(false);
    setError('');
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state]);

  const actualizarItem = (index, campo, valor) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [campo]: valor };
        // Recalcular subtotal si cambió cantidad o costo
        if (campo === 'cantidad' || campo === 'costo_unitario') {
          updated.subtotal = parseFloat(updated.cantidad) * parseFloat(updated.costo_unitario);
        }
        return updated;
      }
      return item;
    }));
  };

  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return items.reduce((acc, item) => {
      return acc + (parseFloat(item.cantidad) * parseFloat(item.costo_unitario));
    }, 0);
  };

  const validarCompra = () => {
    if (!proveedor) {
      return 'Debe seleccionar un proveedor';
    }
    if (items.length === 0) {
      return 'Debe agregar al menos un producto';
    }
    if (!deposito) {
      return 'No hay depósito configurado';
    }
    return null;
  };

  const abrirModalProveedor = () => {
    setFormProveedor({
      nombre: '',
      razon_social: '',
      cuit: '',
      telefono: '',
      email: '',
      direccion: '',
      observaciones: ''
    });
    setErrorProveedor('');
    setModalProveedor(true);
  };

  const crearProveedor = async (e) => {
    e.preventDefault();
    const nombre = (formProveedor.nombre || '').trim();
    if (!nombre) {
      setErrorProveedor('El nombre del proveedor es obligatorio');
      return;
    }
    setSavingProveedor(true);
    setErrorProveedor('');
    try {
      const nuevo = await createProveedor({
        nombre,
        razon_social: (formProveedor.razon_social || '').trim() || null,
        cuit: (formProveedor.cuit || '').trim().replace(/\s+/g, '') || null,
        telefono: (formProveedor.telefono || '').trim() || null,
        email: (formProveedor.email || '').trim() || null,
        direccion: (formProveedor.direccion || '').trim() || null,
        observaciones: (formProveedor.observaciones || '').trim() || null,
        activo: true
      });
      setProveedores(prev => [...prev, nuevo]);
      setProveedor(String(nuevo.id));
      setModalProveedor(false);
    } catch (err) {
      const data = err.response?.data || {};
      const msg = typeof data === 'string' ? data
        : data.nombre?.[0] || data.razon_social?.[0] || data.cuit?.[0] || data.email?.[0]
        || (typeof data.detail === 'string' ? data.detail : null)
        || 'Error al crear el proveedor';
      setErrorProveedor(msg);
    } finally {
      setSavingProveedor(false);
    }
  };

  const agregarImagenesFactura = (e) => {
    const files = Array.from(e.target.files || []);
    const validos = files.filter(f => f.type.startsWith('image/'));
    setImagenesFactura(prev => [...prev, ...validos]);
    e.target.value = '';
  };

  const quitarImagenFactura = (index) => {
    setImagenesFactura(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errorValidacion = validarCompra();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const compraData = {
        proveedor_id: parseInt(proveedor),
        deposito_id: deposito.id,
        numero_factura: numeroFactura.trim() || null,
        fecha_compra: fechaCompra || null,
        observaciones: observaciones.trim() || null,
        items: items.map(item => ({
          variante_id: item.variante.id,
          cantidad: parseInt(item.cantidad),
          costo_unitario: parseFloat(item.costo_unitario),
          precio_venta_sugerido: item.precio_venta_sugerido ? parseFloat(item.precio_venta_sugerido) : null,
          actualizar_costo: item.actualizar_costo,
          actualizar_precio: item.actualizar_precio
        }))
      };
      
      const response = await createCompra(compraData);
      const compraId = response.id;

      // Subir imágenes de facturas (el backend las comprime)
      if (imagenesFactura.length > 0) {
        for (const file of imagenesFactura) {
          try {
            await subirAdjuntoFactura(compraId, file);
          } catch (errImg) {
            console.error('Error subiendo imagen de factura:', errImg);
          }
        }
      }

      // Redirigir a detalle de compra
      setTimeout(() => {
        navigate(`/compras/${compraId}`);
      }, 500);
    } catch (err) {
      console.error('Error al crear compra:', err);
      setError(err.response?.data?.error || 'Error al registrar la compra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">➕ Registrar Compra</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Registrar una nueva compra a proveedor</p>
        </div>
        <button
          onClick={() => navigate('/compras')}
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          Volver
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Columna izquierda: Productos */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Búsqueda de productos - Soft UI */}
          <SoftCard title="Buscar Producto" icon="🔍">
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => { setBusquedaProducto(e.target.value); setBusquedaRealizada(false); }}
                onBlur={handleBusquedaProductoBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarProducto(e); } }}
                placeholder="SKU, código de barras, nombre..."
                className="flex-1 min-w-[180px] search-input"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={buscarProducto}
                  disabled={buscandoProducto}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {buscandoProducto ? 'Buscando...' : 'Buscar'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/productos/nuevo', { state: { returnTo: '/compras/registrar' } })}
                  className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold"
                >
                  Crear producto
                </button>
              </div>
            </div>
            {/* Sin resultados: ofrecer crear producto con ese código */}
            {busquedaRealizada && productosEncontrados.length === 0 && busquedaProducto.trim() && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                <p className="text-sm text-amber-800 mb-2">No se encontró ningún producto con &quot;{busquedaProducto.trim()}&quot;.</p>
                <button
                  type="button"
                  onClick={() => navigate('/productos/nuevo', { state: { codigoInicial: busquedaProducto.trim(), returnTo: '/compras/registrar' } })}
                  className="text-amber-800 font-semibold underline hover:no-underline"
                >
                  Crear producto con código {busquedaProducto.trim()}
                </button>
              </div>
            )}
            
            {/* Resultados de búsqueda - tabla alineada con Productos */}
            {productosEncontrados.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-72 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Variante</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Marca</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Costo</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Precio</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">P. Tarjeta</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Stock</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {productosEncontrados.map((variante) => (
                      <tr
                        key={variante.id}
                        onClick={() => agregarItem(variante)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-800 truncate">
                          {variante.codigo}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-800 truncate min-w-0">
                          {variante.producto_nombre ?? variante.producto_base?.nombre ?? '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate min-w-0">
                          {variante.nombre_variante ?? '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate">
                          {variante.marca_nombre || variante.producto_base?.marca?.nombre || '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                          ${parseFloat(variante.costo ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600">
                          ${parseFloat(variante.precio_mostrador ?? variante.precio_venta ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-blue-600">
                          ${parseFloat(variante.precio_tarjeta ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg ${
                            (variante.stock_actual || 0) <= 2 ? 'bg-red-100 text-red-700 border border-red-200'
                              : (variante.stock_actual || 0) <= 5 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {variante.stock_actual ?? 0}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); agregarItem(variante); }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SoftCard>

          {/* Lista de items - Soft UI */}
          <SoftCard title={`Productos (${items.length})`} icon="📦">
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay productos agregados. Busca y agrega productos arriba.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.variante.codigo}</p>
                        <p className="text-sm text-gray-600">{item.variante.nombre_completo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Costo Unit.</label>
                        <input
                          type="number"
                          value={item.costo_unitario}
                          onChange={(e) => actualizarItem(index, 'costo_unitario', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Precio Venta</label>
                        <input
                          type="number"
                          value={item.precio_venta_sugerido}
                          onChange={(e) => actualizarItem(index, 'precio_venta_sugerido', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Subtotal</label>
                        <p className="px-2 py-1 text-sm font-semibold text-gray-900 bg-gray-50 rounded">
                          ${(item.cantidad * item.costo_unitario).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.actualizar_costo}
                          onChange={(e) => actualizarItem(index, 'actualizar_costo', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-700">Actualizar costo del producto</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.actualizar_precio}
                          onChange={(e) => actualizarItem(index, 'actualizar_precio', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-700">Actualizar precio de venta</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SoftCard>
        </div>

        {/* Columna derecha: Datos de la compra - Soft UI */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Proveedor */}
          <SoftCard title="Proveedor *" icon="🏢">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
              >
                <option value="">Seleccionar proveedor...</option>
                {(Array.isArray(proveedores) ? proveedores : []).map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={abrirModalProveedor}
                className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold whitespace-nowrap"
              >
                Crear proveedor
              </button>
            </div>
          </SoftCard>

          {/* Número de factura e imágenes */}
          <SoftCard title="Factura" icon="🧾">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Factura
            </label>
            <input
              type="text"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              placeholder="Ej: 0001-00001234"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 shadow-sm mb-3"
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes de facturas (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Adjuntá fotos o escaneos de las facturas. Se comprimen para ahorrar espacio. Podés descargarlas desde el detalle de la compra.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={agregarImagenesFactura}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagenesFactura.length > 0 && (
              <ul className="mt-3 space-y-2">
                {imagenesFactura.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                    <span className="truncate text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => quitarImagenFactura(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SoftCard>

          {/* Fecha de compra */}
          <SoftCard title="Fecha de Compra" icon="📅">
            <input
              type="date"
              value={fechaCompra}
              onChange={(e) => setFechaCompra(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
            />
          </SoftCard>

          {/* Observaciones */}
          <SoftCard title="Observaciones" icon="📝">
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 shadow-sm"
              placeholder="Notas adicionales..."
            />
          </SoftCard>

          {/* Total */}
          <SoftCard title="Total" icon="💰">
            <div className="text-center py-2">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                ${calcularTotal().toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} producto{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </SoftCard>

          {/* Botón - Soft UI */}
          <button
            type="submit"
            disabled={submitting || items.length === 0 || !proveedor}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 md:py-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 hover:-translate-y-1 font-bold text-sm sm:text-base transition-all duration-200 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? 'Registrando...' : 'Registrar Compra'}
          </button>
        </div>
      </form>

      {/* Modal Crear proveedor - Soft UI */}
      {modalProveedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !savingProveedor && setModalProveedor(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6">🏢 Nuevo proveedor</h3>
            {errorProveedor && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 shadow-sm">{errorProveedor}</div>
            )}
            <form onSubmit={crearProveedor} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Razón social</label>
                <input
                  type="text"
                  value={formProveedor.razon_social}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, razon_social: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="Razón social"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CUIT</label>
                <input
                  type="text"
                  value={formProveedor.cuit}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, cuit: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="20-12345678-9"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formProveedor.telefono}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="Teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formProveedor.email}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  placeholder="Dirección"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={formProveedor.observaciones}
                  onChange={(e) => setFormProveedor(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                  rows={2}
                  placeholder="Notas..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProveedor}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {savingProveedor ? 'Guardando...' : 'Crear proveedor'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalProveedor(false)}
                  disabled={savingProveedor}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
