/**
 * Punto de Venta - Diseño POS Tradicional
 * Con atajos de teclado y precios por método de pago
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVenta } from '../services/ventasService';
import { getDepositoPrincipal, getStocksPorVariante } from '../services/inventarioService';
import productosService from '../services/productosService';
import clientesService from '../services/clientesService';
import { useAuth } from '../hooks/useAuth';
import QuickClienteModal from '../components/QuickClienteModal';

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
  
  // UI
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertaMargen, setAlertaMargen] = useState('');
  
  // Pago
  const [pagaCon, setPagaCon] = useState(0);
  
  useEffect(() => {
    cargarDepositoPrincipal();
    // Focus en el input de código al cargar
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
      
      // F12 - Cobrar (solo si hay items)
      if (e.key === 'F12') {
        e.preventDefault();
        if (items.length > 0 && cliente) {
          handleSubmit();
        }
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
  }, [items, cliente]);
  
  const cargarDepositoPrincipal = async () => {
    try {
      const data = await getDepositoPrincipal();
      setDeposito(data);
    } catch (err) {
      console.error('Error al cargar depósito:', err);
    }
  };
  
  // Buscar producto por código/SKU (ENTER)
  const buscarProductoPorCodigo = async (e) => {
    e.preventDefault();
    if (!codigoBusqueda.trim() || !deposito) return;
    
    try {
      // Buscar por SKU o código de barras
      const resultado = await productosService.search(codigoBusqueda.trim());
      const variantes = resultado.results || resultado;
      
      if (variantes.length === 1) {
        // Un solo resultado, agregar directamente
        await agregarItem(variantes[0]);
        setCodigoBusqueda('');
      } else if (variantes.length > 1) {
        // Múltiples resultados, mostrar para seleccionar
        setProductosEncontrados(variantes);
        setMostrarResultados(true);
      } else {
        setError('Producto no encontrado');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error al buscar producto:', err);
      setError('Error al buscar producto');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Búsqueda manual (F10)
  const buscarManualmente = async (e) => {
    if (e) e.preventDefault();
    if (!busquedaManual.trim()) {
      setProductosEncontrados([]);
      return;
    }
    
    try {
      const data = await productosService.search(busquedaManual.trim());
      setProductosEncontrados(data.results || data);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setProductosEncontrados([]);
    }
  };
  
  // Efecto para búsqueda automática mientras se escribe
  useEffect(() => {
    if (!mostrarResultados) return;
    
    // Debounce de 300ms
    const timeoutId = setTimeout(async () => {
      if (busquedaManual.trim()) {
        try {
          const data = await productosService.search(busquedaManual.trim());
          setProductosEncontrados(data.results || data);
        } catch (err) {
          console.error('Error en búsqueda:', err);
          setProductosEncontrados([]);
        }
      } else {
        setProductosEncontrados([]);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [busquedaManual, mostrarResultados]);
  
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
      } catch (stockErr) {
        console.warn('No se pudo verificar stock del depósito, usando stock general:', stockErr);
        // Continuar con el stock general de la variante
      }
      
      // Verificar si ya está en la lista
      const itemExistente = items.find(item => item.variante.id === variante.id);
      const cantidadEnTicket = itemExistente ? itemExistente.cantidad : 0;
      
      // Verificar stock disponible
      if (stockDisponible <= 0) {
        setError(`Sin stock disponible`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (stockDisponible <= cantidadEnTicket) {
        setError(`Stock insuficiente. Disponible: ${stockDisponible}`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      const precio = getPrecioSegunMetodo(variante);
      
      if (itemExistente) {
        // Incrementar cantidad
        setItems(items.map(item =>
          item.variante.id === variante.id
            ? { 
                ...item, 
                cantidad: item.cantidad + 1,
                subtotal: item.precio_unitario * (item.cantidad + 1)
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
          precio_unitario: precio,
          subtotal: precio
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
            subtotal: item.precio_unitario * nuevaCantidad
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
    
    // Recalcular todos los precios
    setItems(items.map(item => {
      const nuevoPrecio = nuevoMetodo === 'TARJETA' 
        ? item.variante.precio_tarjeta || item.variante.precio_mostrador
        : item.variante.precio_mostrador;
      
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
  
  // Enviar venta (F12)
  const handleSubmit = async () => {
    if (!cliente) {
      setError('Debe seleccionar un cliente');
      return;
    }
    
    if (items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const ventaData = {
        cliente: cliente.id,
        deposito: deposito.id,
        items: items.map(item => ({
          variante: item.variante.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        })),
        metodo_pago: metodoPago,
        descuento_porcentaje: 0,
        descuento_monto: 0
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
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header responsive */}
      <div className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">PUNTO DE VENTA</h1>
          <div className="text-xs sm:text-sm flex flex-wrap gap-2 sm:gap-4">
            <span>Usuario: <strong>{user?.username}</strong></span>
            <span>Depósito: <strong>{deposito?.nombre || 'Cargando...'}</strong></span>
          </div>
        </div>
      </div>
      
      {/* Contenido principal responsive */}
      <div className="flex-1 p-2 sm:p-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-h-full">
          
          {/* Columna izquierda - Búsqueda y productos (responsive) */}
          <div className="lg:col-span-2 flex flex-col space-y-3 sm:space-y-4">
            
            {/* Búsqueda por código - responsive */}
            <div className="bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-gray-700">
              <form onSubmit={buscarProductoPorCodigo} className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-gray-300">
                  Código del Producto:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={codigoInputRef}
                    type="text"
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    placeholder="Código del producto"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-base sm:text-lg bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm sm:text-base whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">ENTER - </span>Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarResultados(true)}
                      className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">F10 - </span>Buscar
                    </button>
                  </div>
                </div>
              </form>
              
              {error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>
            
            {/* Tabla de productos - responsive */}
            <div className="flex-1 bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col min-h-[300px] sm:min-h-[400px] border border-gray-700">
              <div className="bg-gray-700 px-3 py-2 sm:px-4 border-b border-gray-600">
                <h2 className="font-bold text-sm sm:text-base text-gray-200">Ticket de Venta</h2>
              </div>
              
              <div className="flex-1 overflow-auto">
                {/* Vista móvil - Cards */}
                <div className="block lg:hidden">
                  {items.length === 0 ? (
                    <div className="px-4 py-12 text-center text-gray-500 text-sm">
                      No hay productos en la venta actual
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      {items.map((item) => (
                        <div key={item.variante.id} className="border border-gray-700 rounded-lg p-3 bg-gray-700">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-100">{item.variante.nombre_completo}</p>
                              <p className="text-xs text-gray-400">{item.variante.codigo}</p>
                            </div>
                            <button
                              onClick={() => eliminarItem(item.variante.id)}
                              className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Precio:</span>
                              <span className="ml-1 font-semibold text-gray-100">${item.precio_unitario.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Stock:</span>
                              <span className="ml-1 text-gray-200">{item.variante.stock_actual || 0}</span>
                            </div>
                            <div>
                              <label className="text-gray-400 block">Cantidad:</label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => cambiarCantidad(item.variante.id, parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 text-center bg-gray-800 border border-gray-600 text-gray-100 rounded mt-1"
                              />
                            </div>
                            <div className="flex flex-col justify-end">
                              <span className="text-gray-400 text-xs">Importe:</span>
                              <span className="text-lg font-bold text-green-400">${item.subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Vista desktop - Tabla */}
                <table className="w-full hidden lg:table">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Descripción</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-300">Precio</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-300">Cant.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-300">Importe</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-300">Stock</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-12 text-center text-gray-500 text-sm">
                          No hay productos en la venta actual
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.variante.id} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="px-3 py-2 text-xs text-gray-300">{item.variante.codigo}</td>
                          <td className="px-3 py-2 text-xs text-gray-200">{item.variante.nombre_completo}</td>
                          <td className="px-3 py-2 text-center font-semibold text-sm text-gray-200">${item.precio_unitario.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => cambiarCantidad(item.variante.id, parseInt(e.target.value) || 1)}
                              className="w-14 px-2 py-1 text-center bg-gray-700 border border-gray-600 text-gray-100 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-green-400 text-sm">
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-gray-400">
                            {item.variante.stock_actual || 0}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => eliminarItem(item.variante.id)}
                              className="text-red-400 hover:text-red-300 font-bold"
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
              
              <div className="border-t border-gray-700 px-3 py-2 sm:px-4 bg-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-400">
                    {items.length} producto(s) en la venta actual
                  </span>
                  <button
                    onClick={() => limpiarVenta()}
                    className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold"
                  >
                    <span className="hidden sm:inline">F4 - </span>Cancelar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna derecha - Cliente y totales (responsive) */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            
            {/* Cliente - responsive */}
            <div className="bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-gray-700">
              <h3 className="font-bold text-sm sm:text-base text-gray-300 mb-2 sm:mb-3">Cliente *</h3>
              {cliente ? (
                <div className="space-y-2">
                  <div className="p-2 sm:p-3 bg-blue-900/30 border border-blue-700 rounded">
                    <p className="font-semibold text-sm sm:text-base text-blue-300">{cliente.nombre_completo}</p>
                    <p className="text-xs sm:text-sm text-blue-400">DNI: {cliente.dni}</p>
                    {cliente.telefono && (
                      <p className="text-xs sm:text-sm text-blue-400">Tel: {cliente.telefono}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCliente(null)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  >
                    Cambiar Cliente
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarModalCliente(true)}
                  className="w-full px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base"
                >
                  Seleccionar Cliente
                </button>
              )}
            </div>
            
            {/* Método de Pago - responsive */}
            <div className="bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-gray-700">
              <h3 className="font-bold text-sm sm:text-base text-gray-300 mb-2 sm:mb-3">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cambiarMetodoPago('EFECTIVO')}
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-semibold text-sm sm:text-base ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  CONTADO
                </button>
                <button
                  onClick={() => cambiarMetodoPago('TARJETA')}
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-semibold text-sm sm:text-base ${
                    metodoPago === 'TARJETA'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  TARJETA
                </button>
              </div>
            </div>
            
            {/* Totales - responsive */}
            <div className="bg-gray-800 rounded-lg shadow p-3 sm:p-4 space-y-2 sm:space-y-3 border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-base sm:text-xl text-gray-300">Total:</span>
                <span className="text-2xl sm:text-3xl font-bold text-green-400">
                  ${total.toFixed(2)}
                </span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1">
                  Pagó Con:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagaCon}
                  onChange={(e) => setPagaCon(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-lg sm:text-xl text-right bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-700">
                <span className="font-bold text-base sm:text-xl text-gray-300">Cambio:</span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-400">
                  ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            
            {/* Botón de cobrar - responsive */}
            <button
              onClick={handleSubmit}
              disabled={!cliente || items.length === 0 || submitting}
              className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg sm:text-xl shadow-lg"
            >
              {submitting ? 'Procesando...' : <><span className="hidden sm:inline">F12 - </span>COBRAR</>}
            </button>
            
            {alertaMargen && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
                {alertaMargen}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de búsqueda manual (F10) - responsive */}
      {mostrarResultados && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] flex flex-col border border-gray-700">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-200">Búsqueda de Productos</h2>
              <button
                onClick={() => {
                  setMostrarResultados(false);
                  setBusquedaManual('');
                  setProductosEncontrados([]);
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-700">
              <form onSubmit={buscarManualmente}>
                <input
                  type="text"
                  value={busquedaManual}
                  onChange={(e) => setBusquedaManual(e.target.value)}
                  placeholder="Buscar por código, nombre o marca..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                  autoFocus
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-auto">
              {productosEncontrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  No hay resultados. Ingrese un término de búsqueda.
                </p>
              ) : (
                <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300 border-b-2 border-gray-600">Código</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300 border-b-2 border-gray-600">Nombre Completo</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-300 border-b-2 border-gray-600">Precio</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-300 border-b-2 border-gray-600">Stock</th>
                </tr>
              </thead>
                  <tbody>
                    {productosEncontrados.map((variante) => (
                      <tr
                        key={variante.id}
                        onClick={() => agregarItem(variante)}
                        className="border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
                      >
                        <td className="px-3 py-2 font-mono text-xs text-gray-300 whitespace-nowrap">
                          {variante.codigo}
                        </td>
                        <td className="px-3 py-2 text-gray-200">
                          {variante.nombre_completo || `${variante.producto_base?.nombre || ''} ${variante.nombre_variante || ''}`.trim()}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-green-400 whitespace-nowrap">
                          ${getPrecioSegunMetodo(variante).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            (variante.stock_actual || 0) > 0 
                              ? 'bg-green-900/30 text-green-400 border border-green-700' 
                              : 'bg-red-900/30 text-red-400 border border-red-700'
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
            
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-700 bg-gray-700 text-xs sm:text-sm text-gray-400">
              Presione <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs">ESC</kbd> para cerrar
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de cliente */}
      {mostrarModalCliente && (
        <QuickClienteModal
          onClose={() => setMostrarModalCliente(false)}
          onClienteCreado={(nuevoCliente) => {
            setCliente(nuevoCliente);
            setMostrarModalCliente(false);
          }}
        />
      )}
    </div>
  );
}
