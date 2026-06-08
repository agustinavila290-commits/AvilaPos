/**
 * Modal para seleccionar un cliente en el POS.
 * Muestra listado con búsqueda por DNI, nombre, teléfono y botón para agregar cliente nuevo.
 */
import { useState, useEffect, useCallback } from 'react';
import clientesService from '../services/clientesService';
import QuickClienteModal from './QuickClienteModal';

const DEBOUNCE_MS = 300;

export default function SeleccionarClienteModal({ isOpen, onClose, onClienteSeleccionado }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarAgregarCliente, setMostrarAgregarCliente] = useState(false);

  const cargarClientes = useCallback(async (search = '') => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const params = { page_size: 80 };
      if (search.trim()) params.search = search.trim();
      const data = await clientesService.getClientes(params);
      setClientes(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Carga de clientes al abrir y al cambiar búsqueda (debounce)
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => cargarClientes(searchTerm), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [isOpen, searchTerm, cargarClientes]);

  const handleSelect = (cliente) => {
    onClienteSeleccionado(cliente);
    handleClose();
  };

  const handleClienteCreado = (nuevoCliente) => {
    setMostrarAgregarCliente(false);
    onClienteSeleccionado(nuevoCliente);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setClientes([]);
    setMostrarAgregarCliente(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200">
            <div className="px-4 pt-5 pb-2 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Seleccionar cliente
              </h3>

              {/* Búsqueda */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por DNI, nombre o teléfono..."
                  className="flex-1 input-field rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarAgregarCliente(true)}
                  className="px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm whitespace-nowrap hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all"
                >
                  + Agregar cliente
                </button>
              </div>

              {/* Listado */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto bg-slate-50">
                {loading ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    Cargando...
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    {searchTerm.trim() ? 'No hay clientes que coincidan con la búsqueda.' : 'No hay clientes cargados.'}
                    <br />
                    <span className="text-green-600 font-medium">Usá &quot;Agregar cliente&quot; para dar de alta uno nuevo.</span>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {clientes.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(c)}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors focus:outline-none focus:bg-blue-50"
                        >
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {c.nombre_completo ?? c.nombre}
                          </p>
                          <p className="text-xs text-slate-600">
                            DNI: {c.dni}
                            {c.telefono ? ` · Tel: ${c.telefono}` : ''}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 sm:px-5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de alta rápida (se abre al hacer clic en "Agregar cliente") */}
      {mostrarAgregarCliente && (
        <QuickClienteModal
          isOpen={true}
          onClose={() => setMostrarAgregarCliente(false)}
          onClienteCreated={handleClienteCreado}
        />
      )}
    </>
  );
}
