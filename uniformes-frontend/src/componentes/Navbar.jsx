// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, Briefcase } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  // Determinar si la ruta actual está activa
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Título */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Briefcase className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">Uniformes Promexma</span>
            </Link>
          </div>

          {/* Links de navegación (pantallas medianas y grandes) */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin')
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                }`}
              >
                Panel Admin
              </Link>
            )}
            
            {user.role === 'manager' && (
              <Link
                to="/manager"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/manager')
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                }`}
              >
                Gestionar Uniformes
              </Link>
            )}
            
            {/* Información de usuario y botón de logout */}
            <div className="flex items-center ml-4 space-x-4">
              <div className="flex items-center text-sm">
                <User className="w-5 h-5 mr-1" />
                <span>
                  {user.name || user.username}
                  {user.role === 'manager' && user.sucursalNombre && (
                    <span className="ml-1 text-blue-200">
                      ({user.sucursalNombre})
                    </span>
                  )}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Salir
              </button>
            </div>
          </div>

          {/* Botón hamburguesa (pantallas pequeñas) */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <X className="block w-6 h-6" />
              ) : (
                <Menu className="block w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin')
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Panel Admin
              </Link>
            )}
            
            {user.role === 'manager' && (
              <Link
                to="/manager"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/manager')
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Gestionar Uniformes
              </Link>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user.name || user.username}
                </div>
                {user.role === 'manager' && user.sucursalNombre && (
                  <div className="text-sm text-blue-200">
                    {user.sucursalNombre}
                  </div>
                )}
              </div>
            </div>
            <div className="px-2 mt-3 space-y-1">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="block w-full px-3 py-2 text-base font-medium text-left text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-2" />
                  Cerrar Sesión
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;  