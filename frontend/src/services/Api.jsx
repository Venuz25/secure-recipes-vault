const API_URL = 'http://localhost:3000/api';

export const api = {
  // Registrar un nuevo usuario
  async register(userData) {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  // Registrar un nuevo chef
  registerChef: async (data) => {
  const res = await fetch(`${BASE_URL}/users/register-chef`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
},

  // Iniciar sesión
  async login(credentials) {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await response.json();
  }
};