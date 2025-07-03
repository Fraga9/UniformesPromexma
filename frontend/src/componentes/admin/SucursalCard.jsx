// src/components/admin/SucursalCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MapPin, 
  Users, 
  Settings,
  AlertCircle,
  CheckCircle,
  Package,
  PackageCheck,
  Loader
} from 'lucide-react';
import { updateSucursal } from '../../api';
import TallasResumen from '../common/TallasResumen';

const SucursalCard = ({ sucursal, empleados, onSucursalUpdate, onError, onSuccess }) => {
  const [expanded, setExpanded] = useState(false);
  const [updatingPackage, setUpdatingPackage] = useState(false);
  const navigate = useNavigate();

  // Calcular métricas clave
  const totalEmpleados = empleados.length;
  const empleadosConTalla = empleados.filter(emp => 
    emp.talla && emp.talla !== 'Por definir'
  ).length;
  const porcentajeCompleto = totalEmpleados > 0 ? Math.round((empleadosConTalla / totalEmpleados) * 100) : 0;
  
  // Estado general
  const estaCompleto = porcentajeCompleto === 100;
  const necesitaAtencion = porcentajeCompleto < 50;

  const handleGestionarClick = (e) => {
    e.stopPropagation();
    navigate(`/admin/sucursal/${sucursal.id}`);
  };

  const handlePackageToggle = async (e) => {
    e.stopPropagation();
    
    // Si no hay callback de actualización, no hacer nada
    if (!onSucursalUpdate) {
      console.warn('onSucursalUpdate no está disponible en SucursalCard');
      return;
    }
    
    try {
      setUpdatingPackage(true);
      
      // Limpiar errores previos
      if (onError) {
        onError('');
      }
      
      const newStatus = !sucursal.is_empaquetado;
      
      // Preparar datos igual que en SucursalInfoCard
      const updateData = {
        is_empaquetado: newStatus
      };
      
      // Llamar a la API igual que en SucursalInfoCard
      const sucursalActualizada = await updateSucursal(sucursal.id, updateData);

      // Actualizar estado en componente padre
      onSucursalUpdate(sucursalActualizada);
      
      // Mostrar mensaje de éxito
      if (onSuccess) {
        onSuccess(`Estado de empaquetado actualizado correctamente`);
      }

    } catch (err) {
      console.error('Error actualizando estado de empaquetado:', err);
      if (onError) {
        onError('Error al actualizar: ' + err.message);
      } else {
        // Fallback si no hay manejo de errores
        alert('Error al actualizar el estado: ' + err.message);
      }
    } finally {
      setUpdatingPackage(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden">
      {/* Header Principal - Muy Compacto */}
      <div className="p-4">
        {/* Fila 1: Nombre y Estado Visual */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              estaCompleto ? 'bg-emerald-100 text-emerald-700' : 
              necesitaAtencion ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Building size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
                {sucursal.nombre}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center truncate">
                  <MapPin size={10} className="mr-1 flex-shrink-0" />
                  {sucursal.ubicacion_pdv || 'Sin ubicación'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {estaCompleto ? (
              <CheckCircle size={18} className="text-emerald-600" />
            ) : necesitaAtencion ? (
              <AlertCircle size={18} className="text-red-600" />
            ) : (
              <AlertCircle size={18} className="text-amber-600" />
            )}
          </div>
        </div>

        {/* Fila 2: Manager y Métricas */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-xs text-gray-600 min-w-0 flex-1">
            <User size={10} className="mr-1 flex-shrink-0" />
            <span className="truncate">{sucursal.manager || 'Sin manager'}</span>
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <div className={`text-sm font-bold leading-none ${
                estaCompleto ? 'text-emerald-600' : 
                necesitaAtencion ? 'text-red-600' : 'text-amber-600'
              }`}>
                {empleadosConTalla}/{totalEmpleados}
              </div>
              <div className="text-xs text-gray-500">tallas</div>
            </div>
          </div>
        </div>

        {/* Fila 3: Barra de Progreso */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progreso</span>
            <span className="font-medium">{porcentajeCompleto}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                estaCompleto ? 'bg-emerald-500' : 
                necesitaAtencion ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${porcentajeCompleto}%` }}
            />
          </div>
        </div>

        {/* Fila 4: Acciones */}
        <div className="flex items-center justify-between space-x-2">
          {/* Toggle de Empaquetado */}
          <button
            onClick={handlePackageToggle}
            disabled={updatingPackage}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              sucursal.is_empaquetado
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${updatingPackage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {updatingPackage ? (
              <Loader size={12} className="mr-1 animate-spin" />
            ) : sucursal.is_empaquetado ? (
              <PackageCheck size={12} className="mr-1" />
            ) : (
              <Package size={12} className="mr-1" />
            )}
            <span className="hidden sm:inline">
              {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
            </span>
          </button>

          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleGestionarClick}
              className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg text-xs font-medium flex items-center"
            >
              <Settings size={12} className="mr-1" />
              <span className="hidden sm:inline">Gestionar</span>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido Expandido */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-4 space-y-4">
            {/* Info administrativa compacta */}
            {(sucursal.zona || sucursal.numero_seguimiento) && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                {sucursal.zona && (
                  <div>
                    <span className="text-gray-500">Zona:</span>
                    <div className="font-medium text-gray-800">{sucursal.zona}</div>
                  </div>
                )}
                {sucursal.numero_seguimiento && (
                  <div>
                    <span className="text-gray-500">Seguimiento:</span>
                    <div className="font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
                      {sucursal.numero_seguimiento}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de tallas compacto */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Distribución de Tallas
              </h4>
              <TallasResumen empleados={empleados} compact={true} />
            </div>

            {/* Empleados sin talla - Solo los críticos */}
            {empleados.length > empleadosConTalla && (
              <div>
                <h4 className="text-xs font-medium text-red-700 mb-2 uppercase tracking-wide flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  Sin Talla ({empleados.length - empleadosConTalla})
                </h4>
                <div className="bg-white rounded-lg border border-red-100 p-2 max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {empleados
                      .filter(emp => !emp.talla || emp.talla === 'Por definir')
                      .slice(0, 5) // Solo mostrar primeros 5
                      .map(empleado => (
                        <div key={empleado.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-800 font-medium truncate">{empleado.nombre}</span>
                          <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                            {(empleado.puesto_homologado || empleado.puesto_hc || '').slice(0, 15)}...
                          </span>
                        </div>
                      ))
                    }
                    {(empleados.length - empleadosConTalla) > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-1 border-t">
                        +{(empleados.length - empleadosConTalla) - 5} más...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SucursalCard;