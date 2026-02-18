/**
 * Punto de Venta - Diseño POS Tradicional
 * Con atajos de teclado y precios por método de pago.
 * Búsqueda: al tipear una palabra se muestran todos los productos que la contengan (código, nombre, marca).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVenta } from '../services/ventasService';
import { getDepositoPrincipal, getStocksPorVariante } from '../services/inventarioService';
import { getConfiguracionPOS } from '../services/configuracionService';
import { procesarPagoClover } from '../services/cloverService';
import productosService from '../services/productosService';
import clientesService from '../services/clientesService';
import { useAuth } from '../hooks/useAuth';
import SeleccionarClienteModal from '../components/SeleccionarClienteModal';

export default function PuntoVentaNuevo() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const codigoInputRef = useRef(null);
  
  // Estado principal
  const [cliente, setCliente] = useState(null);
  const [deposito, setDeposito] = useState(null);
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO'); // EFECTIVO o TARJETA
  
  // Búsqueda
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [busquedaManual, setBusquedaManual] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [indiceSeleccionadoBusqueda, setIndiceSeleccionadoBusqueda] = useState(0);
  
  // Configuración POS (cliente obligatorio, etc.)
  const [clienteObligatorio, setClienteObligatorio] = useState(true);

  // UI
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalAgregarCliente, setMostrarModalAgregarCliente] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertaMargen, setAlertaMargen] = useState('');
  
  // Pago
  const [pagaCon, setPagaCon] = useState(0);

  // Clover: pago con tarjeta en dispositivo
  const [procesandoPagoClover, setProcesandoPagoClover] = useState(false);
  
  useEffect(() => {
    cargarDepositoPrincipal();
    getConfiguracionPOS().then((cfg) => {
      setClienteObligatorio(cfg.CLIENTE_OBLIGATORIO !== false);
    }).catch(() => setClienteObligatorio(true));
    codigoInputRef.current?.focus();
  }, []);
  
  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F10 - Búsqueda manual
      if (e.key === 'F10') {
        e.preventDefault();
        setMostrarResultados(true);
      }
      
      // F11 - Cambiar método de pago (Contado ↔ Tarjeta)
      if (e.key === 'F11') {
        e.preventDefault();
        cambiarMetodoPago(metodoPago === 'EFECTIVO' ? 'TARJETA' : 'EFECTIVO');
      }
      
      // F12 - Cobrar: si hay items pero falta cliente obligatorio, mostrar modal para agregar cliente
      if (e.key === 'F12') {
        e.preventDefault();
        if (items.length === 0) return;
        if (clienteObligatorio && !cliente) {
          setMostrarModalAgregarCliente(true);
          return;
        }
        handleSubmit();
      }
      
      // F4 - Cancelar venta
      if (e.key === 'F4') {
        e.preventDefault();
        if (confirm('¿Cancelar la venta actual?')) {
          limpiarVenta();
        }
      }
      
      // ESC - Cerrar búsqueda manual
      if (e.key === 'Escape') {
        setMostrarResultados(false);
        setBusquedaManual('');
        setProductosEncontrados([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, cliente, clienteObligatorio, metodoPago]);
  
  const cargarDepositoPrincipal = async () => {
    try {
      const data = await getDepositoPrincipal();
      setDeposito(data);
    } catch (err) {
      console.error('Error al cargar depósito:', err);
    }
  };
  
  // Buscar producto por código/SKU (ENTER): código exacto primero (más rápido)
  const buscarProductoPorCodigo = async (e) => {
    e.preventDefault();
    const codigo = codigoBusqueda.trim();
    if (!codigo || !deposito) return;
    
    try {
      // Si parece un solo código (sin espacios), intentar búsqueda exacta primero (1 request, muy rápida)
      const esCodigoExacto = codigo.length <= 80 && !/\s/.test(codigo);
      if (esCodigoExacto) {
        const { found, variante } = await productosService.buscarPorCodigo(codigo);
        if (found && variante) {
          await agregarItem(variante);
          setCodigoBusqueda('');
          return;
        }
      }
      // Fallback: búsqueda por texto (menos resultados = más rápido)
      const resultado = await productosService.search(codigo, { page_size: 30 });
      const variantes = resultado.results || resultado;
      
      if (variantes.length === 1) {
        await agregarItem(variantes[0]);
        setCodigoBusqueda('');
      } else if (variantes.length > 1) {
        setProductosEncontrados(variantes);
        setMostrarResultados(true);
      } else {
        setError('Producto no encontrado');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error al buscar producto:', err);
      setError('Error al buscar producto');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Búsqueda manual (F10) — backend filtra por palabras; Fuse.js reordena por relevancia
  const buscarManualmente = async (e) => {
    if (e) e.preventDefault();
    if (!busquedaManual.trim()) {
      setProductosEncontrados([]);
      return;
    }
    try {
      const data = await productosService.search(busquedaManual.trim(), { page_size: 200 });
      const raw = data.results || data;
      const lista = Array.isArray(raw) ? raw : [];
      setProductosEncontrados(lista);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setProductosEncontrados([]);
    }
  };
  
  // Búsqueda de productos: mismo criterio que Productos/RegistrarCompra (debounce, no abort en cleanup, búsqueda al salir del input)
  const searchAbortRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const DEBOUNCE_MS = 200;

  const runSearchManual = useCallback(async (term) => {
    const t = (typeof term === 'string' ? term : '').trim();
    if (!t) {
      setProductosEncontrados([]);
      return;
    }
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    const signal = searchAbortRef.current.signal;
    try {
      const data = await productosService.search(t, { page_size: 50, signal });
      if (signal?.aborted) return;
      const raw = data.results || data;
      setProductosEncontrados(Array.isArray(raw) ? raw : []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error en búsqueda:', err);
      setProductosEncontrados([]);
    }
  }, []);

  useEffect(() => {
    if (!mostrarResultados) return;
    const term = busquedaManual.trim();
    if (!term) {
      setProductosEncontrados([]);
      return;
    }
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      runSearchManual(term);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [busquedaManual, mostrarResultados, runSearchManual]);

  const handleBusquedaManualBlur = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (busquedaManual.trim()) runSearchManual(busquedaManual);
  }, [busquedaManual, runSearchManual]);

  // Al cambiar los resultados, seleccionar el primero
  useEffect(() => {
    setIndiceSeleccionadoBusqueda(0);
  }, [productosEncontrados]);

  // Hacer que el scroll acompañe la fila seleccionada con ↑↓
  useEffect(() => {
    if (!mostrarResultados || productosEncontrados.length === 0) return;
    const row = document.getElementById(`busqueda-row-${indiceSeleccionadoBusqueda}`);
    if (row) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth', inline: 'nearest' });
    }
  }, [indiceSeleccionadoBusqueda, productosEncontrados.length, mostrarResultados]);
  
  const agregarItem = async (variante) => {
    if (!deposito) {
      setError('No hay depósito configurado');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      // Usar el stock que viene en la variante (más rápido)
      let stockDisponible = variante.stock_actual || 0;
      
      // Opcionalmente, verificar stock del depósito específico
      try {
        const stocks = await getStocksPorVariante(variante.id);
        const stockDeposito = stocks.find(s => s.deposito === deposito.id);
        if (stockDeposito) {
          stockDisponible = stockDeposito.cantidad_actual || 0;
        }
      } catch {
        // Continuar con el stock general de la variante
      }
      
      // Verificar si ya está en la lista (se permite agregar aunque no haya stock)
      const itemExistente = items.find(item => item.variante.id === variante.id);
      
      const precio = getPrecioSegunMetodo(variante);
      
      if (itemExistente) {
        // Incrementar cantidad
        setItems(items.map(item =>
          item.variante.id === variante.id
            ? { 
                ...item, 
                cantidad: item.cantidad + 1,
                subtotal: (Number(item.precio_unitario) || 0) * (item.cantidad + 1)
              }
            : item
        ));
      } else {
        // Agregar nuevo item
        setItems([...items, {
          variante: {
            ...variante,
            stock_actual: stockDisponible
          },
          cantidad: 1,
          precio_unitario: Number(precio) || 0,
          subtotal: Number(precio) || 0
        }]);
      }
      
      // Cerrar resultados y limpiar
      setMostrarResultados(false);
      setProductosEncontrados([]);
      setBusquedaManual('');
      
      // Focus de vuelta al input de código
      setTimeout(() => codigoInputRef.current?.focus(), 100);
      
    } catch (err) {
      console.error('Error al agregar item:', err);
      setError('Error al agregar el producto');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Obtener precio según método de pago
  const getPrecioSegunMetodo = (variante) => {
    if (!variante) return 0;
    
    if (metodoPago === 'TARJETA') {
      return parseFloat(variante.precio_tarjeta || variante.precio_mostrador || 0);
    }
    return parseFloat(variante.precio_mostrador || 0); // EFECTIVO
  };
  
  // Cambiar cantidad de un item
  const cambiarCantidad = (varianteId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarItem(varianteId);
      return;
    }
    
    setItems(items.map(item =>
      item.variante.id === varianteId
        ? { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: (Number(item.precio_unitario) || 0) * nuevaCantidad
          }
        : item
    ));
  };
  
  // Eliminar item (DEL)
  const eliminarItem = (varianteId) => {
    setItems(items.filter(item => item.variante.id !== varianteId));
  };
  
  // Cambiar método de pago (recalcula precios)
  const cambiarMetodoPago = (nuevoMetodo) => {
    setMetodoPago(nuevoMetodo);
    
    // Recalcular todos los precios (asegurar número por si el API devuelve string)
    setItems(items.map(item => {
      const raw = nuevoMetodo === 'TARJETA' 
        ? item.variante.precio_tarjeta || item.variante.precio_mostrador
        : item.variante.precio_mostrador;
      const nuevoPrecio = Number(raw) || 0;
      return {
        ...item,
        precio_unitario: nuevoPrecio,
        subtotal: nuevoPrecio * item.cantidad
      };
    }));
  };
  
  // Calcular totales
  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };
  
  const calcularCambio = () => {
    return pagaCon - calcularTotal();
  };
  
  // Intentar cobrar: si falta cliente obligatorio, muestra modal "¿Agregar cliente?"
  const intentarCobrar = () => {
    if (items.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (clienteObligatorio && !cliente) {
      setMostrarModalAgregarCliente(true);
      return;
    }
    handleSubmit();
  };

  // Enviar venta (F12)
  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    const total = calcularTotal();
    let cloverPagoId = null;

    try {
      setSubmitting(true);
      setError('');

      // Si es pago con tarjeta, procesar primero en el dispositivo Clover
      if (metodoPago === 'TARJETA') {
        setProcesandoPagoClover(true);
        try {
          const resultado = await procesarPagoClover({
            monto: Number(total),
            descripcion: `Venta - ${items.length} producto(s)`,
            orden_id: `venta_${Date.now()}`
          });
          if (!resultado.exito) {
            setError(resultado.error || 'Pago rechazado o cancelado');
            setProcesandoPagoClover(false);
            setSubmitting(false);
            return;
          }
          cloverPagoId = resultado.clover_pago_id ?? null;
        } catch (err) {
          const msg = err.response?.data?.error || err.message || 'Error al procesar pago con Clover';
          setError(msg);
          setProcesandoPagoClover(false);
          setSubmitting(false);
          return;
        } finally {
          setProcesandoPagoClover(false);
        }
      }

      const ventaData = {
        ...(cliente ? { cliente_id: cliente.id } : {}),
        deposito_id: deposito.id,
        items: items.map(item => ({
          variante_id: item.variante.id,
          cantidad: item.cantidad,
          precio_unitario: Number(item.precio_unitario) || 0,
          descuento_unitario: 0
        })),
        metodo_pago: metodoPago,
        descuento_porcentaje: 0,
        descuento_monto: 0,
        ...(cloverPagoId ? { clover_pago_id: cloverPagoId } : {})
      };

      const response = await createVenta(ventaData);

      // Redirigir al detalle de la venta
      navigate(`/ventas/${response.id}`);
    } catch (err) {
      console.error('Error al crear venta:', err);
      setError(err.response?.data?.error || 'Error al procesar la venta');
      setAlertaMargen(err.response?.data?.alerta_margen || '');
    } finally {
      setSubmitting(false);
    }
  };
  
  const limpiarVenta = () => {
    setItems([]);
    setCliente(null);
    setPagaCon(0);
    setError('');
    setAlertaMargen('');
    setCodigoBusqueda('');
    codigoInputRef.current?.focus();
  };
  
  const total = calcularTotal();
  const cambio = calcularCambio();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Modal: Procesando pago con Clover */}
      {procesandoPagoClover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Procesando pago</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Pase la tarjeta en el dispositivo Clover
            </p>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

      {/* Header ULTRA COMPACTO - Soft UI */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 text-white px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
          <h1 className="text-sm sm:text-base font-bold">🛒 PUNTO DE VENTA</h1>
          <div className="text-xs flex flex-wrap gap-1.5">
            <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">Usuario: <strong>{user?.username}</strong></span>
            <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[150px]">Depósito: <strong>{deposito?.nombre || 'Cargando...'}</strong></span>
          </div>
        </div>
      </div>
      
      {/* Contenido principal: izquierda = Ticket (código + tabla), derecha = Cliente + cobro */}
      <div className="flex-1 flex flex-col min-h-0 p-2 sm:p-3 lg:p-4">
        <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-3 min-h-0">
          
          {/* Izquierda: Código + Ticket de Venta — se extiende al máximo en ancho y alto */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-2 sm:space-y-3">
            
            {/* Búsqueda por código */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2.5 sm:p-3 border border-gray-100 dark:border-slate-700">
              <form onSubmit={buscarProductoPorCodigo} className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Código del Producto:
                </label>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <input
                    ref={codigoInputRef}
                    type="text"
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    placeholder="Código del producto"
                    className="flex-1 search-input rounded-lg sm:rounded-xl"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-xs sm:text-sm whitespace-nowrap shadow-lg shadow-green-500/30"
                    >
                      <span className="hidden sm:inline">ENTER - </span>Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarResultados(true)}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-xs sm:text-sm whitespace-nowrap shadow-lg shadow-blue-500/30"
                    >
                      <span className="hidden sm:inline">F10 - </span>Buscar
                    </button>
                  </div>
                </div>
              </form>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl shadow-sm">
                  {error}
                </div>
              )}
            </div>
            
            {/* Ticket de Venta — crece hacia abajo todo lo posible */}
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-100 dark:border-slate-700">
              <div className="flex-none bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-blue-200 dark:border-slate-600">
                <h2 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100">Ticket de Venta</h2>
              </div>
              
              <div className="flex-1 min-h-0 overflow-auto">
                {/* Vista móvil - Cards Soft UI */}
                <div className="block lg:hidden">
                  {items.length === 0 ? (
                    <div className="px-3 sm:px-4 lg:px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                      No hay productos en la venta actual
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                      {items.map((item) => (
                        <div key={item.variante.id} className="border border-gray-200 dark:border-slate-600 rounded-xl p-3 bg-gray-50 dark:bg-slate-700/50 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate">{item.variante.nombre_completo}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.variante.codigo} · {item.variante.marca_nombre || item.variante.producto_base?.marca?.nombre || '—'}</p>
                            </div>
                            <button
                              onClick={() => eliminarItem(item.variante.id)}
                              className="ml-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold text-lg shrink-0"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-100">${Number(item.precio_unitario ?? 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                              <span className="ml-1 text-gray-700 dark:text-gray-300">{item.variante.stock_actual || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400 block mb-1">Cantidad:</span>
                              <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-600 overflow-hidden shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.variante.id, Math.max(1, item.cantidad - 1))}
                                  className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 font-bold text-lg"
                                  title="Menos"
                                >
                                  −
                                </button>
                                <span className="min-w-[2.5rem] px-2 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums text-center">
                                  {item.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.variante.id, item.cantidad + 1)}
                                  className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 font-bold text-lg"
                                  title="Más"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col justify-end">
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Importe:</span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">${Number(item.subtotal ?? 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Vista desktop - Tabla Soft UI */}
                <table className="w-full hidden lg:table">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 sticky top-0 border-b-2 border-gray-200 dark:border-slate-600">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Código</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Descripción</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Marca</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Precio</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Cantidad</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Importe</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Stock</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-3 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                          No hay productos en la venta actual
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.variante.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono truncate">{item.variante.codigo}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-medium truncate min-w-0">{item.variante.nombre_completo}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{item.variante.marca_nombre || item.variante.producto_base?.marca?.nombre || '—'}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100">${Number(item.precio_unitario ?? 0).toFixed(2)}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                            <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 overflow-hidden shadow-sm">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(item.variante.id, Math.max(1, item.cantidad - 1))}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 font-bold text-lg leading-none"
                                title="Menos"
                              >
                                −
                              </button>
                              <span className="min-w-[2rem] px-1 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(item.variante.id, item.cantidad + 1)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 font-bold text-lg leading-none"
                                title="Más"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm">
                            ${Number(item.subtotal ?? 0).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {item.variante.stock_actual || 0}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                            <button
                              onClick={() => eliminarItem(item.variante.id)}
                              className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold transition-colors"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="border-t border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {items.length} producto(s) en la venta actual
                  </span>
                  <button
                    onClick={() => limpiarVenta()}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    <span className="hidden sm:inline">F4 - </span>Cancelar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Derecha: Cliente + Método de pago + Total + Cobro — franja fija, lo restante queda para el ticket */}
          <div className="flex flex-col space-y-3 min-w-0 lg:w-72 lg:flex-shrink-0 lg:border-l-2 lg:border-gray-300 dark:lg:border-slate-600 lg:pl-3">
            
            {/* Cliente */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2.5 sm:p-3 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-xs sm:text-sm mb-1.5 sm:mb-2 text-gray-800 dark:text-gray-100">Cliente{clienteObligatorio ? ' *' : ' (opcional)'}</h3>
              {cliente ? (
                <div className="space-y-1.5">
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="font-semibold text-xs sm:text-sm text-blue-900 dark:text-blue-100 truncate min-w-0">{cliente.nombre_completo}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">DNI: {cliente.dni}</p>
                    {cliente.telefono && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">Tel: {cliente.telefono}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCliente(null)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-md transition-all"
                  >
                    Cambiar Cliente
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarModalCliente(true)}
                  className="w-full px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm shadow-lg shadow-blue-500/30"
                >
                  Seleccionar Cliente
                </button>
              )}
            </div>
            
            {/* Método de Pago - F11 alterna Contado/Tarjeta */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2.5 sm:p-3 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-xs sm:text-sm mb-1.5 sm:mb-2 text-gray-800 dark:text-gray-100">Método de Pago <span className="text-gray-400 dark:text-gray-500 font-normal">(F11)</span></h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => cambiarMetodoPago('EFECTIVO')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 hover:shadow-md border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  CONTADO
                </button>
                <button
                  onClick={() => cambiarMetodoPago('TARJETA')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                    metodoPago === 'TARJETA'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 hover:shadow-md border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  TARJETA
                </button>
              </div>
            </div>
            
            {/* Totales - ULTRA COMPACTO */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100">Total:</span>
                <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">
                  ${total.toFixed(2)}
                </span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pagó Con:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagaCon}
                  onChange={(e) => setPagaCon(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm sm:text-base text-right bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-slate-600">
                <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100">Cambio:</span>
                <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            
            {/* Botón de cobrar: sin cliente obligatorio muestra modal "¿Agregar cliente?" */}
            {items.length === 0 && !submitting && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                Agregá al menos un producto para cobrar.
              </p>
            )}
            <button
              onClick={intentarCobrar}
              disabled={items.length === 0 || submitting}
              className="w-full px-4 py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-2xl hover:shadow-green-500/50 hover:-translate-y-1 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none font-bold text-sm sm:text-base shadow-xl shadow-green-500/40 transition-all duration-200"
            >
              {submitting ? 'Procesando...' : <><span className="hidden sm:inline">F12 - </span>COBRAR</>}
            </button>
            
            {alertaMargen && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm text-sm">
                {alertaMargen}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de búsqueda manual (F10) - Soft UI */}
      {mostrarResultados && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndiceSeleccionadoBusqueda((i) => Math.min(i + 1, Math.max(0, productosEncontrados.length - 1)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndiceSeleccionadoBusqueda((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter' && productosEncontrados.length > 0) {
              e.preventDefault();
              const v = productosEncontrados[indiceSeleccionadoBusqueda];
              if (v) agregarItem(v);
            }
          }}
          tabIndex={0}
          role="dialog"
          aria-label="Búsqueda de productos"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] flex flex-col border border-gray-100 dark:border-slate-600">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-700">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">Búsqueda de Productos</h2>
              <button
                onClick={() => {
                  setMostrarResultados(false);
                  setBusquedaManual('');
                  setProductosEncontrados([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-600">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (productosEncontrados.length > 0) {
                    const v = productosEncontrados[indiceSeleccionadoBusqueda];
                    if (v) agregarItem(v);
                  } else {
                    buscarManualmente(e);
                  }
                }}
              >
                <input
                  type="text"
                  value={busquedaManual}
                  onChange={(e) => setBusquedaManual(e.target.value)}
                  onBlur={handleBusquedaManualBlur}
                  placeholder="Buscar por código, nombre de producto o marca..."
                  className="w-full search-input px-4 py-3 text-base"
                  autoFocus
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-auto">
              {productosEncontrados.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                  No hay resultados. Ingrese un término de búsqueda.
                </p>
              ) : (
                <table className="w-full text-sm min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 sticky top-0 border-b-2 border-gray-200 dark:border-slate-600">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Código</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Producto</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Variante</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Marca</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Precio</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">P. Tarjeta</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosEncontrados.map((variante, idx) => (
                      <tr
                        id={`busqueda-row-${idx}`}
                        key={variante.id}
                        onClick={() => agregarItem(variante)}
                        onDoubleClick={() => agregarItem(variante)}
                        className={`border-b border-gray-100 dark:border-slate-600 cursor-pointer transition-colors ${
                          idx === indiceSeleccionadoBusqueda
                            ? 'bg-blue-100 dark:bg-blue-900/40'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-bold whitespace-nowrap truncate">
                          {variante.codigo}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate min-w-0">
                          {variante.producto_nombre ?? variante.producto_base?.nombre ?? '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">
                          {variante.nombre_variante ?? '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {variante.marca_nombre || variante.producto_base?.marca?.nombre || '—'}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                          ${parseFloat(variante.precio_mostrador || 0).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                          ${parseFloat(variante.precio_tarjeta ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                          <span className={`inline-block px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold ${
                            (variante.stock_actual || 0) > 0 
                              ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' 
                              : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                          }`}>
                            {variante.stock_actual || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-slate-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-700 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg text-xs font-semibold shadow-sm">Enter</kbd> agregar seleccionado · <kbd className="px-2 py-1 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg text-xs font-semibold shadow-sm">↑↓</kbd> mover · <kbd className="px-2 py-1 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg text-xs font-semibold shadow-sm">ESC</kbd> cerrar
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: ¿Desea agregar un cliente? (al cobrar sin cliente seleccionado) */}
      {mostrarModalAgregarCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-600 p-6 max-w-sm w-full">
            <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
              ¿Desea agregar un cliente a esta venta?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalAgregarCliente(false);
                  setMostrarModalCliente(true);
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalAgregarCliente(false)}
                className="flex-1 py-2.5 px-4 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-500 transition-all"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: listado de clientes con búsqueda + opción agregar cliente */}
      {mostrarModalCliente && (
        <SeleccionarClienteModal
          isOpen={true}
          onClose={() => setMostrarModalCliente(false)}
          onClienteSeleccionado={(clienteSeleccionado) => {
            setCliente(clienteSeleccionado);
            setMostrarModalCliente(false);
          }}
        />
      )}
    </div>
  );
}
