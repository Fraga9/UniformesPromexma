// src/components/manager/EmpleadoForm.jsx
import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EmpleadoForm = ({ empleado, isEditing, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: empleado?.id || null,
    nombre: empleado?.nombre || '',
    talla: empleado?.talla || 'M',
    sucursal_id: empleado?.sucursal_id || empleado?.sucursalId || null
  });
  
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.talla) {
      newErrors.talla = 'La talla es requerida';
    }
    if (!formData.sucursal_id) {
      newErrors.sucursal_id = 'La sucursal es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error cuando el campo se edita
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        {isEditing ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 mb-6 md:grid-cols-2">
          <div>
            <label htmlFor="nombre" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ingrese el nombre completo"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="talla" className="block mb-2 text-sm font-medium text-gray-700">
              Talla de Uniforme
            </label>
            <select
              id="talla"
              name="talla"
              value={formData.talla}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.talla ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {TALLAS.map(talla => (
                <option key={talla} value={talla}>{talla}</option>
              ))}
            </select>
            {errors.talla && (
              <p className="mt-1 text-sm text-red-600">{errors.talla}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <X size={18} className="mr-1" />
            Cancelar
          </button>
          
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Save size={18} className="mr-1" />
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmpleadoForm;