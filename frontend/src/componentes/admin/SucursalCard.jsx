// src/components/admin/SucursalCard.jsx
import React, { useState } from 'react';
import { Building, ChevronDown, ChevronUp, User, MapPin, Users, Calendar, Mail } from 'lucide-react';
import TallasResumen from '../common/TallasResumen';

const SucursalCard = ({ sucursal, empleados }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calcular estadísticas de tallas
  const tallasCount = empleados.reduce((acc, emp) => {
    const talla = emp.talla || 'Por definir';
    acc[talla] = (acc[talla] || 0) + 1;
    return acc;
  }, {});

  // Ver si hay alguna persona sin talla definida
  const pendientesTalla = empleados.filter(emp => 
    emp.talla === 'Por definir' || !emp.talla
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      {/* Encabezado */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{sucursal.nombre}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin size={14} className="mr-1" /> {sucursal.ubicacion_pdv || 'Ubicación no especificada'}
              </p>
            </div>
          </div>
          <button className="p-2 bg-white text-blue-600 hover:bg-blue-50 transition-colors rounded-full">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {/* Información básica */}
      <div className="p-4">
        <div className="flex flex-wrap -mx-2">
          <div className="px-2 w-1/2">
            <div className="flex items-center mb-2">
              <User size={16} className="mr-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Manager:</span>
            </div>
            <p className="text-sm text-gray-800 ml-6">{sucursal.manager}</p>
          </div>
          
          <div className="px-2 w-1/2">
            <div className="flex items-center mb-2">
              <Users size={16} className="mr-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Empleados:</span>
            </div>
            <div className="ml-6 flex items-center">
              <span className="text-xl font-bold text-blue-700">{empleados.length}</span>
              {pendientesTalla > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {pendientesTalla} sin talla
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón para ver más detalles de la sucursal */}
        {sucursal.zona && (
          <div className="mt-3">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver más detalles'}
              {showDetails ? (
                <ChevronUp size={16} className="ml-1" />
              ) : (
                <ChevronDown size={16} className="ml-1" />
              )}
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600">Zona: <span className="text-gray-800">{sucursal.zona}</span></p>
                  <p className="text-gray-600">Gerencia: <span className="text-gray-800">{sucursal.gerencia}</span></p>
                </div>
                <div>
                  <p className="text-gray-600">Región: <span className="text-gray-800">{sucursal.region}</span></p>
                  <p className="text-gray-600">PDV: <span className="text-gray-800">{sucursal.pdv}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Resumen de tallas */}
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Distribución de Tallas</h4>
          <span className="text-xs text-gray-500">Total: {empleados.length}</span>
        </div>
        
        <TallasResumen empleados={empleados} showChart={false} />
      </div>
      
      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center text-gray-800">
                <User size={16} className="mr-2 text-blue-600" />
                Listado de Empleados
              </h4>
              
              {empleados.length > 0 && (
                <span className="text-xs text-gray-500">
                  {empleados.length} {empleados.length === 1 ? 'empleado' : 'empleados'}
                </span>
              )}
            </div>
            
            {empleados.length > 0 ? (
              <div className="overflow-y-auto max-h-64 rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Puesto</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">Talla</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {empleados.map(empleado => (
                      <tr key={empleado.id} className="hover:bg-blue-50">
                        <td className="px-3 py-3">
                          <div>
                            <div className="font-medium text-gray-800">{empleado.nombre}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Mail size={12} className="mr-1" />
                              {empleado.email?.toLowerCase() || 'No disponible'}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-700">{empleado.puesto_homologado || empleado.puesto_hc}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar size={12} className="mr-1" />
                            Ingreso: {empleado.fecha_ingreso?.split('-').reverse().join('/') || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {empleado.talla && empleado.talla !== 'Por definir' ? (
                            <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                              {empleado.talla}
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full">
                              Por definir
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md flex items-center justify-center">
                <Users size={18} className="mr-2 text-gray-400" />
                No hay empleados registrados en esta sucursal.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SucursalCard;