import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientesService from '../services/clientesService';
import { getTickets } from '../services/cuentaCorrienteService';
import MetricCard from '../components/MetricCard';
import SoftCard from '../components/SoftCard';
import {
  openWhatsApp,
  buildWaLink,
  msgContactoGenerico,
  msgRecordatorioDeuda,
  msgProductoDisponible,
  msgPresupuestoVencer,
  msgActualizacionPrecio,
} from '../utils/whatsapp';

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [ticketsCC, setTicketsCC] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarAvisos, setMostrarAvisos] = useState(false);
  const [avisoTextoLibre, setAvisoTextoLibre] = useState('');
  const [avisoProd, setAvisoProd] = useState('');
  const [avisoPrecio, setAvisoPrecio] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clienteData, historialData, ticketsData] = await Promise.all([
        clientesService.getCliente(id),
        clientesService.getHistorial(id),
        getTickets({ cliente: id }).catch(() => []),
      ]);
      setCliente(clienteData);
      setHistorial(historialData);
      setTicketsCC(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar el cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-4">
        <div>
          <button
            onClick={() => navigate('/clientes')}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Clientes
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate min-w-0">👤 {cliente.nombre}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">DNI: {cliente.dni}</p>
        </div>
        <div className="flex flex-wrap gap-2 relative">
          {(cliente.whatsapp || cliente.telefono) && (
            <div className="relative">
              <button
                onClick={() => setMostrarAvisos(v => !v)}
                className="px-3 py-2 text-sm font-semibold rounded-lg text-white flex items-center gap-1"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ▾
              </button>

              {mostrarAvisos && (
                <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">Enviar mensaje a {cliente.nombre.split(' ')[0]}</p>

                  {/* Contacto genérico */}
                  <a
                    href={buildWaLink(cliente.whatsapp || cliente.telefono, msgContactoGenerico(cliente.nombre))}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setMostrarAvisos(false)}
                    className="block w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                  >
                    💬 Contacto genérico
                  </a>

                  {/* Recordatorio deuda */}
                  {ticketsCC.filter(t => t.saldo_pendiente > 0).length > 0 && (
                    <a
                      href={buildWaLink(
                        cliente.whatsapp || cliente.telefono,
                        msgRecordatorioDeuda(
                          cliente.nombre,
                          ticketsCC.filter(t => t.saldo_pendiente > 0).reduce((s, t) => s + Number(t.saldo_pendiente), 0)
                        )
                      )}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => setMostrarAvisos(false)}
                      className="block w-full text-left text-sm text-red-700 hover:bg-red-50 rounded-lg px-3 py-2 border border-red-100"
                    >
                      💳 Recordatorio de deuda
                    </a>
                  )}

                  {/* Producto disponible */}
                  <div className="flex gap-1">
                    <input
                      type="text" value={avisoProd} onChange={e => setAvisoProd(e.target.value)}
                      placeholder="Nombre del producto..."
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <a
                      href={avisoProd ? buildWaLink(cliente.whatsapp || cliente.telefono, msgProductoDisponible(cliente.nombre, avisoProd)) : '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => { if (avisoProd) { setMostrarAvisos(false); setAvisoProd(''); } }}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg text-white ${avisoProd ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      style={{ backgroundColor: '#25D366' }}
                    >
                      🔧 Disponible
                    </a>
                  </div>

                  {/* Actualización de precio */}
                  <div className="flex gap-1">
                    <input
                      type="number" value={avisoPrecio} onChange={e => setAvisoPrecio(e.target.value)}
                      placeholder="Nuevo precio..."
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <a
                      href={(avisoProd && avisoPrecio) ? buildWaLink(cliente.whatsapp || cliente.telefono, msgActualizacionPrecio(cliente.nombre, avisoProd, avisoPrecio)) : '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => { if (avisoProd && avisoPrecio) { setMostrarAvisos(false); } }}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg text-white ${(avisoProd && avisoPrecio) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      style={{ backgroundColor: '#25D366' }}
                    >
                      💲 Precio
                    </a>
                  </div>

                  {/* Texto libre */}
                  <div>
                    <textarea
                      value={avisoTextoLibre} onChange={e => setAvisoTextoLibre(e.target.value)}
                      placeholder="Mensaje personalizado..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 mb-1"
                    />
                    <a
                      href={avisoTextoLibre ? buildWaLink(cliente.whatsapp || cliente.telefono, avisoTextoLibre) : '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => { if (avisoTextoLibre) { setMostrarAvisos(false); setAvisoTextoLibre(''); } }}
                      className={`block text-center text-xs font-semibold px-3 py-1.5 rounded-lg text-white ${avisoTextoLibre ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      style={{ backgroundColor: '#25D366' }}
                    >
                      ✉️ Enviar mensaje libre
                    </a>
                  </div>

                  <button
                    onClick={() => setMostrarAvisos(false)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => navigate(`/clientes/${id}/editar`)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Información del Cliente - Soft UI */}
        <div className="lg:col-span-1 space-y-6">
          <SoftCard title="Información del Cliente" icon="📋">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="text-sm font-medium text-gray-800">{cliente.dni}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-800">{cliente.telefono}</p>
              </div>

              {cliente.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.email}</p>
                </div>
              )}

              {cliente.direccion && (
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.direccion}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold rounded-lg border ${
                  cliente.activo
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha de registro</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(cliente.fecha_creacion).toLocaleDateString('es-AR')}
                </p>
              </div>

              {/* Campos extendidos Fase 6 */}
              {cliente.tipo_cliente && (
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.tipo_cliente_display || cliente.tipo_cliente}</p>
                </div>
              )}
              {cliente.whatsapp && (
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.whatsapp}</p>
                </div>
              )}
              {Number(cliente.descuento_habitual) > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Descuento habitual</p>
                  <p className="text-sm font-medium text-green-700">{cliente.descuento_habitual}%</p>
                </div>
              )}
              {Number(cliente.limite_credito) > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Límite de crédito</p>
                  <p className="text-sm font-medium text-slate-800">${Number(cliente.limite_credito).toFixed(2)}</p>
                </div>
              )}
              {/* Saldo CC */}
              {Number(cliente.saldo_cuenta_corriente) > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700">Saldo en cuenta corriente</p>
                  <p className="text-base font-bold text-amber-800">${Number(cliente.saldo_cuenta_corriente).toFixed(2)}</p>
                  {Number(cliente.limite_credito) > 0 && Number(cliente.saldo_cuenta_corriente) > Number(cliente.limite_credito) && (
                    <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Supera el límite de crédito</p>
                  )}
                </div>
              )}
              {cliente.notas && (
                <div>
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{cliente.notas}</p>
                </div>
              )}
            </div>
          </SoftCard>

          {/* Estadísticas - MetricCard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <MetricCard
              title="Total Gastado"
              value={`$${historial?.total_gastado?.toFixed(2) || '0.00'}`}
              icon="💵"
              color="green"
            />
            <MetricCard
              title="Cantidad de Compras"
              value={historial?.cantidad_compras || 0}
              icon="🛒"
              color="blue"
            />
            <MetricCard
              title="Ticket Promedio"
              value={`$${historial?.ticket_promedio?.toFixed(2) || '0.00'}`}
              icon="🎫"
              color="purple"
            />
          </div>
        </div>

        {/* Historial de Compras - Soft UI */}
        <div className="lg:col-span-2">
          <SoftCard title="Historial de Compras" icon="📜">
            {!historial?.ventas?.length ? (
              <div className="text-center py-12">
                <svg className="mx-auto w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-800">Sin compras registradas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Este cliente aún no ha realizado ninguna compra.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Número</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Estado</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {historial.ventas.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(v.fecha).toLocaleDateString('es-AR', { dateStyle: 'short' })} {new Date(v.fecha).toLocaleTimeString('es-AR', { timeStyle: 'short' })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          #{v.numero}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${typeof v.total === 'number' ? v.total.toFixed(2) : v.total}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-800 border border-green-200">
                            Completada
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => navigate(`/ventas/${v.id}`)}
                            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SoftCard>

          {/* Tickets cuenta corriente */}
          <SoftCard title="Tickets cuenta corriente" icon="📋" className="mt-6">
            {!ticketsCC?.length ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Sin tickets a cuenta corriente</p>
                <button
                  onClick={() => navigate('/cuenta-corriente/nuevo')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Crear ticket →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Descripción</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsCC.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">#{t.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.descripcion || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            t.estado === 'A_SALDAR' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {t.estado_display ?? t.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          ${Number(t.total ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/cuenta-corriente/${t.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Ver →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
