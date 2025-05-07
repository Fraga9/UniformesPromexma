// src/api/index.js
const API_URL = import.meta.env.VITE_API_URL;
console.log('API_URL:', API_URL);

// Función genérica para manejar errores de fetch
const handleFetchResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  return await response.json();
};

// Sucursales
export const fetchSucursales = async () => {
  const response = await fetch(`${API_URL}/sucursales`);
  return handleFetchResponse(response);
};

export const fetchSucursal = async (id) => {
  const response = await fetch(`${API_URL}/sucursales/${id}`);
  return handleFetchResponse(response);
};

export const createSucursal = async (sucursal) => {
  const response = await fetch(`${API_URL}/sucursales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sucursal),
  });
  return handleFetchResponse(response);
};

export const updateSucursal = async (id, sucursal) => {
  const response = await fetch(`${API_URL}/sucursales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sucursal),
  });
  return handleFetchResponse(response);
};

export const deleteSucursal = async (id) => {
  const response = await fetch(`${API_URL}/sucursales/${id}`, {
    method: 'DELETE',
  });
  return handleFetchResponse(response);
};

// Empleados
export const fetchEmpleados = async (sucursalId = null) => {
  const url = sucursalId ? 
    `${API_URL}/empleados?sucursal_id=${sucursalId}` : 
    `${API_URL}/empleados`;
  const response = await fetch(url);
  return handleFetchResponse(response);
};

export const fetchEmpleado = async (id) => {
  const response = await fetch(`${API_URL}/empleados/${id}`);
  return handleFetchResponse(response);
};

export const createEmpleado = async (empleado) => {
  const response = await fetch(`${API_URL}/empleados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(empleado),
  });
  return handleFetchResponse(response);
};

export const updateEmpleado = async (id, empleado) => {
  const response = await fetch(`${API_URL}/empleados/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(empleado),
  });
  return handleFetchResponse(response);
};

export const deleteEmpleado = async (id) => {
  const response = await fetch(`${API_URL}/empleados/${id}`, {
    method: 'DELETE',
  });
  return handleFetchResponse(response);
};

// Reportes
export const generateExcelReport = async () => {
  const response = await fetch(`${API_URL}/reporte/excel`);
  return handleFetchResponse(response);
};

// Usuarios y Autenticación
export const login = async (username) => {
  // Siempre usar "password123" como contraseña
  const password = "password123";
  
  const response = await fetch(`${API_URL}/usuarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return handleFetchResponse(response);
};

export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleFetchResponse(response);
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/usuarios`);
  return handleFetchResponse(response);
};

export const deleteUser = async (id) => {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'DELETE',
  });
  return handleFetchResponse(response);
};