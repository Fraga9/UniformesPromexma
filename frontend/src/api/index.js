// src/api/index.js
// Hardcode the API URL to use the Vercel proxy
const API_URL = '/api';  // This will be proxied through Vercel to your Railway backend

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
  try {
    console.log('Fetching sucursales via proxy...');
    const response = await fetch(`${API_URL}/sucursales`);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error fetching sucursales:', error);
    throw error;
  }
};

// Continue with the rest of your API functions, all using the proxy URL
export const fetchSucursal = async (id) => {
  try {
    const response = await fetch(`${API_URL}/sucursales/${id}`);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error fetching sucursal:', error);
    throw error;
  }
};

export const createSucursal = async (sucursal) => {
  try {
    const response = await fetch(`${API_URL}/sucursales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sucursal),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error creating sucursal:', error);
    throw error;
  }
};

export const updateSucursal = async (id, sucursal) => {
  try {
    const response = await fetch(`${API_URL}/sucursales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sucursal),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error updating sucursal:', error);
    throw error;
  }
};

export const deleteSucursal = async (id) => {
  try {
    const response = await fetch(`${API_URL}/sucursales/${id}`, {
      method: 'DELETE',
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error deleting sucursal:', error);
    throw error;
  }
};

// Empleados
export const fetchEmpleados = async (sucursalId = null) => {
  try {
    const url = sucursalId ? 
      `${API_URL}/empleados?sucursal_id=${sucursalId}` : 
      `${API_URL}/empleados`;
    const response = await fetch(url);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error fetching empleados:', error);
    throw error;
  }
};

export const fetchEmpleado = async (id) => {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error fetching empleado:', error);
    throw error;
  }
};

export const createEmpleado = async (empleado) => {
  try {
    const response = await fetch(`${API_URL}/empleados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(empleado),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error creating empleado:', error);
    throw error;
  }
};

export const updateEmpleado = async (id, empleado) => {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(empleado),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error updating empleado:', error);
    throw error;
  }
};

export const deleteEmpleado = async (id) => {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'DELETE',
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error deleting empleado:', error);
    throw error;
  }
};

// Reportes
export const generateExcelReport = async () => {
  try {
    const response = await fetch(`${API_URL}/reporte/excel`);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Usuarios y Autenticación
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
    });
    return handleFetchResponse(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};