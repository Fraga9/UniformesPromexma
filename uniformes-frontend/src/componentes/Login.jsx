// src/components/Login.jsx
import React, { useState } from 'react';
import { LogIn, User, Building, Lock } from 'lucide-react';
import { login } from '../api';

const Login = ({ onLogin, sucursales }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'manager',
    sucursalId: sucursales.length > 0 ? sucursales[0].id : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { username, password } = formData;
      // Usar el endpoint real de login
      const userData = await login(username, password);

      // El backend ya nos devuelve toda la información necesaria
      onLogin({
        username: userData.username,
        role: userData.rol,
        name: userData.sucursal?.manager || 'Administrador',
        sucursalId: userData.sucursal_id,
        sucursalNombre: userData.sucursal?.nombre,
        token: userData.token // Para almacenar en localStorage si implementas JWT
      });
    } catch (error) {
      setError(error.message || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-600">
            Sistema de Gestión de Uniformes
          </h1>
          <p className="text-gray-600">Promexma</p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Tipo de Usuario
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={formData.role === 'manager'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Manager de Sucursal
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Administrador Global
              </label>
            </div>
          </div>

          {formData.role === 'manager' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sucursal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Building size={18} className="text-gray-500" />
                </div>
                <select
                  name="sucursalId"
                  value={formData.sucursalId}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={formData.role === 'manager'}
                >
                  {sucursales.map(sucursal => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre} - {sucursal.manager}
                    </option>
                  ))}
                </select>
              </div>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex items-center justify-center w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <span>Cargando...</span>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Ingresar
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Para pruebas:</p>
          <p><strong>Admin:</strong> usuario: admin, contraseña: admin123</p>
          <p><strong>Manager:</strong> usuario: manager, contraseña: manager123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;