/**
 * Listado de tickets de cuenta corriente
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../services/cuentaCorrienteService';
import clientesService from '../services/clientesService';
export default function CuentaCorriente() {
  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ cliente: '', estado: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarTickets();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      const [clientesData] = await Promise.all([
        clientesService.getClientes(),
      ]);
      setClientes(Array.isArray(clientesData?.results) ? clientesData.results : clientesData ?? []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const cargarTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.estado) params.estado = filtros.estado;
      const data = await getTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (str) => {
    if (!str) return '-';
    return new Date(str).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
      Number(v ?? 0)
    );

  const getEstadoBadge = (estado) => {
    if (estado === 'A_SALDAR') return 'bg-amber-100 text-amber-800';
    if (estado === 'ABONADO') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Tickets Cuenta Corriente
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gestiona tickets de mecánicos (agregar/devolver productos hasta abonar)
          </p>
        </div>
        <Link
          to="/cuenta-corriente/nuevo"
          className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
        >
          + Nuevo Ticket
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={filtros.cliente}
              onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Todos</option>
              <option value="A_SALDAR">A saldar</option>
              <option value="ABONADO">Abonado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando tickets...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay tickets registrados</p>
              <Link
                to="/cuenta-corriente/nuevo"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Crear primer ticket
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">#{t.numero}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{t.cliente_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.descripcion || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(
                            t.estado
                          )}`}
                        >
                          {t.estado_display ?? t.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(t.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatFecha(t.fecha_apertura)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/cuenta-corriente/${t.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
