import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientesService from '../services/clientesService';

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      loadCliente();
    }
  }, [id]);

  const loadCliente = async () => {
    try {
      const data = await clientesService.getCliente(id);
      setFormData({
        dni: data.dni,
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || '',
        direccion: data.direccion || '',
      });
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      alert('Error al cargar el cliente');
      navigate('/clientes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
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

      if (isEdit) {
        await clientesService.updateCliente(id, formData);
      } else {
        await clientesService.createCliente(formData);
      }

      navigate('/clientes');
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      
      // Manejar errores de validación del backend
      if (error.response?.data) {
        const backendErrors = {};
        Object.keys(error.response.data).forEach(key => {
          backendErrors[key] = Array.isArray(error.response.data[key])
            ? error.response.data[key][0]
            : error.response.data[key];
        });
        setErrors(backendErrors);
      } else {
        alert('Error al guardar el cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clientes')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Clientes
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>

      {/* Formulario */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DNI */}
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              disabled={isEdit} // No se puede editar el DNI
              className={`input-field ${errors.dni ? 'border-red-500' : ''} ${isEdit ? 'bg-gray-100' : ''}`}
              placeholder="Ej: 12345678"
            />
            {errors.dni && (
              <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`input-field ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={`input-field ${errors.telefono ? 'border-red-500' : ''}`}
              placeholder="Ej: 1234567890"
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (opcional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Ej: cliente@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección (opcional)
            </label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              rows={3}
              className={`input-field ${errors.direccion ? 'border-red-500' : ''}`}
              placeholder="Ej: Calle Falsa 123, Ciudad"
            />
            {errors.direccion && (
              <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                isEdit ? 'Guardar Cambios' : 'Crear Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
