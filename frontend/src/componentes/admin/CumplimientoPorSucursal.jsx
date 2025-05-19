// src/components/admin/CumplimientoPorSucursal.jsx
import React, { useState } from 'react';
import { AlertTriangle, Building, CheckCircle, CheckSquare, ChevronRight, Filter } from 'lucide-react';

const CumplimientoPorSucursal = ({ sucursales, empleados }) => {
  const [filterZona, setFilterZona] = useState('');
  
  // Obtener zonas únicas para el filtro
  const zonasUnicas = [...new Set(sucursales.map(s => s.zona))].filter(Boolean);

  // Calcular porcentaje de cumplimiento por sucursal
  const calcularCumplimiento = () => {
    return sucursales.map(sucursal => {
      const empleadosSucursal = empleados.filter(emp => emp.sucursal_id === sucursal.id);
      const totalEmpleados = empleadosSucursal.length;
      const empleadosConTalla = empleadosSucursal.filter(emp => 
        emp.talla && emp.talla !== 'Por definir'
      ).length;
      
      const porcentaje = totalEmpleados > 0 
        ? Math.round((empleadosConTalla / totalEmpleados) * 100) 
        : 0;
        
      return {
        ...sucursal,
        totalEmpleados,
        empleadosConTalla,
        porcentajeCumplimiento: porcentaje,
        empleadosPendientes: totalEmpleados - empleadosConTalla
      };
    });
  };

  // Obtener datos de cumplimiento
  const datosCumplimiento = calcularCumplimiento();
  
  // Filtrar solo sucursales con cumplimiento incompleto (menos de 100%)
  const sucursalesIncompletas = datosCumplimiento
    .filter(sucursal => sucursal.porcentajeCumplimiento < 100 && sucursal.totalEmpleados > 0)
    .filter(sucursal => filterZona ? sucursal.zona === filterZona : true)
    .sort((a, b) => a.porcentajeCumplimiento - b.porcentajeCumplimiento);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Building className="mr-2 text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">
            Cumplimiento por Sucursal
          </h2>
        </div>
        <div className="flex items-center">
          <div className="relative mr-2">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Filter size={14} className="text-gray-400" />
            </div>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Todas las zonas</option>
              {zonasUnicas.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {sucursalesIncompletas.length} {sucursalesIncompletas.length === 1 ? 'sucursal pendiente' : 'sucursales pendientes'}
          </div>
        </div>
      </div>

      {sucursalesIncompletas.length > 0 ? (
        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
          {sucursalesIncompletas.map(sucursal => (
            <div 
              key={sucursal.id} 
              className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {sucursal.porcentajeCumplimiento < 50 ? (
                    <div className="p-1.5 bg-red-100 text-red-600 rounded-md mr-2">
                      <AlertTriangle size={16} />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md mr-2">
                      <CheckSquare size={16} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">{sucursal.nombre}</h3>
                    <p className="text-xs text-gray-500">{sucursal.ubicacion_pdv}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {sucursal.zona}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    sucursal.porcentajeCumplimiento < 50 ? 'bg-red-500' : 
                    sucursal.porcentajeCumplimiento < 80 ? 'bg-amber-500' : 'bg-blue-600'
                  }`} 
                  style={{ width: `${sucursal.porcentajeCumplimiento}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>
                  <span className="font-medium">{sucursal.porcentajeCumplimiento}%</span> completado
                </span>
                <span>
                  <span className="font-medium text-red-600">{sucursal.empleadosPendientes}</span> pendientes
                </span>
                <span>
                  <span className="font-medium">{sucursal.empleadosConTalla}</span> / {sucursal.totalEmpleados} empleados
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
          <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
          <h3 className="font-medium text-green-800 mb-1">¡Todas las sucursales completadas!</h3>
          <p className="text-sm text-green-600">Todas las sucursales tienen sus tallas asignadas al 100%</p>
        </div>
      )}
    </div>
  );
};

export default CumplimientoPorSucursal;