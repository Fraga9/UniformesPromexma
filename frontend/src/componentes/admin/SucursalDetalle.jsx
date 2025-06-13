// src/components/admin/SucursalDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  MapPin,
  Package,
  Edit,
  X,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  Shirt,
  Calendar,
  Mail,
  User,
  Target
} from 'lucide-react';
import { fetchEmpleados, updateEmpleado } from '../../api';
import TallasResumen from '../common/TallasResumen';
import SucursalInfoCard from './SucursalInfoCard';

const SucursalDetalle = ({ sucursales, onSucursalUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para el manejo de tallas de empleados
  const [editingTallaId, setEditingTallaId] = useState(null);
  const [editingTallaType, setEditingTallaType] = useState('regular');

  const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Por definir"];

  useEffect(() => {
    const loadSucursalData = async () => {
      try {
        setLoading(true);
        setError('');

        // Buscar la sucursal en el array
        const sucursalFound = sucursales.find(s => s.id === parseInt(id));
        if (!sucursalFound) {
          setError('Sucursal no encontrada');
          return;
        }

        console.log('DEBUG: Sucursal encontrada:', sucursalFound);
        setSucursal(sucursalFound);

        // Cargar empleados de la sucursal
        const empleadosData = await fetchEmpleados(parseInt(id));
        setEmpleados(empleadosData);

      } catch (err) {
        console.error('DEBUG: Error cargando datos:', err);
        setError('Error al cargar los datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && sucursales.length > 0) {
      loadSucursalData();
    }
  }, [id, sucursales]);

  const handleSucursalUpdate = (sucursalActualizada) => {
    setSucursal(sucursalActualizada);
    if (onSucursalUpdate) {
      onSucursalUpdate(sucursalActualizada);
    }
  };

  const handleTallaUpdate = async (empleadoId, updatedEmpleado) => {
    try {
      // Llamada a la API para actualizar el empleado
      await updateEmpleado(empleadoId, updatedEmpleado);
      
      // Actualizar el estado local
      setEmpleados(prev => 
        prev.map(emp => emp.id === empleadoId ? updatedEmpleado : emp)
      );
      setEditingTallaId(null);
      setSuccess('Talla actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar la talla: ' + err.message);
    }
  };

  const handleTallaClick = (id, type = 'regular') => {
    setEditingTallaId(id);
    setEditingTallaType(type);
  };

  const handleTallaChange = (id, value, type = 'regular') => {
    const empleado = empleados.find(emp => emp.id === id);
    if (!empleado) return;

    if (type === 'regular') {
      handleTallaUpdate(id, { ...empleado, talla: value });
    } else if (type === 'administrativa') {
      handleTallaUpdate(id, { ...empleado, talla_administrativa: value });
    }
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Calcular estadísticas
  const stats = {
    totalEmpleados: empleados.length,
    empleadosConTalla: empleados.filter(emp => emp.talla && emp.talla !== 'Por definir').length,
    empleadosAdministrativos: empleados.filter(emp => emp.requiere_playera_administrativa).length,
    tallasAdministrativasPendientes: empleados.filter(emp => 
      emp.requiere_playera_administrativa && 
      (!emp.talla_administrativa || emp.talla_administrativa === 'Por definir')
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-blue-600">Cargando datos de la sucursal...</div>
        </div>
      </div>
    );
  }

  if (!sucursal) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="mr-3" size={24} />
              <div>
                <h3 className="font-medium">Sucursal no encontrada</h3>
                <p className="text-sm">La sucursal solicitada no existe o no tienes permisos para verla.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2" size={16} />
              Volver al panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto max-w-7xl">
        {/* Header Compacto */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors mr-4"
              >
                <ArrowLeft className="mr-2" size={16} />
                Volver
              </button>
              
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mr-3">
                  <Building size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{sucursal.nombre}</h1>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {sucursal.ubicacion_pdv || 'Ubicación no especificada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Info rápida en el header */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-800">{stats.totalEmpleados}</div>
                <div className="text-gray-500">Empleados</div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${
                  sucursal.is_empaquetado ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
                </div>
                <div className="text-gray-500">Estado</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800">{sucursal.manager}</div>
                <div className="text-gray-500">Manager</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center shadow-sm">
            <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
            <span className="flex-grow text-sm">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 ml-2">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center shadow-sm">
            <CheckCircle className="mr-2 flex-shrink-0" size={18} />
            <span className="flex-grow text-sm">{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 ml-2">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Layout Principal - 3 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Columna 1: Info de Sucursal y Alertas */}
          <div className="space-y-4">
            {/* Información Editable de Sucursal - PASAMOS EMPLEADOS */}
            <SucursalInfoCard 
              sucursal={sucursal}
              empleados={empleados}
              onSucursalUpdate={handleSucursalUpdate}
              onError={setError}
              onSuccess={handleSuccess}
            />

            {/* Estadísticas Críticas */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Target size={16} className="mr-2 text-blue-600" />
                Estado del Pedido
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tallas Completadas</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800">
                      {stats.empleadosConTalla}/{stats.totalEmpleados}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.round((stats.empleadosConTalla / stats.totalEmpleados) * 100) || 0}%)
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(stats.empleadosConTalla / stats.totalEmpleados) * 100}%` }}
                  ></div>
                </div>

                {stats.empleadosAdministrativos > 0 && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Personal Admin</span>
                        <span className="text-sm font-medium text-gray-800">
                          {stats.empleadosAdministrativos - stats.tallasAdministrativasPendientes}/{stats.empleadosAdministrativos}
                        </span>
                      </div>
                      
                      {stats.tallasAdministrativasPendientes > 0 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                          <AlertTriangle size={14} className="inline mr-1" />
                          {stats.tallasAdministrativasPendientes} talla(s) administrativa(s) pendiente(s)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna 2: Desglose del Pedido */}
          <div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <BarChart3 size={16} className="mr-2 text-blue-600" />
                Resumen de Pedido
              </h3>
              <TallasResumen empleados={empleados} compact={true} />
            </div>
          </div>

          {/* Columna 3: Lista de Empleados */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  <Users size={16} className="mr-2 text-blue-600" />
                  Empleados ({empleados.length})
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {empleados.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {empleados.map((empleado) => (
                      <div key={empleado.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {empleado.nombre}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {empleado.puesto_homologado || empleado.puesto_hc || 'Sin puesto'}
                            </div>
                          </div>
                          {empleado.requiere_playera_administrativa && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                              <Shirt size={10} className="mr-1" />
                              Admin
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Talla Seguridad */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Seguridad</div>
                            {editingTallaId === empleado.id && editingTallaType === 'regular' ? (
                              <select
                                value={empleado.talla || 'Por definir'}
                                onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'regular')}
                                onBlur={() => setEditingTallaId(null)}
                                autoFocus
                                className="w-full p-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {TALLAS.map((talla) => (
                                  <option key={talla} value={talla}>
                                    {talla}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div
                                onClick={() => handleTallaClick(empleado.id, 'regular')}
                                className={`cursor-pointer p-1 rounded border text-xs flex items-center justify-between ${
                                  empleado.talla === 'Por definir' || !empleado.talla
                                    ? 'text-amber-600 font-medium bg-amber-50 border-amber-200'
                                    : 'text-gray-900 bg-white hover:bg-gray-50 border-gray-200'
                                }`}
                              >
                                <span className="truncate">{empleado.talla || 'Por definir'}</span>
                                <Edit size={12} className="text-gray-400 flex-shrink-0 ml-1" />
                              </div>
                            )}
                          </div>

                          {/* Talla Administrativa */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Admin</div>
                            {empleado.requiere_playera_administrativa ? (
                              editingTallaId === empleado.id && editingTallaType === 'administrativa' ? (
                                <select
                                  value={empleado.talla_administrativa || 'Por definir'}
                                  onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'administrativa')}
                                  onBlur={() => setEditingTallaId(null)}
                                  autoFocus
                                  className="w-full p-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  {TALLAS.map((talla) => (
                                    <option key={talla} value={talla}>
                                      {talla}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  onClick={() => handleTallaClick(empleado.id, 'administrativa')}
                                  className={`cursor-pointer p-1 rounded border text-xs flex items-center justify-between ${
                                    !empleado.talla_administrativa || empleado.talla_administrativa === 'Por definir'
                                      ? 'text-amber-600 font-medium bg-amber-50 border-amber-200'
                                      : 'text-gray-900 bg-white hover:bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <span className="truncate">{empleado.talla_administrativa || 'Por definir'}</span>
                                  <Edit size={12} className="text-gray-400 flex-shrink-0 ml-1" />
                                </div>
                              )
                            ) : (
                              <div className="text-gray-400 text-xs p-1 text-center bg-gray-50 rounded border border-gray-200">
                                N/A
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <div className="text-sm text-gray-400">No hay empleados registrados</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vista móvil - Layout vertical */}
        <div className="lg:hidden mt-4 space-y-4">
          {/* Resumen de tallas en móvil */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={20} className="mr-2 text-blue-600" />
                Resumen de Pedido
              </h3>
            </div>
            <div className="p-4">
              <TallasResumen empleados={empleados} compact={false} />
            </div>
          </div>

          {/* Lista de empleados en móvil */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users size={20} className="mr-2 text-blue-600" />
                Lista Completa de Empleados
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {empleados.map((empleado) => (
                <div key={empleado.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-800">{empleado.nombre}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {empleado.puesto_homologado || empleado.puesto_hc || 'Puesto no especificado'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Mail size={12} className="mr-1" />
                        {empleado.email?.toLowerCase() || 'No disponible'}
                      </div>
                    </div>
                    
                    {empleado.requiere_playera_administrativa && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <Shirt size={12} className="mr-1" />
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Talla Seguridad</div>
                      {editingTallaId === empleado.id && editingTallaType === 'regular' ? (
                        <select
                          value={empleado.talla || 'Por definir'}
                          onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'regular')}
                          onBlur={() => setEditingTallaId(null)}
                          autoFocus
                          className="p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        >
                          {TALLAS.map((talla) => (
                            <option key={talla} value={talla}>
                              {talla}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => handleTallaClick(empleado.id, 'regular')}
                          className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between text-sm ${
                            empleado.talla === 'Por definir' || !empleado.talla
                              ? 'text-amber-600 font-medium bg-amber-50 border-amber-200'
                              : 'text-gray-900 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span>{empleado.talla || 'Por definir'}</span>
                          <Edit size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Talla Admin</div>
                      {empleado.requiere_playera_administrativa ? (
                        editingTallaId === empleado.id && editingTallaType === 'administrativa' ? (
                          <select
                            value={empleado.talla_administrativa || 'Por definir'}
                            onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'administrativa')}
                            onBlur={() => setEditingTallaId(null)}
                            autoFocus
                            className="p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          >
                            {TALLAS.map((talla) => (
                              <option key={talla} value={talla}>
                                {talla}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            onClick={() => handleTallaClick(empleado.id, 'administrativa')}
                            className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between text-sm ${
                              !empleado.talla_administrativa || empleado.talla_administrativa === 'Por definir'
                                ? 'text-amber-600 font-medium bg-amber-50 border-amber-200'
                                : 'text-gray-900 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <span>{empleado.talla_administrativa || 'Por definir'}</span>
                            <Edit size={14} className="text-gray-400" />
                          </div>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs p-2 block text-center bg-gray-50 rounded-md">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SucursalDetalle;