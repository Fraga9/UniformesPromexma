// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Download,
  AlertTriangle,
  FileText,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  fetchEmpleados,
  generateExcelReport
} from '../../api';
import SucursalCard from './SucursalCard';
import TallasResumen from '../common/TallasResumen';
import UserManagement from './UserManagement';


const AdminDashboard = ({ sucursales }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    loadAllEmpleados();
  }, []);

  const loadAllEmpleados = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEmpleados();
      setEmpleados(data);
    } catch (err) {
      setError('Error al cargar los empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError('');
      setReportSuccess('');
      const result = await generateExcelReport();
      setReportSuccess(`Reporte generado exitosamente: ${result.archivo}`);

      // En una aplicación real, aquí podrías mostrar un enlace de descarga
      // o iniciar la descarga automáticamente
    } catch (err) {
      setError('Error al generar el reporte: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Filtrar empleados por sucursal
  const empleadosPorSucursal = (sucursalId) => {
    return empleados.filter(emp => emp.sucursal_id === sucursalId);
  };

  // Cálculos para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSucursales = sucursales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sucursales.length / itemsPerPage);

  // Función para cambiar de página
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Función para cambiar número de elementos por página
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading && empleados.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-green-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Panel de Administración Global
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona los uniformes de todas las sucursales
        </p>
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}

      {reportSuccess && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md flex items-center">
          <FileText className="mr-2" />
          {reportSuccess}
        </div>
      )}

      <div className="grid gap-6 mb-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Resumen Global
            </h2>
            <span className="px-4 py-1 text-blue-700 bg-blue-100 rounded-full">
              Total: {empleados.length} empleados
            </span>
          </div>

          <TallasResumen empleados={empleados} />

          <div className="mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className={`w-full flex items-center justify-center px-4 py-2 text-white rounded-md ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              <Download className="mr-2" size={18} />
              {generating ? 'Generando...' : 'Generar Reporte Excel'}
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building className="mr-2 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Información de Sucursales
              </h2>
            </div>
            <span className="text-sm text-gray-600">
              Total: {sucursales.length} sucursales
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {currentSucursales.map(sucursal => (
              <div key={sucursal.id} className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{sucursal.nombre}</h3>
                    <p className="text-sm text-gray-600">Manager: {sucursal.manager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Empleados: {empleadosPorSucursal(sucursal.id).length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-sm">
            <div className="mb-2 sm:mb-0">
              <select 
                className="px-2 py-1 bg-white border border-gray-300 rounded-md text-gray-700"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={6}>6 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Detalle por Sucursal
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentSucursales.map(sucursal => (
          <SucursalCard
            key={sucursal.id}
            sucursal={sucursal}
            empleados={empleadosPorSucursal(sucursal.id)}
          />
        ))}
      </div>

      {/* Paginación para la sección de detalle por sucursal */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            <ChevronLeft size={18} />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Mostrar páginas cercanas a la actual
            let pageToShow;
            if (totalPages <= 5) {
              // Si hay 5 o menos páginas en total, mostrar todas
              pageToShow = i + 1;
            } else if (currentPage <= 3) {
              // Si estamos en las primeras páginas
              pageToShow = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Si estamos en las últimas páginas
              pageToShow = totalPages - 4 + i;
            } else {
              // En medio, mostrar 2 antes y 2 después de la actual
              pageToShow = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageToShow}
                onClick={() => paginate(pageToShow)}
                className={`px-3 py-1 rounded-md ${currentPage === pageToShow 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {pageToShow}
              </button>
            );
          })}
          
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8 mb-6">
        <UserManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;