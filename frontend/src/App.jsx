// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/Login';
import AdminDashboard from './componentes/admin/AdminDashboard';
import ManagerDashboard from './componentes/manager/ManagerDashboard';
import SucursalDetalle from './componentes/admin/SucursalDetalle';
import Navbar from './componentes/Navbar';
import { fetchSucursales } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem('uniformes_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Cargar sucursales
    const loadSucursales = async () => {
      try {
        const data = await fetchSucursales();
        setSucursales(data);
      } catch (error) {
        console.error('Error cargando sucursales:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSucursales();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Guardar sesión en localStorage
    localStorage.setItem('uniformes_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('uniformes_user');
  };

  const handleSucursalUpdate = (updatedSucursal) => {
    setSucursales(prev => 
      prev.map(s => s.id === updatedSucursal.id ? updatedSucursal : s)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-blue-600">Cargando...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'admin' ? 
                  <Navigate to="/admin" /> : 
                  <Navigate to="/manager" />
              ) : (
                <Login onLogin={handleLogin} sucursales={sucursales} />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? (
                <AdminDashboard sucursales={sucursales} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route 
            path="/admin/sucursal/:id" 
            element={
              user && user.role === 'admin' ? (
                <SucursalDetalle 
                  sucursales={sucursales} 
                  onSucursalUpdate={handleSucursalUpdate}
                />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route 
            path="/manager" 
            element={
              user && user.role === 'manager' ? (
                <ManagerDashboard sucursalId={user.sucursalId} sucursales={sucursales} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;