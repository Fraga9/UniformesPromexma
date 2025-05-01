// src/components/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, deleteUser, fetchSucursales } from '../../api';
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rol: 'manager',
    sucursal_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, sucursalesData] = await Promise.all([
        fetchUsers(),
        fetchSucursales()
      ]);
      setUsers(usersData);
      setSucursales(sucursalesData);
    } catch (err) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'sucursal_id' && value ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createUser(formData);
      setFormData({
        username: '',
        password: '',
        rol: 'manager',
        sucursal_id: ''
      });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError('Error al crear usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      setLoading(true);
      await deleteUser(id);
      await loadData();
    } catch (err) {
      setError('Error al eliminar usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Gestión de Usuarios</h2>
      
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}
      
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="mr-2" size={18} />
          Nuevo Usuario
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-md">
          <h3 className="mb-3 font-medium">Crear Nuevo Usuario</h3>
          
          <div className="grid gap-4 mb-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium">Nombre de Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="manager">Manager</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            {formData.rol === 'manager' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Sucursal</label>
                <select
                  name="sucursal_id"
                  value={formData.sucursal_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required={formData.rol === 'manager'}
                >
                  <option value="">Seleccionar Sucursal</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} - {s.manager}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3 text-left">Sucursal</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const userSucursal = sucursales.find(s => s.id === user.sucursal_id);
              return (
                <tr key={user.id} className="border-b">
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.rol === 'admin' ? 'Administrador' : 'Manager'}
                    </span>
                  </td>
                  <td className="p-3">
                    {user.rol === 'manager' && userSucursal 
                      ? userSucursal.nombre 
                      : user.rol === 'admin' ? '-' : 'Sin asignar'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1 text-red-600 bg-red-100 rounded-full hover:bg-red-200"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;