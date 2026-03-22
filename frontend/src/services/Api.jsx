const API_URL = 'http://localhost:3000/api';

export const api = {

  // --- AUTENTICACIÓN ---
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
    const res = await fetch(`${API_URL}/users/register-chef`, {
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
  },

  // --- DASHBOARD DEL CHEF ---

  // Obtener estadísticas, recetas y suscriptores del Chef
  async getChefDashboard(id_chef) {
    const response = await fetch(`${API_URL}/chef/dashboard/${id_chef}`);
    return await response.json();
  },

  // Subir y cifrar una nueva receta
  async uploadRecipe(recipeData) {
    const response = await fetch(`${API_URL}/chef/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipeData),
    });
    return await response.json();
  },

  // Eliminar una receta
  async deleteRecipe(id_receta) {
    const response = await fetch(`${API_URL}/chef/recipe/${id_receta}`, {
      method: 'DELETE',
    });
    return await response.json();
  },

  // Obtener categorías de cocina para el formulario de subida de recetas
  async getCategories() {
    const response = await fetch(`${API_URL}/chef/categorias`);
    return await response.json();
  },

  // Actualizar perfil del chef (descripción, foto, etc.)
  async updateChefProfile(id_chef, profileData) {
    const response = await fetch(`${API_URL}/chef/profile/${id_chef}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },

  // Actualizar receta (cifrado + actualización en BD)
  async getDecryptedRecipe(id_receta) {
      // Asegúrate de que la ruta sea EXACTAMENTE igual a la del router de arriba
      const response = await fetch(`${API_URL}/chef/recipe/decrypt/${id_receta}`);
      if (!response.ok) throw new Error('Error al obtener receta descifrada');
      return await response.json();
  }
};

