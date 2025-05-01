// src/components/manager/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, AlertTriangle } from 'lucide-react';
import { fetchEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } from '../../api';
import EmpleadoForm from './EmpleadoForm';
import EmpleadosList from './EmpleadosList';
import TallasResumen from '../common/TallasResumen';

const ManagerDashboard = ({ sucursalId, sucursales }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentEmpleado, setCurrentEmpleado] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const sucursal = sucursales.find(s => s.id === parseInt(sucursalId));

  // Cargar empleados de la sucursal
  useEffect(() => {
    loadEmpleados();
  }, [sucursalId]);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEmpleados(sucursalId);
      setEmpleados(data);
      setHasChanges(false);
    } catch (err) {
      setError('Error al cargar los empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmpleado = () => {
    setCurrentEmpleado({
      nombre: '',
      talla: 'M',
      sucursal_id: parseInt(sucursalId)
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditEmpleado = (empleado) => {
    setCurrentEmpleado(empleado);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteEmpleado = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteEmpleado(id);
      setEmpleados(empleados.filter(emp => emp.id !== id));
      showSuccess('Empleado eliminado correctamente');
      setHasChanges(true);
    } catch (err) {
      setError('Error al eliminar el empleado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmpleado = async (empleadoData) => {
    try {
      setLoading(true);
      
      if (isEditing) {
        const updated = await updateEmpleado(empleadoData.id, empleadoData);
        setEmpleados(empleados.map(emp => emp.id === updated.id ? updated : emp));
        showSuccess('Empleado actualizado correctamente');
      } else {
        const created = await createEmpleado(empleadoData);
        setEmpleados([...empleados, created]);
        showSuccess('Empleado agregado correctamente');
      }
      
      setShowForm(false);
      setHasChanges(true);
    } catch (err) {
      setError('Error al guardar el empleado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const handleUpdateTalla = async (id, talla) => {
    try {
      const empleado = empleados.find(emp => emp.id === id);
      if (!empleado) return;

      const updated = await updateEmpleado(id, { ...empleado, talla });
      setEmpleados(empleados.map(emp => emp.id === id ? updated : emp));
      setHasChanges(true);
    } catch (err) {
      setError('Error al actualizar la talla: ' + err.message);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  if (loading && empleados.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-blue-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Gestión de Uniformes - {sucursal?.nombre || 'Sucursal'}
        </h1>
        <p className="text-gray-600">
          Aquí puedes gestionar los empleados y sus tallas de uniformes
        </p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md">
          {successMessage}
        </div>
      )}

      {hasChanges && (
        <div className="p-4 mb-4 text-blue-700 bg-blue-100 rounded-md flex items-center">
          <Save className="mr-2" />
          Los cambios han sido guardados automáticamente.
        </div>
      )}

      {showForm ? (
        <EmpleadoForm
          empleado={currentEmpleado}
          isEditing={isEditing}
          onSubmit={handleSubmitEmpleado}
          onCancel={handleCancelForm}
        />
      ) : (
        <div className="mb-6">
          <button
            onClick={handleAddEmpleado}
            className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <PlusCircle className="mr-2" size={18} />
            Agregar Empleado
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Empleados y Tallas
            </h2>
            
            <EmpleadosList
              empleados={empleados}
              onEditEmpleado={handleEditEmpleado}
              onDeleteEmpleado={handleDeleteEmpleado}
              onUpdateTalla={handleUpdateTalla}
            />
          </div>
        </div>
        
        <div>
          <div className="p-6 bg-white rounded-lg shadow-md sticky top-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Resumen de Tallas
            </h2>
            
            <TallasResumen empleados={empleados} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;