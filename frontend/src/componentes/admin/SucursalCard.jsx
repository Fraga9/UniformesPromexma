// src/components/admin/SucursalCard.jsx
import React, { useState } from 'react';
import { Building, ChevronDown, ChevronUp, User } from 'lucide-react';
import TallasResumen from '../common/TallasResumen';

const SucursalCard = ({ sucursal, empleados }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Building className="mr-2 text-blue-600" size={20} />
          <h3 className="text-lg font-semibold">{sucursal.nombre}</h3>
        </div>
        <button className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>Manager: {sucursal.manager}</p>
        <p>Total empleados: {empleados.length}</p>
      </div>
      
      <div className="mt-3">
        <TallasResumen empleados={empleados} showChart={false} />
      </div>
      
      {expanded && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="mb-2 font-medium flex items-center">
            <User size={16} className="mr-1" />
            Listado de Empleados
          </h4>
          
          {empleados.length > 0 ? (
            <div className="overflow-y-auto max-h-48">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-center">Talla</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map(empleado => (
                    <tr key={empleado.id} className="border-b border-gray-100">
                      <td className="p-2">{empleado.nombre}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                          {empleado.talla}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
              No hay empleados registrados en esta sucursal.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SucursalCard;