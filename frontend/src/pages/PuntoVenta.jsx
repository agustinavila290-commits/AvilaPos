/* slint-env node */
/**
 * Punto de Venta - Diseno POS Tradicional
 * Con atajos de teclado y precios por metodo de pago.
 * Busqueda: al tipear una palabra se muestran todos los productos que la contengan (codigo, nombre, marca).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVenta } from '../services/ventasService';
import { crearTicket, agregarItem as agregarItemCuentaCorriente } from '../services/cuentaCorrienteService';
import { getDepositoPrincipal, getStocksPorVariante } from '../services/inventarioService';
import { getConfiguracionPOS } from '../services/configuracionService';
import productosService from '../services/productosService';
import { useAuth } from '../hooks/useAuth';
import SeleccionarClienteModal from '../components/SeleccionarClienteModal';
import PresupuestoPrint from '../components/PresupuestoPrint';

export default function PuntoVentaNuevo() {
  const crearEstadoTicketVacio = useCallback((id) => ({
    id,
    titulo: `Ticket ${id}`,
    cliente: null,
    items: [],
    metodoPago: 'EFECTIVO',
    pagaCon: 0,
    descripcionTicket: '',
    referenciaPago: '',
  }), []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const codigoInputRef = useRef(null);
  const proximoTicketVentaIdRef = useRef(2);

  // Helper: lee el campo del ticket activo desde localStorage (solo en mount)
  const _lsActivo = (campo, defecto) => {
    try {
      const raw = localStorage.getItem('avilapos_tickets_venta');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          const v = arr[0][campo];
          if (v !== undefined && v !== null) return v;
        }
      }
    } catch {}
    return defecto;
  };

  // Estado principal — inicializado desde el ticket activo persistido
  const [cliente, setCliente] = useState(() => _lsActivo('cliente', null));
  const [deposito, setDeposito] = useState(null);
  const [items, setItems] = useState(() => {
    const v = _lsActivo('items', []);
    return Array.isArray(v) ? v : [];
  });
  const [metodoPago, setMetodoPago] = useState(() => _lsActivo('metodoPago', 'EFECTIVO')); // EFECTIVO, TRANSFERENCIA, TARJETA, CUENTA_CORRIENTE

  // Busqueda
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [busquedaManual, setBusquedaManual] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [indiceSeleccionadoBusqueda, setIndiceSeleccionadoBusqueda] = useState(0);
  // Preview de producto
  const [productoPreview, setProductoPreview] = useState(null);

  // Configuracion POS (cliente obligatorio, etc.)
  const [clienteObligatorio, setClienteObligatorio] = useState(true);

  // UI
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalAgregarCliente, setMostrarModalAgregarCliente] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertaMargen, setAlertaMargen] = useState('');

  // Pago
  const [pagaCon, setPagaCon] = useState(() => Number(_lsActivo('pagaCon', 0)) || 0);
  const [referenciaPago, setReferenciaPago] = useState(() => _lsActivo('referenciaPago', '') || '');

  // Cuenta corriente: nombre del ticket
  const [descripcionTicket, setDescripcionTicket] = useState(() => _lsActivo('descripcionTicket', '') || '');

  // Presupuesto (imprimir sin cobro)
  const [mostrarPresupuesto, setMostrarPresupuesto] = useState(false);

  // Múltiples tickets de venta abiertos en paralelo (persisten en localStorage)
  const [ticketsVenta, setTicketsVenta] = useState(() => {
    try {
      const guardados = localStorage.getItem('avilapos_tickets_venta');
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = parsed.map(t => t.id).filter(Number.isFinite);
          if (ids.length > 0) proximoTicketVentaIdRef.current = Math.max(...ids) + 1;
          return parsed;
        }
      }
    } catch {}
    return [{ id: 1, titulo: 'Ticket 1', cliente: null, items: [], metodoPago: 'EFECTIVO', pagaCon: 0, descripcionTicket: '', referenciaPago: '' }];
  });
  const [ticketVentaActivoId, setTicketVentaActivoId] = useState(() => {
    try {
      const guardados = localStorage.getItem('avilapos_tickets_venta');
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return 1;
  });

  const obtenerSnapshotTicketActual = useCallback(() => ({
    cliente,
    items,
    metodoPago,
    pagaCon,
    descripcionTicket,
    referenciaPago,
  }), [cliente, items, metodoPago, pagaCon, descripcionTicket, referenciaPago]);

  const aplicarTicketEnPantalla = useCallback((ticket) => {
    if (!ticket) return;
    setCliente(ticket.cliente ?? null);
    setItems(Array.isArray(ticket.items) ? ticket.items : []);
    setMetodoPago(ticket.metodoPago || 'EFECTIVO');
    setPagaCon(Number(ticket.pagaCon) || 0);
    setDescripcionTicket(ticket.descripcionTicket || '');
    setReferenciaPago(ticket.referenciaPago || '');
  }, []);

  const guardarTicketActivo = useCallback(() => {
    const snapshot = obtenerSnapshotTicketActual();
    setTicketsVenta((prev) => prev.map((ticket) => (
      ticket.id === ticketVentaActivoId
        ? { ...ticket, ...snapshot }
        : ticket
    )));
  }, [obtenerSnapshotTicketActual, ticketVentaActivoId]);

  const cambiarTicketActivo = useCallback((ticketId) => {
    if (ticketId === ticketVentaActivoId) return;

    const snapshot = obtenerSnapshotTicketActual();
    let siguienteTicket = null;

    setTicketsVenta((prev) => {
      const actualizados = prev.map((ticket) => (
        ticket.id === ticketVentaActivoId
          ? { ...ticket, ...snapshot }
          : ticket
      ));
      siguienteTicket = actualizados.find((ticket) => ticket.id === ticketId) || null;
      return actualizados;
    });

    if (siguienteTicket) {
      setTicketVentaActivoId(ticketId);
      aplicarTicketEnPantalla(siguienteTicket);
      setError('');
      setAlertaMargen('');
      setCodigoBusqueda('');
      requestAnimationFrame(() => {
        setTimeout(() => codigoInputRef.current?.focus(), 0);
      });
    }
  }, [ticketVentaActivoId, obtenerSnapshotTicketActual, aplicarTicketEnPantalla]);

  const crearNuevoTicketVenta = useCallback(() => {
    const snapshot = obtenerSnapshotTicketActual();
    const nuevoId = proximoTicketVentaIdRef.current;
    proximoTicketVentaIdRef.current += 1;

    const nuevoTicket = crearEstadoTicketVacio(nuevoId);

    setTicketsVenta((prev) => {
      const actualizados = prev.map((ticket) => (
        ticket.id === ticketVentaActivoId
          ? { ...ticket, ...snapshot }
          : ticket
      ));
      return [...actualizados, nuevoTicket];
    });

    setTicketVentaActivoId(nuevoId);
    aplicarTicketEnPantalla(nuevoTicket);
    setCodigoBusqueda('');
    setError('');
    setAlertaMargen('');
    requestAnimationFrame(() => {
      setTimeout(() => codigoInputRef.current?.focus(), 0);
    });
  }, [ticketVentaActivoId, obtenerSnapshotTicketActual, crearEstadoTicketVacio, aplicarTicketEnPantalla]);

  const cerrarTicketVenta = useCallback((ticketId) => {
    if (ticketsVenta.length <= 1) {
      limpiarVenta();
      return;
    }

    const snapshot = obtenerSnapshotTicketActual();
    let siguienteTicket = null;

    setTicketsVenta((prev) => {
      const actualizados = prev.map((ticket) => (
        ticket.id === ticketVentaActivoId
          ? { ...ticket, ...snapshot }
          : ticket
      ));

      const restantes = actualizados.filter((ticket) => ticket.id !== ticketId);

      if (ticketId === ticketVentaActivoId) {
        siguienteTicket = restantes[restantes.length - 1] || null;
      }

      return restantes;
    });

    if (ticketId === ticketVentaActivoId && siguienteTicket) {
      setTicketVentaActivoId(siguienteTicket.id);
      aplicarTicketEnPantalla(siguienteTicket);
      setError('');
      setAlertaMargen('');
      setCodigoBusqueda('');
      requestAnimationFrame(() => {
        setTimeout(() => codigoInputRef.current?.focus(), 0);
      });
    }
  }, [ticketsVenta.length, ticketVentaActivoId, obtenerSnapshotTicketActual, aplicarTicketEnPantalla]);

  const focusCodigo = useCallback(() => {
    // Evitar robar foco si hay modales abiertos
    if (mostrarResultados || mostrarModalCliente || mostrarModalAgregarCliente || mostrarPresupuesto) return;
    // En algunos navegadores el autofocus no engancha si el DOM todavia esta acomodandose
    requestAnimationFrame(() => {
      setTimeout(() => codigoInputRef.current?.focus(), 0);
    });
  }, [mostrarResultados, mostrarModalCliente, mostrarModalAgregarCliente, mostrarPresupuesto]);
  
  useEffect(() => {
    cargarDepositoPrincipal();
    getConfiguracionPOS().then((cfg) => {
      setClienteObligatorio(cfg.CLIENTE_OBLIGATORIO !== false);
    }).catch(() => setClienteObligatorio(true));
    focusCodigo();
  }, []);

  // Persistir tickets en localStorage — fusiona el estado activo antes de guardar
  useEffect(() => {
    try {
      const snapshot = { cliente, items, metodoPago, pagaCon, descripcionTicket, referenciaPago };
      const paraGuardar = ticketsVenta.map(t =>
        t.id === ticketVentaActivoId ? { ...t, ...snapshot } : t
      );
      localStorage.setItem('avilapos_tickets_venta', JSON.stringify(paraGuardar));
    } catch {}
  }, [ticketsVenta, items, cliente, metodoPago, pagaCon, descripcionTicket, referenciaPago, ticketVentaActivoId]);

  // Cuando termina de cargar el deposito (y no hay modales), volver a enfocar la barra de codigo.
  useEffect(() => {
    if (!deposito) return;
    focusCodigo();
  }, [deposito, focusCodigo]);

  // Al cerrar modales, volver a enfocar la barra de codigo.
  useEffect(() => {
    focusCodigo();
  }, [mostrarResultados, mostrarModalCliente, mostrarModalAgregarCliente, mostrarPresupuesto, focusCodigo]);
  
  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F10 - Busqueda manual
      if (e.key === 'F10') {
        e.preventDefault();
        setMostrarResultados(true);
      }
      
      // F11 - Ciclo Contado → Tarjeta → Transfer. (CC se elige con click)
      if (e.key === 'F11' && metodoPago !== 'CUENTA_CORRIENTE') {
        e.preventDefault();
        const ciclo = { EFECTIVO: 'TARJETA', TARJETA: 'TRANSFERENCIA', TRANSFERENCIA: 'EFECTIVO' };
        cambiarMetodoPago(ciclo[metodoPago] || 'EFECTIVO');
      }
      
      // F12 - Cobrar o anadir a cuenta corriente
      if (e.key === 'F12') {
        e.preventDefault();
        if (items.length === 0) return;
        if (metodoPago === 'CUENTA_CORRIENTE') {
          if (!cliente) {
            setMostrarModalAgregarCliente(true);
            return;
          }
          handleSubmit();
        } else {
          if (clienteObligatorio && !cliente) {
            setMostrarModalAgregarCliente(true);
            return;
          }
          handleSubmit();
        }
      }
      
      // F4 - Cancelar venta
      if (e.key === 'F4') {
        e.preventDefault();
        if (confirm('Cancelar la venta actual?')) {
          limpiarVenta();
        }
      }
      
      // ESC - Cerrar busqueda manual
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
      console.error('Error al cargar deposito:', err);
    }
  };
  
  // Buscar producto por codigo/SKU (ENTER): codigo exacto primero
  const buscarProductoPorCodigo = async (e) => {
    e.preventDefault();
    const codigo = codigoBusqueda.trim();
    if (!codigo || !deposito) return;
    
    try {
      const esCodigoExacto = codigo.length <= 80 && !/\s/.test(codigo);
      if (esCodigoExacto) {
        const { found, variante } = await productosService.buscarPorCodigo(codigo);
        if (found && variante) {
          await agregarItem(variante);
          setCodigoBusqueda('');
          return;
        }
      }
      
      const resultado = await productosService.search(codigo, { page_size: 200 });
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
      const data = await productosService.search(t, { page_size: 200, signal });
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
    // EFECTIVO y CUENTA_CORRIENTE usan precio mostrador
    return parseFloat(variante.precio_mostrador || 0);
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
    
    const usaTarjeta = nuevoMetodo === 'TARJETA';
    setItems(items.map(item => {
      const raw = usaTarjeta
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

  // Intentar cobrar: si falta cliente obligatorio (o CC sin cliente), muestra modal
  const intentarCobrar = () => {
    if (items.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (metodoPago === 'CUENTA_CORRIENTE') {
      if (!cliente) {
        setMostrarModalAgregarCliente(true);
        return;
      }
    } else if (clienteObligatorio && !cliente) {
      setMostrarModalAgregarCliente(true);
      return;
    }
    handleSubmit();
  };

  // Enviar venta (F12) o añadir a cuenta corriente
  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    // Flujo Cuenta Corriente
    if (metodoPago === 'CUENTA_CORRIENTE') {
      if (!cliente) {
        setError('Cliente obligatorio para cuenta corriente');
        return;
      }
      if (!deposito?.id) {
        setError('No hay depósito configurado');
        return;
      }
      try {
        setSubmitting(true);
        setError('');
        const descripcion = descripcionTicket.trim() || `POS ${new Date().toLocaleString('es-AR')}`;
        const ticket = await crearTicket({ cliente_id: cliente.id, deposito_id: deposito.id, descripcion });
        for (const item of items) {
          await agregarItemCuentaCorriente(ticket.id, {
            variante_id: item.variante.id,
            cantidad: item.cantidad,
            precio_unitario: Number(item.precio_unitario) || 0,
            descuento_unitario: 0,
          });
        }
        limpiarVenta();
        setMetodoPago('EFECTIVO');
        setDescripcionTicket('');
        setReferenciaPago('');
        // Limpiar el ticket de localStorage antes de salir
        try {
          const stored = JSON.parse(localStorage.getItem('avilapos_tickets_venta') || '[]');
          const limpio = stored.map(t => t.id === ticketVentaActivoId
            ? { id: t.id, titulo: t.titulo, cliente: null, items: [], metodoPago: 'EFECTIVO', pagaCon: 0, descripcionTicket: '', referenciaPago: '' }
            : t);
          localStorage.setItem('avilapos_tickets_venta', JSON.stringify(limpio));
        } catch {}
        navigate(`/cuenta-corriente/${ticket.id}`);
      } catch (err) {
        console.error('Error al crear ticket cuenta corriente:', err);
        setError(err.response?.data?.error || 'Error al añadir a cuenta corriente');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const ventaData = {
        ...(cliente ? { cliente_id: cliente.id } : {}),
        deposito_id: deposito.id,
        items: items.map(item => ({
          variante_id: item.variante.id,
          cantidad: item.cantidad,
          precio_unitario: Number(item.precio_unitario) || 0,
          descuento_unitario: 0,
        })),
        metodo_pago: metodoPago,
        descuento_porcentaje: 0,
        descuento_monto: 0,
        ...(metodoPago === 'TRANSFERENCIA' && referenciaPago.trim()
          ? { transferencia_banco: referenciaPago.trim() }
          : {}),
      };
      const response = await createVenta(ventaData);
      // Limpiar el ticket de localStorage antes de salir
      try {
        const stored = JSON.parse(localStorage.getItem('avilapos_tickets_venta') || '[]');
        const limpio = stored.map(t => t.id === ticketVentaActivoId
          ? { id: t.id, titulo: t.titulo, cliente: null, items: [], metodoPago: 'EFECTIVO', pagaCon: 0, descripcionTicket: '', referenciaPago: '' }
          : t);
        localStorage.setItem('avilapos_tickets_venta', JSON.stringify(limpio));
      } catch {}
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
    const ticketVacio = crearEstadoTicketVacio(ticketVentaActivoId);

    setItems([]);
    setCliente(null);
    setPagaCon(0);
    setReferenciaPago('');
    setError('');
    setAlertaMargen('');
    setDescripcionTicket('');
    setMetodoPago('EFECTIVO');
    setCodigoBusqueda('');

    setTicketsVenta((prev) => prev.map((ticket) => (
      ticket.id === ticketVentaActivoId
        ? {
            ...ticket,
            cliente: ticketVacio.cliente,
            items: ticketVacio.items,
            metodoPago: ticketVacio.metodoPago,
            pagaCon: ticketVacio.pagaCon,
            descripcionTicket: ticketVacio.descripcionTicket,
            referenciaPago: ticketVacio.referenciaPago,
          }
        : ticket
    )));

    codigoInputRef.current?.focus();
  };
  
  const total = calcularTotal();
  const cambio = calcularCambio();
  const djangoAdminUrl = `${(import.meta.env.VITE_API_HOST || 'http://localhost:8000').replace(/\/$/, '')}/admin/`;
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header POS profesional */}
      <div className="text-white px-3 py-2 shadow-md" style={{ backgroundColor: '#1E3A8A' }}>
        {/* Fila única: título a la izquierda, chips a la derecha */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <h1 className="text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap">Punto de Venta</h1>
          </div>

          {/* Desktop: todos los chips en línea */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-1 rounded font-medium whitespace-nowrap" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <span className="px-2 py-1 rounded font-medium truncate max-w-[130px]" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="opacity-70">Usuario: </span><strong>{user?.username}</strong>
            </span>
            <span className="px-2 py-1 rounded font-medium truncate max-w-[130px]" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="opacity-70">Depósito: </span><strong>{deposito?.nombre || '...'}</strong>
            </span>
            <a href={djangoAdminUrl} target="_blank" rel="noopener noreferrer"
              className="px-2 py-1 rounded font-semibold whitespace-nowrap transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
              title="Panel de administración Django"
            >Admin</a>
          </div>

          {/* Mobile: solo usuario + depósito compactos */}
          <div className="flex sm:hidden items-center gap-1 text-[11px]">
            <span className="px-1.5 py-0.5 rounded font-semibold truncate max-w-[90px]" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {user?.username}
            </span>
            <span className="px-1.5 py-0.5 rounded font-semibold truncate max-w-[90px]" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {deposito?.nombre || '...'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Contenido principal: izquierda = Ticket (código + tabla), derecha = Cliente + cobro */}
      <div className="flex-1 flex flex-col min-h-0 p-2 sm:p-3 lg:p-4">
        <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-3 min-h-0">
          
          {/* Izquierda: Código + Ticket de Venta — se extiende al máximo en ancho y alto */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-2 sm:space-y-3">
            
            {/* Búsqueda por código */}
            <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-brand-border">
              <form onSubmit={buscarProductoPorCodigo}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                  <label className="block text-xs font-bold" style={{ color: '#111827' }}>Código del Producto</label>
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <input
                    ref={codigoInputRef}
                    type="text"
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    placeholder="Ingresá el código o escaneá con lector"
                    className="flex-1 px-3 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-brand-muted shadow-sm"
                    style={{ borderColor: '#E5E7EB', '--tw-ring-color': '#2563EB' }}
                    autoFocus
                    data-no-uppercase
                  />
                  <div className="flex gap-1.5">
                    <button type="submit" className="btn-success flex-1 sm:flex-none px-3 py-2.5 whitespace-nowrap text-xs sm:text-sm">
                      ENTER – Agregar
                    </button>
                    <button type="button" onClick={() => setMostrarResultados(true)} className="btn-primary flex-1 sm:flex-none px-3 py-2.5 whitespace-nowrap text-xs sm:text-sm">
                      F10 – Buscar
                    </button>
                  </div>
                </div>
              </form>

              {error && (
                <div className="mt-2.5 p-2.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  {error}
                </div>
              )}
            </div>
            
            {/* Ticket de Venta */}
            <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-brand-border">
              <div className="flex-none px-2.5 sm:px-3 py-2 border-b border-brand-border" style={{ backgroundColor: '#F3F4F6' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-sm text-brand-text">Ticket de Venta</h2>
                  <button
                    type="button"
                    onClick={crearNuevoTicketVenta}
                    className="btn-primary px-2.5 py-1 text-xs"
                    title="Abrir nueva ventana de ticket"
                  >
                    + Nuevo Ticket
                  </button>
                </div>

                <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
                  {ticketsVenta.map((ticket) => {
                    const activo = ticket.id === ticketVentaActivoId;
                    const cantidadItems = activo ? items.length : (ticket.items?.length || 0);
                    const nombreCliente = activo
                      ? (cliente?.nombre_completo || '')
                      : (ticket.cliente?.nombre_completo || '');

                    return (
                      <div key={`ticket-tab-${ticket.id}`} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => cambiarTicketActivo(ticket.id)}
                          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap border transition-colors font-medium ${
                            activo
                              ? 'text-white border-brand-blue-dark'
                              : 'bg-white border-brand-border hover:bg-brand-bg'
                          }`}
                          style={activo ? { backgroundColor: '#2563EB', borderColor: '#1E3A8A' } : { color: '#374151' }}
                        >
                          {ticket.titulo} · {cantidadItems} item(s){nombreCliente ? ` · ${nombreCliente}` : ''}
                        </button>

                        {ticketsVenta.length > 1 && (
                          <button
                            type="button"
                            onClick={() => cerrarTicketVenta(ticket.id)}
                            className="w-5 h-5 rounded-full border text-xs flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ borderColor: '#FECACA', color: '#DC2626' }}
                            title={`Cerrar ${ticket.titulo}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-1 min-h-0 overflow-auto">
                {/* Vista móvil - Cards Soft UI */}
                <div className="block lg:hidden">
                  {items.length === 0 ? (
                    <div className="px-3 sm:px-4 lg:px-6 py-12 text-center text-slate-400 text-xs sm:text-sm">
                      No hay productos en la venta actual
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                      {items.map((item) => {
                        const productoNombre = item.variante.producto_nombre ?? item.variante.producto_base?.nombre ?? '';
                        const varianteNombre = item.variante.nombre_variante ?? '';
                        const descripcion = productoNombre
                          ? varianteNombre
                            ? `${productoNombre} - ${varianteNombre}`
                            : productoNombre
                          : item.variante.nombre_completo;
                        return (
                        <div key={item.variante.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm text-slate-800 truncate">{descripcion}</p>
                              <p className="text-xs text-slate-500">{item.variante.codigo} · {item.variante.marca_nombre || item.variante.producto_base?.marca?.nombre || '—'}</p>
                            </div>
                            <button
                              onClick={() => eliminarItem(item.variante.id)}
                              className="ml-2 text-red-500 hover:text-red-600 font-bold text-lg shrink-0"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-600">Precio:</span>
                              <span className="ml-1 font-semibold text-slate-800">${Number(item.precio_unitario ?? 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Stock:</span>
                              <span className="ml-1 text-slate-700">{item.variante.stock_actual || 0}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 block mb-1">Cantidad:</span>
                              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.variante.id, Math.max(1, item.cantidad - 1))}
                                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-lg"
                                  title="Menos"
                                >
                                  −
                                </button>
                                <span className="min-w-[2.5rem] px-2 py-1.5 text-sm font-semibold text-slate-800 tabular-nums text-center">
                                  {item.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.variante.id, item.cantidad + 1)}
                                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-lg"
                                  title="Más"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col justify-end">
                              <span className="text-slate-600 text-xs">Importe:</span>
                              <span className="text-lg font-bold text-green-600">${Number(item.subtotal ?? 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );})}
                    </div>
                  )}
                </div>
                
                {/* Vista desktop - Tabla */}
                <table className="w-full hidden lg:table">
                  <thead className="sticky top-0" style={{ backgroundColor: '#1E3A8A' }}>
                    <tr>
                      <th className="px-3 lg:px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wide">Código</th>
                      <th className="px-3 lg:px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wide">Descripción</th>
                      <th className="px-3 lg:px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wide">Marca</th>
                      <th className="px-3 lg:px-4 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wide">Precio</th>
                      <th className="px-3 lg:px-4 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wide">Cantidad</th>
                      <th className="px-3 lg:px-4 py-2.5 text-right text-xs font-semibold text-white uppercase tracking-wide">Importe</th>
                      <th className="px-3 lg:px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12" style={{ color: '#D1D5DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Escaneá o buscá un producto para comenzar</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const productoNombre = item.variante.producto_nombre ?? item.variante.producto_base?.nombre ?? '';
                        const varianteNombre = item.variante.nombre_variante ?? '';
                        const descripcion = productoNombre
                          ? varianteNombre
                            ? `${productoNombre} - ${varianteNombre}`
                            : productoNombre
                          : item.variante.nombre_completo;
                        const bgBase = idx % 2 === 0 ? '#ffffff' : '#F9FAFB';
                        return (
                        <tr
                          key={item.variante.id}
                          tabIndex={0}
                          className="border-b border-brand-border transition-colors cart-row-focusable"
                          style={{ backgroundColor: bgBase }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.backgroundColor = bgBase; }}
                          onFocus={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                          onBlur={e => e.currentTarget.style.backgroundColor = bgBase}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              e.currentTarget.nextElementSibling?.focus();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev = e.currentTarget.previousElementSibling;
                              if (prev && prev.tagName === 'TR') prev.focus();
                              else codigoInputRef.current?.focus();
                            } else if (e.key === '+' || e.key === '=') {
                              e.preventDefault();
                              cambiarCantidad(item.variante.id, item.cantidad + 1);
                            } else if (e.key === '-') {
                              e.preventDefault();
                              cambiarCantidad(item.variante.id, Math.max(1, item.cantidad - 1));
                            } else if (e.key === 'Delete') {
                              e.preventDefault();
                              const siguiente = e.currentTarget.nextElementSibling ?? e.currentTarget.previousElementSibling;
                              eliminarItem(item.variante.id);
                              setTimeout(() => siguiente?.focus() ?? codigoInputRef.current?.focus(), 50);
                            }
                          }}
                          title="↑↓ navegar · + aumentar · − disminuir · Del eliminar"
                        >
                          <td className="px-3 lg:px-4 py-2.5 text-xs font-mono" style={{ color: '#6B7280' }}>{item.variante.codigo}</td>
                          <td className="px-3 lg:px-4 py-2.5 text-xs font-medium truncate min-w-0 max-w-[200px]" style={{ color: '#111827' }}>{descripcion}</td>
                          <td className="px-3 lg:px-4 py-2.5 text-xs truncate" style={{ color: '#6B7280' }}>{item.variante.marca_nombre || item.variante.producto_base?.marca?.nombre || '—'}</td>
                          <td className="px-3 lg:px-4 py-2.5 text-center text-xs font-semibold" style={{ color: '#111827' }}>${Number(item.precio_unitario ?? 0).toFixed(2)}</td>
                          <td className="px-3 lg:px-4 py-2.5 text-center">
                            <div className="inline-flex items-center rounded border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => cambiarCantidad(item.variante.id, Math.max(1, item.cantidad - 1))}
                                className="w-7 h-7 flex items-center justify-center font-bold text-base transition-colors"
                                style={{ color: '#374151' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Menos (−)"
                              >−</button>
                              <span className="min-w-[1.75rem] px-1 text-xs font-bold tabular-nums text-center" style={{ color: '#111827' }}>
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => cambiarCantidad(item.variante.id, item.cantidad + 1)}
                                className="w-7 h-7 flex items-center justify-center font-bold text-base transition-colors"
                                style={{ color: '#374151' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Más (+)"
                              >+</button>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-2.5 text-right text-xs font-bold" style={{ color: '#16A34A' }}>
                            ${Number(item.subtotal ?? 0).toFixed(2)}
                          </td>
                          <td className="px-3 lg:px-4 py-2.5 text-center">
                            <button
                              tabIndex={-1}
                              onClick={() => eliminarItem(item.variante.id)}
                              className="w-6 h-6 flex items-center justify-center rounded transition-colors mx-auto"
                              style={{ color: '#DC2626' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="Eliminar (Del)"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      );})
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="border-t px-3 py-2.5 flex justify-between items-center" style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: '#2563EB' }}>
                    {items.length}
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                    {items.length === 1 ? 'producto' : 'productos'} en la venta
                  </span>
                </div>
                <button
                  onClick={() => limpiarVenta()}
                  className="btn-danger px-3 py-1 text-xs"
                >
                  F4 – Cancelar Venta
                </button>
              </div>
            </div>
          </div>
          
          {/* Panel derecho: Cliente + Método + Total + Cobro */}
          <div className="flex flex-col space-y-2.5 min-w-0 lg:w-72 lg:flex-shrink-0 lg:border-l lg:pl-3" style={{ borderColor: '#E5E7EB' }}>

            {/* Cliente */}
            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-brand-border">
              <h3 className="font-bold text-xs mb-2" style={{ color: '#111827' }}>
                Cliente{clienteObligatorio ? <span style={{ color: '#DC2626' }}> *</span> : <span style={{ color: '#6B7280' }}> (opcional)</span>}
              </h3>
              {cliente ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-2 rounded-lg border-l-4" style={{ backgroundColor: '#F3F4F6', borderLeftColor: '#2563EB' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#2563EB' }}>
                      {(cliente.nombre_completo?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate" style={{ color: '#111827' }}>{cliente.nombre_completo}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>DNI: {cliente.dni}{cliente.telefono ? ` · ${cliente.telefono}` : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => setCliente(null)} className="btn-secondary w-full py-1.5 text-xs">
                    Cambiar Cliente
                  </button>
                </div>
              ) : (
                <button onClick={() => setMostrarModalCliente(true)} className="btn-primary w-full py-2 text-sm">
                  Seleccionar Cliente
                </button>
              )}
            </div>

            {/* Método de Pago */}
            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-brand-border">
              <h3 className="font-bold text-xs mb-2" style={{ color: '#111827' }}>
                Método de Pago <span className="font-normal" style={{ color: '#6B7280' }}>(F11)</span>
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'EFECTIVO',          label: 'CONTADO',    activeColor: '#16A34A', activeBorder: '#15803D' },
                  { value: 'TRANSFERENCIA',     label: 'TRANSFER.',  activeColor: '#7C3AED', activeBorder: '#5B21B6' },
                  { value: 'TARJETA',           label: 'TARJETA',    activeColor: '#2563EB', activeBorder: '#1E3A8A' },
                  { value: 'CUENTA_CORRIENTE',  label: 'C. CORR.',   activeColor: '#D97706', activeBorder: '#B45309' },
                ].map(({ value, label, activeColor, activeBorder }) => (
                  <button
                    key={value}
                    onClick={() => cambiarMetodoPago(value)}
                    className="py-1.5 rounded font-bold text-xs transition-all duration-150"
                    style={metodoPago === value
                      ? { backgroundColor: activeColor, color: '#fff', border: `1px solid ${activeBorder}` }
                      : { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>F11 = ciclo · C. CORR. = Cuenta corriente</p>
            </div>

            {/* Totales */}
            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-brand-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{ color: '#111827' }}>Total:</span>
                <span className="text-xl font-black" style={{ color: '#16A34A' }}>${total.toFixed(2)}</span>
              </div>

              {metodoPago === 'CUENTA_CORRIENTE' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Nombre del ticket (ej: Moto 110)
                  </label>
                  <input
                    type="text"
                    value={descripcionTicket}
                    onChange={(e) => setDescripcionTicket(e.target.value)}
                    className="input-field w-full uppercase-input py-2 text-sm"
                    placeholder="Opcional: descripción del trabajo"
                  />
                </div>
              ) : metodoPago === 'TRANSFERENCIA' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Banco / Billetera <span className="font-normal text-[10px]" style={{ color: '#9CA3AF' }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    className="input-field w-full py-2 text-sm"
                    placeholder="Ej: Mercado Pago, Lemon, Banco..."
                    data-no-uppercase
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                    N° de operación se carga desde Ventas al confirmar.
                  </p>
                </div>
              ) : metodoPago === 'EFECTIVO' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>Pagó Con:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pagaCon}
                      onChange={(e) => setPagaCon(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-sm text-right rounded-lg border focus:outline-none focus:ring-2 shadow-sm"
                      style={{ borderColor: '#E5E7EB', color: '#111827' }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <span className="font-bold text-sm" style={{ color: '#111827' }}>Cambio:</span>
                    <span className="text-xl font-black" style={{ color: '#2563EB' }}>
                      ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Avisos */}
            {items.length === 0 && !submitting && (
              <p className="text-xs font-medium px-1" style={{ color: '#D97706' }}>
                Agregá al menos un producto para cobrar.
              </p>
            )}
            {metodoPago === 'CUENTA_CORRIENTE' && items.length > 0 && !cliente && (
              <p className="text-xs font-medium px-1" style={{ color: '#D97706' }}>
                Cuenta corriente requiere cliente.
              </p>
            )}

            {/* Botón COBRAR */}
            <button
              onClick={intentarCobrar}
              disabled={items.length === 0 || submitting || (metodoPago === 'CUENTA_CORRIENTE' && !cliente)}
              className="w-full rounded-lg font-black uppercase tracking-widest transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                padding: '14px 16px',
                fontSize: '15px',
                backgroundColor: items.length === 0 || submitting || (metodoPago === 'CUENTA_CORRIENTE' && !cliente)
                  ? '#9CA3AF'
                  : metodoPago === 'CUENTA_CORRIENTE' ? '#D97706'
                  : metodoPago === 'TRANSFERENCIA'    ? '#7C3AED'
                  : '#16A34A',
                color: '#fff',
                boxShadow: items.length > 0 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {submitting
                ? 'Procesando...'
                : metodoPago === 'CUENTA_CORRIENTE'
                  ? 'F12 – Añadir a CC'
                  : metodoPago === 'TRANSFERENCIA'
                    ? 'F12 – Registrar Transfer.'
                    : 'F12 – Cobrar'}
            </button>

            {/* Presupuesto */}
            <button
              onClick={() => setMostrarPresupuesto(true)}
              disabled={items.length === 0}
              className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Presupuesto
            </button>

            {alertaMargen && (
              <div className="p-2.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
                {alertaMargen}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de búsqueda manual (F10) - Soft UI */}
      {mostrarResultados && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1280px] max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden" onMouseLeave={() => setProductoPreview(null)}>
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Búsqueda de Productos</h2>
              <button
                onClick={() => {
                  setMostrarResultados(false);
                  setBusquedaManual('');
                  setProductosEncontrados([]);
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
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
                  data-no-uppercase
                />
              </form>
            </div>

            <div className="px-3 sm:px-4 md:px-6 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-600">Seleccioná con click o doble click para agregar al ticket</span>
              <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-2.5 py-1">
                {productosEncontrados.length} resultado(s)
              </span>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
              {productosEncontrados.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">
                  No hay resultados. Ingrese un término de búsqueda.
                </p>
              ) : (
                <table className="w-full table-fixed text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 border-b-2 border-slate-200">
                    <tr>
                      <th className="w-[13%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">Código</th>
                      <th className="w-[37%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">Producto</th>
                      <th className="w-[8%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">Variante</th>
                      <th className="w-[13%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">Marca</th>
                      <th className="w-[10%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">Precio</th>
                      <th className="w-[11%] px-2 sm:px-3 py-2.5 text-left font-bold text-slate-700 uppercase">P. Tarjeta</th>
                      <th className="w-[8%] px-2 sm:px-3 py-2.5 text-center font-bold text-slate-700 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosEncontrados.map((variante, idx) => (
                      <tr
                        id={`busqueda-row-${idx}`}
                        key={variante.id}
                        onClick={() => agregarItem(variante)}
                        onDoubleClick={() => agregarItem(variante)}
                        onMouseEnter={() => setProductoPreview(variante)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          idx === indiceSeleccionadoBusqueda
                            ? 'bg-blue-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-2 sm:px-3 py-2.5 font-mono text-slate-800 font-bold break-all">
                          {variante.codigo}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 font-semibold text-slate-800 break-words">
                          {variante.producto_nombre ?? variante.producto_base?.nombre ?? '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 text-slate-600 break-words">
                          {variante.nombre_variante ?? '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 text-slate-600 break-words">
                          {variante.marca_nombre || variante.producto_base?.marca?.nombre || '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap font-bold text-green-600">
                          ${parseFloat(variante.precio_mostrador || 0).toFixed(2)}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap font-semibold text-blue-600">
                          ${parseFloat(variante.precio_tarjeta ?? 0).toFixed(2)}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 text-center">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                            (variante.stock_actual || 0) > 0 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
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
            
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 text-xs sm:text-sm text-slate-600">
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold shadow-sm">Enter</kbd> agregar seleccionado · <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold shadow-sm">↑↓</kbd> mover · <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold shadow-sm">ESC</kbd> cerrar
            </div>
          </div>

          {/* Panel de preview — aparece al hacer hover sobre un resultado */}
          {productoPreview && (
            <div className="hidden lg:block w-56 bg-white rounded-xl border border-slate-200 shadow-lg p-4 flex-shrink-0 self-start mt-0">
              {productoPreview.imagen_url
                ? <img src={productoPreview.imagen_url} alt="" className="w-full aspect-square object-cover rounded-lg mb-3 border border-gray-100" />
                : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )
              }
              <p className="text-xs font-semibold text-gray-800 leading-snug mb-1">{productoPreview.nombre_completo || productoPreview.producto_nombre}</p>
              <p className="text-xs text-gray-400 font-mono mb-2">{productoPreview.codigo}</p>
              {productoPreview.imagen_url === undefined && (
                <p className="text-xs text-orange-500 mb-2">Sin imagen</p>
              )}
              {/* Motos compatibles */}
              {productoPreview.motos_compatibles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">🏍️ Compatible con:</p>
                  <div className="flex flex-wrap gap-1">
                    {productoPreview.motos_compatibles.slice(0, 6).map(m => (
                      <span key={m.id} className="text-xs bg-blue-50 text-brand-blue border border-blue-200 rounded px-1.5 py-0.5">
                        {m.marca} {m.modelo} {m.anio}
                      </span>
                    ))}
                    {productoPreview.motos_compatibles.length > 6 && (
                      <span className="text-xs text-gray-400">+{productoPreview.motos_compatibles.length - 6} más</span>
                    )}
                  </div>
                </div>
              )}
              {(!productoPreview.motos_compatibles || productoPreview.motos_compatibles.length === 0) && (
                <p className="text-xs text-gray-400">Sin compatibilidad asignada</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Modal: ¿Desea agregar un cliente? (al cobrar sin cliente seleccionado) */}
      {mostrarModalAgregarCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full">
            <p className="text-base sm:text-lg font-semibold text-slate-800 mb-4 text-center">
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
                className="flex-1 py-2.5 px-4 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-all"
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

      {/* Modal: Presupuesto - imprimir sin cobro ni descuento de stock */}
      {mostrarPresupuesto && (
        <PresupuestoPrint
          items={items}
          cliente={cliente}
          onClose={() => setMostrarPresupuesto(false)}
        />
      )}
    </div>
  );
}
