import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showResumen, setShowResumen] = useState(false);

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
      puesto_homologado: '',
      requiere_playera_administrativa: false,
      talla_administrativa: 'M',
      sucursal_id: parseInt(sucursalId)
    });
    setIsEditing(false);
    setShowForm(true);
    // Scroll al inicio del formulario en móvil
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditEmpleado = (empleado) => {
    // Asegurarse de que empleado tenga todos los campos necesarios
    const empleadoCompleto = {
      ...empleado,
      requiere_playera_administrativa: empleado.requiere_playera_administrativa || false,
      talla_administrativa: empleado.talla_administrativa || empleado.talla || 'M'
    };
    
    setCurrentEmpleado(empleadoCompleto);
    setIsEditing(true);
    setShowForm(true);
    // Scroll al inicio del formulario en móvil
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleUpdateTalla = async (id, datosActualizados) => {
    try {
      const empleado = empleados.find(emp => emp.id === id);
      if (!empleado) return;

      // datosActualizados puede ser un objeto completo o solo un valor de talla
      let datosAEnviar;
      
      if (typeof datosActualizados === 'string') {
        // Si es un string, asumimos que es la talla principal
        datosAEnviar = { ...empleado, talla: datosActualizados };
      } else {
        // Si es un objeto, lo usamos directamente
        datosAEnviar = { ...empleado, ...datosActualizados };
      }

      const updated = await updateEmpleado(id, datosAEnviar);
      setEmpleados(empleados.map(emp => emp.id === id ? updated : emp));
      setHasChanges(true);
    } catch (err) {
      setError('Error al actualizar la información: ' + err.message);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Función para contar empleados con talla administrativa
  const contarEmpleadosConPlayeraAdmin = () => {
    return empleados.filter(emp => emp.requiere_playera_administrativa).length;
  };

  // Función para contar empleados con talla administrativa indefinida
  const contarEmpleadosSinTallaAdmin = () => {
    return empleados.filter(emp => 
      emp.requiere_playera_administrativa && 
      (!emp.talla_administrativa || emp.talla_administrativa === 'Por definir')
    ).length;
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
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Gestión de Uniformes - {sucursal?.nombre || 'Sucursal'}
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Aquí puedes gestionar los empleados y sus tallas de uniformes
        </p>
      </div>

      {error && (
        <div className="p-3 md:p-4 mb-4 text-red-700 bg-red-100 rounded-md flex items-center text-sm">
          <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
          <span className="flex-grow">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 md:p-4 mb-4 text-green-700 bg-green-100 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {hasChanges && (
        <div className="p-3 md:p-4 mb-4 text-blue-700 bg-blue-100 rounded-md flex items-center text-sm">
          <Save className="mr-2 flex-shrink-0" size={18} />
          <span className="flex-grow">Los cambios han sido guardados automáticamente.</span>
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
        <div className="mb-4 md:mb-6 flex justify-between items-center">
          <button
            onClick={handleAddEmpleado}
            className="flex items-center px-3 py-2 text-sm md:text-base text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <PlusCircle className="mr-1 md:mr-2" size={18} />
            Agregar Empleado
          </button>
          
          {/* Botón para mostrar/ocultar resumen en móvil */}
          <button
            onClick={() => setShowResumen(!showResumen)}
            className="md:hidden flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {showResumen ? (
              <>
                <ChevronUp size={18} className="mr-1" />
                Ocultar resumen
              </>
            ) : (
              <>
                <ChevronDown size={18} className="mr-1" />
                Ver resumen
              </>
            )}
          </button>
        </div>
      )}

      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="p-3 md:p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-gray-800">
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
        
        {/* Panel de resumen - visible en escritorio o cuando se activa en móvil */}
        <div className={`${!showResumen && 'hidden'} md:block`}>
          <div className="p-3 md:p-6 bg-white rounded-lg shadow-md md:sticky md:top-6">
            <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-gray-800">
              Resumen de Tallas
            </h2>
            
            {/* Gráfico principal de tallas */}
            <TallasResumen 
              empleados={empleados} 
              tallaField="talla"
              showChart={true}
            />
            
            {/* Resumen de tallas administrativas */}
            {contarEmpleadosConPlayeraAdmin() > 0 && (
              <div className="mt-6 pt-3 border-t border-gray-200">
                <h3 className="mb-3 text-base md:text-lg font-medium text-gray-800 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 mr-2 bg-blue-100 text-blue-600 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Tallas Construrama
                </h3>
                
                <TallasResumen 
                  empleados={empleados.filter(emp => emp.requiere_playera_administrativa)}
                  tallaField="talla_administrativa"
                  showChart={contarEmpleadosConPlayeraAdmin() > 3} // Solo mostrar gráfico si hay suficientes datos
                  emptyLabel="Por definir"
                />
                
                <div className="mt-3 p-2 md:p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex items-center text-xs md:text-sm text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                      {contarEmpleadosConPlayeraAdmin()} empleado(s) requieren playera administrativa
                      {contarEmpleadosSinTallaAdmin() > 0 && (
                        <span className="text-amber-600 font-medium ml-1">
                          ({contarEmpleadosSinTallaAdmin()} sin definir)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botón para cerrar resumen en móvil */}
            <div className="mt-4 md:hidden">
              <button
                onClick={() => setShowResumen(false)}
                className="w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cerrar resumen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
