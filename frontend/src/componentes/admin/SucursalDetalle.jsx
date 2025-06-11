// src/components/admin/SucursalDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  MapPin,
  User,
  Package,
  Truck,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  Shirt,
  Calendar,
  Mail
} from 'lucide-react';
import { fetchEmpleados, updateSucursal, updateEmpleado, generateSucursalExcelReport } from '../../api';
import TallasResumen from '../common/TallasResumen';

const SucursalDetalle = ({ sucursales, onSucursalUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para edición
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    direccion: '',
    telefono: '',
    is_empaquetado: false,
    numero_seguimiento: ''
  });

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

        setSucursal(sucursalFound);
        setEditValues({
          direccion: sucursalFound.direccion || '',
          telefono: sucursalFound.telefono || '',
          is_empaquetado: sucursalFound.is_empaquetado || false,
          numero_seguimiento: sucursalFound.numero_seguimiento || ''
        });

        // Cargar empleados de la sucursal
        const empleadosData = await fetchEmpleados(parseInt(id));
        setEmpleados(empleadosData);

      } catch (err) {
        setError('Error al cargar los datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && sucursales.length > 0) {
      loadSucursalData();
    }
  }, [id, sucursales]);

  const handleSaveField = async (field) => {
    try {
      setError('');
      const updatedSucursal = {
        ...sucursal,
        [field]: editValues[field]
      };

      await updateSucursal(sucursal.id, updatedSucursal);
      setSucursal(updatedSucursal);
      onSucursalUpdate(updatedSucursal);
      setEditingField(null);
      setSuccess(`${field === 'direccion' ? 'Dirección' : field === 'telefono' ? 'Teléfono' : field === 'is_empaquetado' ? 'Estado de empaquetado' : 'Número de seguimiento'} actualizado correctamente`);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      is_empaquetado: sucursal.is_empaquetado || false,
      numero_seguimiento: sucursal.numero_seguimiento || ''
    });
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
      <div className="container p-4 mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="mr-2" size={16} />
              Volver al panel
            </button>
          </div>

          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg mr-4">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{sucursal.nombre}</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin size={16} className="mr-1" />
                {sucursal.ubicacion_pdv || 'Ubicación no especificada'}
              </p>
            </div>
          </div>

          {/* Información básica de la sucursal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Manager:</span>
              <p className="font-medium text-gray-800">{sucursal.manager}</p>
            </div>
            <div>
              <span className="text-gray-500">Zona:</span>
              <p className="font-medium text-gray-800">{sucursal.zona || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Región:</span>
              <p className="font-medium text-gray-800">{sucursal.region || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">PDV:</span>
              <p className="font-medium text-gray-800">{sucursal.pdv || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center shadow-sm">
            <AlertTriangle className="mr-3 flex-shrink-0" size={20} />
            <div className="flex-grow">
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center shadow-sm">
            <CheckCircle className="mr-3 flex-shrink-0" size={20} />
            <div className="flex-grow">
              <h3 className="font-medium">Éxito</h3>
              <p>{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              &times;
            </button>
          </div>
        )}

        {/* Estadísticas rápidas */}
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
                <CheckCircle size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Con Talla Principal</h3>
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
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Shirt size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Personal Administrativo</h3>
                <div className="mt-1 font-semibold text-2xl text-gray-800">{stats.empleadosAdministrativos}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                sucursal.is_empaquetado ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <Package size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                <div className="mt-1 font-semibold text-lg text-gray-800">
                  {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de gestión de sucursal */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Información editable de la sucursal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Building size={20} className="mr-2 text-blue-600" />
              Información de la Sucursal
            </h2>

            {/* Dirección */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              {editingField === 'direccion' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editValues.direccion}
                    onChange={(e) => setEditValues(prev => ({ ...prev, direccion: e.target.value }))}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa la dirección de la sucursal"
                  />
                  <button
                    onClick={() => handleSaveField('direccion')}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-gray-800">
                    {sucursal.direccion || 'No especificada'}
                  </span>
                  <button
                    onClick={() => setEditingField('direccion')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Estado de empaquetado */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Empaquetado</label>
              {editingField === 'empaquetado' ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={editValues.empaquetado}
                    onChange={(e) => setEditValues(prev => ({ ...prev, empaquetado: e.target.value === 'true' }))}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">Pendiente</option>
                    <option value="true">Empaquetado</option>
                  </select>
                  <button
                    onClick={() => handleSaveField('empaquetado')}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    sucursal.empaquetado 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sucursal.empaquetado ? 'Empaquetado' : 'Pendiente'}
                  </span>
                  <button
                    onClick={() => setEditingField('empaquetado')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Código de seguimiento */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de Seguimiento</label>
              {editingField === 'codigo_seguimiento' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editValues.codigo_seguimiento}
                    onChange={(e) => setEditValues(prev => ({ ...prev, codigo_seguimiento: e.target.value }))}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el código de seguimiento"
                  />
                  <button
                    onClick={() => handleSaveField('codigo_seguimiento')}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-gray-800 font-mono">
                    {sucursal.codigo_seguimiento || 'No asignado'}
                  </span>
                  <button
                    onClick={() => setEditingField('codigo_seguimiento')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de tallas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 size={20} className="mr-2 text-blue-600" />
                Distribución de Tallas
              </h2>
            </div>
            <TallasResumen empleados={empleados} />
          </div>
        </div>

        {/* Lista detallada de empleados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users size={20} className="mr-2 text-blue-600" />
              Empleados de la Sucursal ({empleados.length})
            </h2>
            
            {stats.tallasAdministrativasPendientes > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  <span>
                    <strong>{stats.tallasAdministrativasPendientes}</strong> empleado(s) administrativo(s) requieren talla de playera administrativa.
                  </span>
                </div>
              </div>
            )}
          </div>

          {empleados.length > 0 ? (
            <>
              {/* Versión móvil */}
              <div className="md:hidden">
                {empleados.map((empleado) => (
                  <div key={empleado.id} className="p-4 border-b border-gray-200">
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
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />
                          Ingreso: {empleado.fecha_ingreso?.split('-').reverse().join('/') || 'N/A'}
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
                        <div className="text-xs text-gray-500 mb-1">Talla Construrama</div>
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

              {/* Versión escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puesto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Talla Seguridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Talla Construrama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {empleados.map((empleado) => (
                      <tr key={empleado.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{empleado.nombre}</div>
                              {empleado.requiere_playera_administrativa && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  <Shirt size={12} className="mr-1" />
                                  Administrativo
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{empleado.puesto_homologado || empleado.puesto_hc || 'No especificado'}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar size={12} className="mr-1" />
                            {empleado.fecha_ingreso?.split('-').reverse().join('/') || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingTallaId === empleado.id && editingTallaType === 'regular' ? (
                            <select
                              value={empleado.talla || 'Por definir'}
                              onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'regular')}
                              onBlur={() => setEditingTallaId(null)}
                              autoFocus
                              className="p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between min-w-[120px] ${
                                empleado.talla === 'Por definir' || !empleado.talla
                                  ? 'text-amber-600 font-medium bg-amber-50 border-amber-200'
                                  : 'text-gray-900 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <span>{empleado.talla || 'Por definir'}</span>
                              <Edit size={14} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {empleado.requiere_playera_administrativa ? (
                            editingTallaId === empleado.id && editingTallaType === 'administrativa' ? (
                              <select
                                value={empleado.talla_administrativa || 'Por definir'}
                                onChange={(e) => handleTallaChange(empleado.id, e.target.value, 'administrativa')}
                                onBlur={() => setEditingTallaId(null)}
                                autoFocus
                                className="p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between min-w-[120px] ${
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
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail size={14} className="mr-1 text-gray-400" />
                            {empleado.email?.toLowerCase() || 'No disponible'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No hay empleados</h3>
              <p className="text-sm">Esta sucursal no tiene empleados registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SucursalDetalle;