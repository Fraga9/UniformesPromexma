// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { LogIn, User, Building, Search, ArrowRight, Info } from 'lucide-react';
import { login } from '../api';

const Login = ({ onLogin, sucursales }) => {
  const [formData, setFormData] = useState({
    username: '',
    role: 'manager',
    sucursalId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSucursales, setFilteredSucursales] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Inicializar las sucursales filtradas cuando se carga el componente
  useEffect(() => {
    setFilteredSucursales(sucursales.slice(0, 5));
  }, [sucursales]);

  // Filtrar sucursales basado en el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSucursales(sucursales.slice(0, 5));
    } else {
      const filtered = sucursales
        .filter(s => 
          s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (s.manager && s.manager.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .slice(0, 8);
      setFilteredSucursales(filtered);
    }
  }, [searchTerm, sucursales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert username to lowercase when entered
    const processedValue = name === 'username' ? value.toLowerCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSucursalSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const selectSucursal = (sucursal) => {
    setFormData(prev => ({
      ...prev,
      sucursalId: sucursal.id
    }));
    setSearchTerm(sucursal.nombre);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que se haya seleccionado una sucursal si es rol manager
    if (formData.role === 'manager' && !formData.sucursalId) {
      setError('Debe seleccionar una sucursal');
      setLoading(false);
      return;
    }

    try {
      const { username, role } = formData;
      // Make sure username is lowercase before sending to API
      const lowerCaseUsername = username.toLowerCase();
      // Usamos contraseña diferente según el rol
      const password = role === 'admin' ? 'admin123' : 'password123';
      const userData = await login(lowerCaseUsername, password);

      onLogin({
        username: userData.username,
        role: userData.rol,
        name: userData.sucursal?.manager || 'Administrador',
        sucursalId: userData.sucursal_id,
        sucursalNombre: userData.sucursal?.nombre,
        token: userData.token
      });
    } catch (error) {
      setError(error.message || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="w-full max-w-md p-2 md:p-8 bg-white rounded-xl shadow-xl border border-gray-100">
        {/* Logo y Título */}
        <div className="mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Bienvenido</h1>
          <p className="text-gray-500 font-medium">Sistema de Gestión de Uniformes</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-lg border-l-4 border-red-500 flex items-start">
            <div className="flex-shrink-0 mr-2 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Usuario */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              Tipo de Usuario
              <div className="relative ml-2" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                <Info size={16} className="text-gray-400 cursor-help" />
                {showTooltip && (
                  <div className="absolute z-10 w-64 p-2 -mt-24 -ml-72 text-sm text-white bg-gray-800 rounded-md shadow-lg">
                    Seleccione su perfil para acceder al sistema
                  </div>
                )}
              </div>
            </label>
            <div className="mt-2 flex gap-3">
              <div
                className={`flex-1 cursor-pointer rounded-lg p-4 border-2 transition-all ${
                  formData.role === 'manager'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'manager' }))}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="manager"
                    checked={formData.role === 'manager'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 hidden"
                  />
                  <Building size={18} className={formData.role === 'manager' ? 'text-blue-600 mr-2' : 'text-gray-500 mr-2'} />
                  <span className={formData.role === 'manager' ? 'font-medium text-blue-800' : 'text-gray-700'}>Manager</span>
                </div>
              </div>
              <div
                className={`flex-1 cursor-pointer rounded-lg p-4 border-2 transition-all ${
                  formData.role === 'admin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 hidden"
                  />
                  <User size={18} className={formData.role === 'admin' ? 'text-blue-600 mr-2' : 'text-gray-500 mr-2'} />
                  <span className={formData.role === 'admin' ? 'font-medium text-blue-800' : 'text-gray-700'}>Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selección de Sucursal (solo para manager) */}
          {formData.role === 'manager' && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione su Sucursal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Building size={18} className="text-gray-500" />
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSucursalSearch}
                  onFocus={() => setShowDropdown(true)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Buscar por nombre o gerente..."
                />
              </div>
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredSucursales.length > 0 ? (
                    <ul className="py-1 divide-y divide-gray-100">
                      {filteredSucursales.map(sucursal => (
                        <li 
                          key={sucursal.id} 
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                          onClick={() => selectSucursal(sucursal)}
                        >
                          <div>
                            <span className="font-medium text-gray-800">{sucursal.nombre}</span>
                            {sucursal.manager && (
                              <p className="text-sm text-gray-500 mt-1">{sucursal.manager}</p>
                            )}
                          </div>
                          {formData.sucursalId === sucursal.id && (
                            <span className="text-blue-600 bg-blue-100 p-1 rounded-full">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
              
              {formData.sucursalId && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 py-2 px-3 rounded-lg inline-flex items-center">
                  <Building size={14} className="mr-1" />
                  Sucursal: {sucursales.find(s => s.id === formData.sucursalId)?.nombre}
                </div>
              )}
            </div>
          )}

          {/* Campo de Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">El sistema convierte automáticamente a minúsculas</p>
          </div>

          {/* Botón de Acceso */}
          <div className="mt-8">
            <button
              type="submit"
              className="flex items-center justify-center w-full px-6 py-3.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all shadow-md"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Accediendo...</span>
                </div>
              ) : (
                <>
                  <span className="mr-2">Ingresar al sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;