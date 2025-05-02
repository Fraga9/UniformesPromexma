// src/components/manager/EmpleadosList.jsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Filter, Download, ArrowUpDown, AlertCircle } from 'lucide-react';

// Lista ampliada de tallas considerando las necesidades de uniformes
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Por definir'];

const EmpleadosList = ({ empleados, onEditEmpleado, onDeleteEmpleado, onUpdateTalla }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmpleados, setFilteredEmpleados] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [filterByTalla, setFilterByTalla] = useState('');
  const [selectedEmpleados, setSelectedEmpleados] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Estado para manejar el modo de edición inline de tallas
  const [editingTallaId, setEditingTallaId] = useState(null);

  useEffect(() => {
    let result = [...empleados];
    
    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(emp => 
        emp.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtro por talla
    if (filterByTalla) {
      result = result.filter(emp => emp.talla === filterByTalla);
    }
    
    // Aplicar ordenamiento
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredEmpleados(result);
  }, [empleados, searchTerm, sortConfig, filterByTalla]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmpleados(filteredEmpleados.map(emp => emp.id));
      setShowBulkActions(true);
    } else {
      setSelectedEmpleados([]);
      setShowBulkActions(false);
    }
  };

  const handleSelectEmpleado = (id) => {
    const newSelected = [...selectedEmpleados];
    if (newSelected.includes(id)) {
      const index = newSelected.indexOf(id);
      newSelected.splice(index, 1);
    } else {
      newSelected.push(id);
    }
    setSelectedEmpleados(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const bulkUpdateTalla = (talla) => {
    selectedEmpleados.forEach(id => {
      onUpdateTalla(id, talla);
    });
    setSelectedEmpleados([]);
    setShowBulkActions(false);
  };

  const handleExportCSV = () => {
    // Implementar la exportación a CSV
    const selectedData = empleados.filter(emp => selectedEmpleados.includes(emp.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nombre,Sucursal ID,Talla\n" 
      + selectedData.map(emp => `${emp.id},"${emp.nombre}",${emp.sucursal_id},"${emp.talla}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "empleados_uniformes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTallaClick = (id) => {
    setEditingTallaId(id);
  };

  const handleTallaBlur = () => {
    setEditingTallaId(null);
  };

  const countTallaPorDefinir = () => {
    return empleados.filter(emp => emp.talla === 'Por definir').length;
  };

  if (empleados.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-md shadow-sm border border-gray-200">
        <p className="text-gray-500">No hay empleados registrados. Agrega uno para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Alerta para tallas por definir */}
      {countTallaPorDefinir() > 0 && (
        <div className="p-3 m-4 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-700">
          <AlertCircle size={20} className="mr-2" />
          <span>
            <strong>{countTallaPorDefinir()}</strong> empleado(s) tienen talla "Por definir".
            Es importante asignar tallas correctas para el pedido de uniformes.
          </span>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterByTalla}
                onChange={(e) => setFilterByTalla(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pl-9"
              >
                <option value="">Todas las tallas</option>
                {TALLAS.map(talla => (
                  <option key={talla} value={talla}>{talla}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter size={18} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones masivas */}
        {showBulkActions && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-blue-700 mb-2 sm:mb-0">
              {selectedEmpleados.length} empleado(s) seleccionado(s)
            </div>
            <div className="flex gap-2">
              <select 
                className="text-sm p-1 border border-blue-300 rounded-md"
                onChange={(e) => e.target.value && bulkUpdateTalla(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Asignar talla</option>
                {TALLAS.map(talla => (
                  <option key={talla} value={talla}>{talla}</option>
                ))}
              </select>
              <button 
                onClick={handleExportCSV}
                className="flex items-center bg-blue-600 text-white text-sm py-1 px-2 rounded-md hover:bg-blue-700"
              >
                <Download size={16} className="mr-1" />
                Exportar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de empleados */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-left">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedEmpleados.length === filteredEmpleados.length && filteredEmpleados.length > 0}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th 
                className="p-3 text-left text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort('nombre')}
              >
                <div className="flex items-center">
                  Nombre
                  <ArrowUpDown size={16} className="ml-1 text-gray-400" />
                </div>
              </th>
              <th 
                className="p-3 text-left text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort('talla')}
              >
                <div className="flex items-center">
                  Talla
                  <ArrowUpDown size={16} className="ml-1 text-gray-400" />
                </div>
              </th>
              <th className="p-3 text-center text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmpleados.map((empleado) => (
              <tr key={empleado.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">
                  <input 
                    type="checkbox" 
                    checked={selectedEmpleados.includes(empleado.id)}
                    onChange={() => handleSelectEmpleado(empleado.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">{empleado.nombre}</td>
                <td className="p-3">
                  {editingTallaId === empleado.id ? (
                    <select
                      value={empleado.talla}
                      onChange={(e) => onUpdateTalla(empleado.id, e.target.value)}
                      onBlur={handleTallaBlur}
                      autoFocus
                      className="p-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      {TALLAS.map(talla => (
                        <option key={talla} value={talla}>{talla}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      onClick={() => handleTallaClick(empleado.id)}
                      className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between ${
                        empleado.talla === 'Por definir' ? 
                        'text-amber-600 font-medium bg-amber-50 border-amber-200' : 
                        'text-gray-900 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span>{empleado.talla}</span>
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onEditEmpleado(empleado)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      title="Editar empleado"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteEmpleado(empleado.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      title="Eliminar empleado"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación o resumen */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 rounded-b-lg flex justify-between items-center">
        <div>
          Mostrando {filteredEmpleados.length} de {empleados.length} empleados
        </div>
        <div>
          {empleados.length} empleado(s) en total
        </div>
      </div>
    </div>
  );
};

export default EmpleadosList;