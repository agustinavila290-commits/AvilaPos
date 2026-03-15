/**
 * Formulario para abrir nuevo ticket de cuenta corriente
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTicket } from '../services/cuentaCorrienteService';
import clientesService from '../services/clientesService';
import { getDepositos } from '../services/inventarioService';

export default function NuevoTicketCC() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    deposito_id: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cli, dep] = await Promise.all([
          clientesService.getClientes(),
          getDepositos(),
        ]);
        const cliList = cli?.results ?? cli ?? [];
        const depList = dep ?? [];
        setClientes(Array.isArray(cliList) ? cliList : []);
        setDepositos(Array.isArray(depList) ? depList : []);
        if (depList.length > 0 && !form.deposito_id) {
          const principal = depList.find((d) => d.es_principal) ?? depList[0];
          setForm((f) => ({ ...f, deposito_id: String(principal.id) }));
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar datos');
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.cliente_id || !form.deposito_id) {
      setError('Cliente y depósito son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const ticket = await crearTicket({
        cliente_id: Number(form.cliente_id),
        deposito_id: Number(form.deposito_id),
        descripcion: form.descripcion || '',
      });
      navigate(`/cuenta-corriente/${ticket.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <button
          onClick={() => navigate('/cuenta-corriente')}
          className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-1"
        >
          ← Volver a tickets
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Nuevo ticket cuenta corriente</h1>
        <p className="text-sm text-gray-600 mt-1">
          Selecciona cliente y depósito. La descripción ayuda a identificar el trabajo (ej. Moto
          110).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <select
            required
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            className="input-field w-full"
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (DNI: {c.dni})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Depósito *</label>
          <select
            required
            value={form.deposito_id}
            onChange={(e) => setForm({ ...form, deposito_id: e.target.value })}
            className="input-field w-full"
            disabled={depositos.length === 0}
          >
            <option value="">
              {depositos.length === 0
                ? 'No hay depósitos. Crear uno en Configuración o Inventario.'
                : 'Seleccionar depósito'}
            </option>
            {depositos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
                {d.es_principal ? ' (Principal)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Moto 110, Reparación Juan"
            className="input-field w-full uppercase-input"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creando...' : 'Abrir ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cuenta-corriente')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
