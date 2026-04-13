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

  // Actualizar una receta existente (con re-cifrado)
  updateRecipe: async (id_receta, recipeData) => {
    try {
      const response = await fetch(`${API_URL}/chef/recipe/${id_receta}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      return await response.json();
    } catch (error) {
      console.error("Error en Api.updateRecipe:", error);
      throw error;
    }
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

  // Descifrar y obtener el contenido de una receta (para edición)
  async getDecryptedRecipe(id_receta) {
      const response = await fetch(`${API_URL}/chef/recipe/decrypt/${id_receta}`);
      if (!response.ok) throw new Error('Error al obtener receta descifrada');
      return await response.json();
  },

  // --- DASHBOARD DEL USUARIO ---
  // Buscar recetas con filtros
  exploreRecipes: async (filters) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_URL}/subscriber/explore?${query}`);
    return await res.json();
  },

  // Obtener favoritos y suscripciones
  getUserLibrary: async (id_usuario) => {
    const res = await fetch(`${API_URL}/subscriber/my-library/${id_usuario}`);
    return await res.json();
  },

  // Alternar favoritos (Añadir/Quitar)
  toggleFavorite: async (id_usuario, id_receta) => {
    const res = await fetch(`${API_URL}/subscriber/favorite/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario, id_receta }),
    });
    return await res.json();
  },

  // Crear suscripción (Contrato)
  createSubscription: async (data) => {
    const res = await fetch(`${API_URL}/subscriber/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Acceso a receta cifrada para el suscriptor
  getSubscriberRecipeContent: async (data) => {
    const res = await fetch(`${API_URL}/subscriber/recipe/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Cancelar suscripción (Contrato)
  updateChefPrices: (id_chef, prices) => 
    fetch(`${API_URL}/chef/prices/${id_chef}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prices)
    }).then(res => res.json()),

  // Cancelar suscripción (Contrato)
  cancelSubscription: (id_contrato) => 
      fetch(`${API_URL}/chef/subscription/cancel/${id_contrato}`, { 
        method: 'PUT' 
      }).then(res => res.json()),

  // Reactivar suscripción (Contrato)
  reactivateSubscription: (id_contrato) => 
      fetch(`${API_URL}/chef/subscription/activate/${id_contrato}`, { 
        method: 'PUT' 
      }).then(res => res.json()),
  
  // Eliminar contrato de suscripción
  deleteSubscription: (id_contrato) => 
      fetch(`${API_URL}/chef/subscription/${id_contrato}`, {
        method: 'DELETE' 
      }).then(res => res.json()),
  
  // Obtener perfil público de un chef (para suscriptores)
  getPublicChefProfile: (id_chef) => 
    fetch(`${API_URL}/chef/public-profile/${id_chef}`).then(res => res.json()),

};