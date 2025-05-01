// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Download,
  AlertTriangle,
  FileText,
  Building
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
          <div className="flex items-center mb-4">
            <Building className="mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Información de Sucursales
            </h2>
          </div>

          <div className="space-y-2">
            {sucursales.map(sucursal => (
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
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Detalle por Sucursal
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sucursales.map(sucursal => (
          <SucursalCard
            key={sucursal.id}
            sucursal={sucursal}
            empleados={empleadosPorSucursal(sucursal.id)}
          />
        ))}
      </div>
      <div className="mt-8 mb-6">
        <UserManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;