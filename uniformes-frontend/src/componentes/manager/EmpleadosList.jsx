// src/components/manager/EmpleadosList.jsx
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EmpleadosList = ({ empleados, onEditEmpleado, onDeleteEmpleado, onUpdateTalla }) => {
  if (empleados.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-md">
        <p className="text-gray-500">No hay empleados registrados. Agrega uno para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left text-gray-600">Nombre</th>
            <th className="p-3 text-left text-gray-600">Talla</th>
            <th className="p-3 text-center text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado) => (
            <tr key={empleado.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-3">{empleado.nombre}</td>
              <td className="p-3">
                <select
                  value={empleado.talla}
                  onChange={(e) => onUpdateTalla(empleado.id, e.target.value)}
                  className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TALLAS.map(talla => (
                    <option key={talla} value={talla}>{talla}</option>
                  ))}
                </select>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onEditEmpleado(empleado)}
                    className="p-1 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
                    title="Editar empleado"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteEmpleado(empleado.id)}
                    className="p-1 text-red-600 bg-red-100 rounded-full hover:bg-red-200"
                    title="Eliminar empleado"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmpleadosList;