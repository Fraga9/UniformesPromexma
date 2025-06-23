// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Download,
  AlertTriangle,
  FileText,
  Building,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Users,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  ListFilter,
  Truck,
  Package
} from 'lucide-react';
import {
  fetchEmpleados,
  generateExcelReport,
  generateSupabaseExcelReport,
  downloadExcelReport
} from '../../api';
import SucursalCard from './SucursalCard';
import TallasResumen from '../common/TallasResumen';
import UserManagement from './UserManagement';
import CumplimientoPorSucursal from './CumplimientoPorSucursal';
import BulkShippingGenerator from './BulkShippingGenerator';

const AdminDashboard = ({ sucursales }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [supabaseReportUrl, setSupabaseReportUrl] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState('');

  // Estadísticas
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    empleadosConTalla: 0,
    totalSucursales: 0,
    porDefinir: 0
  });

  // Para manejar tabs en el dashboard
  const [activeTab, setActiveTab] = useState('resumen');

  // Estado para el generador masivo de etiquetas
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);

  useEffect(() => {
    loadAllEmpleados();
  }, []);

  useEffect(() => {
    if (empleados.length > 0 && sucursales.length > 0) {
      calculateStats();
    }
  }, [empleados, sucursales]);

  const calculateStats = () => {
    const totalEmpleados = empleados.length;
    const empleadosConTalla = empleados.filter(emp => emp.talla && emp.talla !== 'Por definir').length;
    const porDefinir = empleados.filter(emp => !emp.talla || emp.talla === 'Por definir').length;

    setStats({
      totalEmpleados,
      empleadosConTalla,
      totalSucursales: sucursales.length,
      porDefinir
    });
  };

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

      if (result.success) {
        setReportSuccess(`Reporte generado exitosamente: ${result.archivo}`);
      } else {
        setError(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (err) {
      setError('Error al generar el reporte: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSupabaseReport = async () => {
    try {
      setGenerating(true);
      setError('');
      setReportSuccess('');
      const result = await generateSupabaseExcelReport();

      if (result.success) {
        setReportSuccess(`Reporte Supabase generado exitosamente: ${result.archivo}`);
        setSupabaseReportUrl(result.url);
      } else {
        setError(`Error en Supabase: ${result.error || 'Error desconocido'}`);
      }
    } catch (err) {
      setError('Error al generar el reporte vía Supabase: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Funciones para el generador masivo
  const handleBulkShippingSuccess = (message) => {
    setReportSuccess(message);
    setTimeout(() => setReportSuccess(''), 5000);
  };

  const handleBulkShippingError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  // Filtrar empleados por sucursal
  const empleadosPorSucursal = (sucursalId) => {
    return empleados.filter(emp => emp.sucursal_id === sucursalId);
  };

  // Crear objeto con empleados agrupados por sucursal para el generador masivo
  const createEmpleadosPorSucursalMap = () => {
    const empleadosMap = {};
    sucursales.forEach(sucursal => {
      empleadosMap[sucursal.id] = empleados.filter(emp => emp.sucursal_id === sucursal.id);
    });
    return empleadosMap;
  };

  // Filtrado de sucursales
  const filteredSucursales = sucursales.filter(sucursal => {
    const matchesSearch = sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZona = filterZona ? sucursal.zona === filterZona : true;

    return matchesSearch && matchesZona;
  });

  // Obtener zonas únicas para el filtro
  const zonasUnicas = [...new Set(sucursales.map(s => s.zona))].filter(Boolean);

  // Cálculos para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSucursales = filteredSucursales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSucursales.length / itemsPerPage);

  // Función para cambiar de página
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Función para cambiar número de elementos por página
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Reiniciar filtros
  const resetFilters = () => {
    setSearchTerm('');
    setFilterZona('');
    setCurrentPage(1);
  };

  if (loading && empleados.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-blue-600">Cargando datos...</div>
          <p className="text-gray-500 mt-2">Obteniendo información de sucursales y empleados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Panel de Administración Global
              </h1>
              <p className="text-gray-600 mt-1">
                Visualiza y gestiona los uniformes de todas las sucursales
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
              {/* Botón generador masivo de etiquetas */}
              <button
                onClick={() => setShowBulkGenerator(!showBulkGenerator)}
                className={`flex items-center justify-center px-4 py-2 rounded-md shadow-sm transition-colors ${
                  showBulkGenerator
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Truck className="mr-2" size={18} />
                {showBulkGenerator ? 'Ocultar Etiquetas' : 'Etiquetas Masivas'}
              </button>

              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className={`flex items-center justify-center px-4 py-2 rounded-md shadow-sm ${generating
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={18} />
                    Exportar Excel
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateSupabaseReport}
                disabled={generating}
                className={`flex items-center justify-center px-4 py-2 rounded-md shadow-sm ${generating
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={18} />
                    Supabase
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('resumen')}
                className={`pb-3 text-sm font-medium ${activeTab === 'resumen'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Resumen Global
              </button>
              <button
                onClick={() => setActiveTab('sucursales')}
                className={`pb-3 text-sm font-medium ${activeTab === 'sucursales'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Detalle por Sucursal
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`pb-3 text-sm font-medium ${activeTab === 'usuarios'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Gestión de Usuarios
              </button>
            </div>
          </div>
        </div>

        {/* Generador masivo de etiquetas */}
        {showBulkGenerator && (
          <div className="mb-6">
            <BulkShippingGenerator 
              sucursales={sucursales}
              empleadosPorSucursal={createEmpleadosPorSucursalMap()}
              onSuccess={handleBulkShippingSuccess}
              onError={handleBulkShippingError}
            />
          </div>
        )}

        {/* Notificaciones */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center shadow-sm">
            <AlertTriangle className="mr-3 flex-shrink-0" size={20} />
            <div className="flex-grow">
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        )}

        {reportSuccess && (
          <div className="p-4 mb-6 text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center shadow-sm animate-fadeIn">
            <FileText className="mr-3 flex-shrink-0" size={20} />
            <div className="flex-grow">
              <h3 className="font-medium">Operación Exitosa</h3>
              <p>{reportSuccess}</p>
            </div>
            <button
              onClick={() => setReportSuccess('')}
              className="text-green-500 hover:text-green-700"
            >
              &times;
            </button>
          </div>
        )}

        {supabaseReportUrl && (
          <div className="p-4 mb-6 text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center shadow-sm animate-fadeIn">
            <FileText className="mr-3 flex-shrink-0" size={20} />
            <div className="flex-grow">
              <h3 className="font-medium">Reporte Supabase Listo</h3>
              <p>El reporte ha sido generado correctamente. Puedes descargarlo ahora.</p>
            </div>
            <button
              onClick={() => downloadExcelReport(supabaseReportUrl.split('/').pop())}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="mr-2" size={16} />
              Descargar
            </button>
          </div>
        )}

        {/* Contenido principal */}
        {activeTab === 'resumen' && (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Users size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Empleados</h3>
                    <div className="mt-1 font-semibold text-2xl text-gray-800">{stats.totalEmpleados}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <BarChart3 size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Con Talla Asignada</h3>
                    <div className="mt-1 font-semibold text-2xl text-gray-800">
                      {stats.empleadosConTalla}
                      <span className="text-sm ml-1 text-gray-500">
                        ({Math.round((stats.empleadosConTalla / stats.totalEmpleados) * 100) || 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                    <ListFilter size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Por Definir</h3>
                    <div className="mt-1 font-semibold text-2xl text-gray-800">
                      {stats.porDefinir}
                      <span className="text-sm ml-1 text-gray-500">
                        ({Math.round((stats.porDefinir / stats.totalEmpleados) * 100) || 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <Building size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Sucursales</h3>
                    <div className="mt-1 font-semibold text-2xl text-gray-800">{stats.totalSucursales}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 size={20} className="mr-2 text-blue-600" />
                    Resumen de Tallas
                  </h2>
                </div>

                <TallasResumen empleados={empleados} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <CumplimientoPorSucursal sucursales={sucursales} empleados={empleados} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'sucursales' && (
          <>
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <div className="flex-grow mb-3 md:mb-0">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o manager..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="md:w-48 mb-3 md:mb-0">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter size={18} className="text-gray-400" />
                    </div>
                    <select
                      value={filterZona}
                      onChange={(e) => {
                        setFilterZona(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Todas las zonas</option>
                      {zonasUnicas.map(zona => (
                        <option key={zona} value={zona}>{zona}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                  >
                    <RefreshCw size={16} className="mr-1" />
                    Reiniciar
                  </button>

                  <select
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value={6}>6 por página</option>
                    <option value={9}>9 por página</option>
                    <option value={12}>12 por página</option>
                  </select>
                </div>
              </div>

              {/* Resumen de filtros */}
              <div className="mt-3 flex items-center text-sm text-gray-600">
                <span>
                  Mostrando {currentSucursales.length} de {filteredSucursales.length} sucursales
                  {filterZona && ` en zona ${filterZona}`}
                  {searchTerm && ` que coinciden con "${searchTerm}"`}
                </span>
              </div>
            </div>

            {/* Grid de Sucursales */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {currentSucursales.map(sucursal => (
                <SucursalCard
                  key={sucursal.id}
                  sucursal={sucursal}
                  empleados={empleadosPorSucursal(sucursal.id)}
                />
              ))}
            </div>

            {/* Paginación */}
            {filteredSucursales.length > 0 ? (
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center border border-gray-100">
                <div className="text-sm text-gray-600 mb-3 sm:mb-0">
                  Página {currentPage} de {totalPages}
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M7.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L3.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageToShow;
                    if (totalPages <= 5) {
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    } else {
                      pageToShow = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageToShow}
                        onClick={() => paginate(pageToShow)}
                        className={`px-3 py-1 rounded-md ${currentPage === pageToShow
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M12.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L16.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100">
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700">No hay resultados</h3>
                <p className="mt-1 text-gray-500">No se encontraron sucursales con los filtros actuales</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'usuarios' && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;