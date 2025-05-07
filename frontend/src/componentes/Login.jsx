// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { LogIn, User, Building, Lock, Search } from 'lucide-react';
import { login } from '../api';

const Login = ({ onLogin, sucursales }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'manager',
    sucursalId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSucursales, setFilteredSucursales] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Inicializar las sucursales filtradas cuando se carga el componente
  useEffect(() => {
    setFilteredSucursales(sucursales.slice(0, 5)); // Mostrar solo las primeras 5 inicialmente
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
        .slice(0, 8); // Limitar a 8 resultados para no sobrecargar la UI
      setFilteredSucursales(filtered);
    }
  }, [searchTerm, sucursales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const { username, password } = formData;
      const userData = await login(username, password);

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

  // Agrupando sucursales por región o estado para mejor organización
  const groupedSucursales = () => {
    // Aquí implementarías la lógica para agrupar por región/estado si tus datos lo permiten
    // Por ejemplo: { "Norte": [sucursal1, sucursal2], "Sur": [sucursal3, sucursal4] }
    return filteredSucursales;
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Sistema de Gestión de Uniformes
          </h1>
          <p className="text-gray-600 font-medium">Promexma</p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Tipo de Usuario
            </label>
            <div className="flex gap-4 bg-gray-50 p-3 rounded-md">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={formData.role === 'manager'}
                  onChange={handleChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span>Manager de Sucursal</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span>Administrador Global</span>
              </label>
            </div>
          </div>

          {formData.role === 'manager' && (
            <div className="mb-4 relative">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Seleccione su Sucursal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Building size={18} className="text-gray-500" />
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSucursalSearch}
                  onFocus={() => setShowDropdown(true)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nombre o gerente..."
                />
              </div>
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredSucursales.length > 0 ? (
                    <ul className="py-1">
                      {filteredSucursales.map(sucursal => (
                        <li 
                          key={sucursal.id} 
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                          onClick={() => selectSucursal(sucursal)}
                        >
                          <div>
                            <span className="font-medium">{sucursal.nombre}</span>
                            {sucursal.manager && (
                              <p className="text-sm text-gray-500">{sucursal.manager}</p>
                            )}
                          </div>
                          {formData.sucursalId === sucursal.id && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
              
              {formData.sucursalId && (
                <div className="mt-2 text-sm text-blue-600">
                  Sucursal seleccionada: {sucursales.find(s => s.id === formData.sucursalId)?.nombre}
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
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
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex items-center justify-center w-full px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Ingresar
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