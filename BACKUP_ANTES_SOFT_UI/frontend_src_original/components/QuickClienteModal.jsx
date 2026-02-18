import { useState } from 'react';
import clientesService from '../services/clientesService';

export default function QuickClienteModal({ isOpen, onClose, onClienteCreated }) {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    telefono: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDNIBlur = async () => {
    if (formData.dni.trim()) {
      try {
        setSearching(true);
        const result = await clientesService.buscarPorDNI(formData.dni);
        
        if (result.exists) {
          // Cliente ya existe, autocompletar y cerrar
          onClienteCreated(result.cliente);
          handleClose();
        }
      } catch (error) {
        console.error('Error al buscar DNI:', error);
      } finally {
        setSearching(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es obligatorio';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const cliente = await clientesService.quickCreate(formData);
      onClienteCreated(cliente);
      handleClose();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      
      if (error.response?.data) {
        const backendErrors = {};
        Object.keys(error.response.data).forEach(key => {
          backendErrors[key] = Array.isArray(error.response.data[key])
            ? error.response.data[key][0]
            : error.response.data[key];
        });
        setErrors(backendErrors);
      } else {
        alert('Error al crear el cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ dni: '', nombre: '', telefono: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Alta Rápida de Cliente
                  </h3>
                  
                  <div className="space-y-4">
                    {/* DNI */}
                    <div>
                      <label htmlFor="quick-dni" className="block text-sm font-medium text-gray-700 mb-1">
                        DNI <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="quick-dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        onBlur={handleDNIBlur}
                        className={`input-field ${errors.dni ? 'border-red-500' : ''}`}
                        placeholder="Ej: 12345678"
                        autoFocus
                        disabled={loading || searching}
                      />
                      {searching && (
                        <p className="mt-1 text-sm text-blue-600">Buscando cliente...</p>
                      )}
                      {errors.dni && (
                        <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
                      )}
                    </div>

                    {/* Nombre */}
                    <div>
                      <label htmlFor="quick-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="quick-nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`input-field ${errors.nombre ? 'border-red-500' : ''}`}
                        placeholder="Ej: Juan Pérez"
                        disabled={loading}
                      />
                      {errors.nombre && (
                        <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                      )}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label htmlFor="quick-telefono" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="quick-telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className={`input-field ${errors.telefono ? 'border-red-500' : ''}`}
                        placeholder="Ej: 1234567890"
                        disabled={loading}
                      />
                      {errors.telefono && (
                        <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Tip: Al salir del campo DNI, el sistema verificará si el cliente ya existe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-primary-300 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Cliente'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
