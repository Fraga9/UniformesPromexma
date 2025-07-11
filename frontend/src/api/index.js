// src/api/index.js
const API_URL = import.meta.env.VITE_API_URL;


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
  
  const result = await handleFetchResponse(response);
  
  return result;
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

// Función específica para actualizar solo la talla de un empleado
export const updateEmpleadoTalla = async (id, tallaData) => {
  const response = await fetch(`${API_URL}/empleados/${id}/talla`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tallaData),
  });
  return handleFetchResponse(response);
};

// Reportes
export const generateExcelReport = async () => {
  const response = await fetch(`${API_URL}/reportes/excel`);
  return handleFetchResponse(response);
};

export const generateSupabaseExcelReport = async () => {
  const response = await fetch(`${API_URL}/reportes/supabase/excel`);
  return handleFetchResponse(response);
};

export const downloadExcelReport = (nombreArchivo) => {
  window.open(`${API_URL}/reportes/excel/download/${nombreArchivo}`, '_blank');
};

// Generar reporte específico de una sucursal
export const generateSucursalExcelReport = async (sucursalId) => {
  const response = await fetch(`${API_URL}/reportes/sucursal/${sucursalId}/excel`);
  return handleFetchResponse(response);
};

// Usuarios y Autenticación
export const login = async (username, password) => {
  // Si no se proporciona contraseña, usar password123 por defecto
  const passwordToUse = password || "password123";
  
  const response = await fetch(`${API_URL}/usuarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password: passwordToUse }),
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