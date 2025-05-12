  // src/components/admin/UserManagement.jsx
  import React, { useState, useEffect } from 'react';
  import { fetchUsers, createUser, deleteUser, fetchSucursales } from '../../api';
  import { PlusCircle, Trash2, AlertTriangle, Search, ChevronLeft, ChevronRight, Edit, RefreshCw } from 'lucide-react';

  const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      rol: 'manager',
      sucursal_id: ''
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    
    // Función para calcular usuarios filtrados
    const getFilteredUsers = () => {
      return users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.rol === 'manager' && 
          sucursales.find(s => s.id === user.sucursal_id)?.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    };

    // Calcular paginación
    useEffect(() => {
      const filteredUsers = getFilteredUsers();
      setTotalPages(Math.ceil(filteredUsers.length / usersPerPage));
      if (currentPage > Math.ceil(filteredUsers.length / usersPerPage) && filteredUsers.length > 0) {
        setCurrentPage(1);
      }
    }, [users, searchTerm, usersPerPage]);

    // Obtener usuarios paginados
    const getCurrentUsers = () => {
      const filteredUsers = getFilteredUsers();
      const indexOfLastUser = currentPage * usersPerPage;
      const indexOfFirstUser = indexOfLastUser - usersPerPage;
      return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    };

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

    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset a la primera página cuando se busca
    };

    const handlePageChange = (page) => {
      setCurrentPage(page);
    };

    const handleRowsPerPageChange = (e) => {
      setUsersPerPage(parseInt(e.target.value));
      setCurrentPage(1); // Reset a la primera página
    };

    // Componente de paginación
    const Pagination = () => {
      const pageNumbers = [];
      
      // Mostrar máximo 5 números de página
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      return (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-600">Filas por página:</span>
            <select
              value={usersPerPage}
              onChange={handleRowsPerPageChange}
              className="p-1 text-sm border rounded"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-4 text-sm text-gray-600">
              Mostrando {getCurrentUsers().length} de {getFilteredUsers().length} usuarios
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
              aria-label="Primera página"
            >
              <ChevronLeft size={14} className="inline" />
              <ChevronLeft size={14} className="inline ml-n2" />
            </button>
            
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={`w-8 h-8 text-sm rounded ${
                  currentPage === number 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
              aria-label="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
            
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
              aria-label="Última página"
            >
              <ChevronRight size={14} className="inline" />
              <ChevronRight size={14} className="inline ml-n2" />
            </button>
          </div>
        </div>
      );
    };

    if (loading && users.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin text-blue-600 mr-2">
            <RefreshCw size={24} />
          </div>
          <span>Cargando usuarios...</span>
        </div>
      );
    }

    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
          
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setFormData({
                  username: '',
                  password: '',
                  rol: 'manager',
                  sucursal_id: ''
                });
              }
            }}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            aria-label={showForm ? "Cancelar" : "Nuevo Usuario"}
          >
            <PlusCircle className="mr-2" size={18} />
            {showForm ? "Cancelar" : "Nuevo Usuario"}
          </button>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md flex items-center">
            <AlertTriangle className="mr-2" size={18} />
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="ml-auto text-red-700 hover:text-red-900"
              aria-label="Cerrar mensaje de error"
            >
              &times;
            </button>
          </div>
        )}
        
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="mb-3 font-medium text-gray-800">Crear Nuevo Usuario</h3>
            
            <div className="grid gap-4 mb-4 md:grid-cols-2">
              <div>
                <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                  Nombre de Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="username"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="new-password"
                />
              </div>
              
              <div>
                <label htmlFor="rol" className="block mb-1 text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              {formData.rol === 'manager' && (
                <div>
                  <label htmlFor="sucursal_id" className="block mb-1 text-sm font-medium text-gray-700">
                    Sucursal
                  </label>
                  <select
                    id="sucursal_id"
                    name="sucursal_id"
                    value={formData.sucursal_id}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Guardar Usuario
              </button>
            </div>
          </form>
        )}
        
        <div className="mb-4 flex items-center">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por usuario o sucursal..."
              className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={loadData}
            className="ml-2 p-2 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sucursal</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentUsers().length > 0 ? (
                getCurrentUsers().map(user => {
                  const userSucursal = sucursales.find(s => s.id === user.sucursal_id);
                  return (
                    <tr 
                      key={user.id} 
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.rol === 'admin' ? 'Administrador' : 'Manager'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.rol === 'manager' && userSucursal 
                          ? userSucursal.nombre 
                          : user.rol === 'admin' ? '-' : 'Sin asignar'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => {/* Funcionalidad de editar */}}
                            className="p-1 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    {searchTerm 
                      ? "No se encontraron usuarios con los criterios de búsqueda" 
                      : "No hay usuarios registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {getCurrentUsers().length > 0 && <Pagination />}
      </div>
    );
  };

  export default UserManagement;