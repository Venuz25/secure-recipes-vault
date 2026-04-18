const API_URL = 'http://localhost:3000/api';

export const api = {

  // AUTENTICACIÓN Y REGISTRO
  // Registrar un nuevo usuario (suscriptor)
  register: async (userData) => {
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

  // Iniciar sesión (tanto para suscriptores como para chefs)
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await response.json();
  },


  // DASHBOARD Y FUNCIONES DEL CHEF
  // Perfil y Estadísticas
  getChefDashboard: async (id_chef) => {
    const response = await fetch(`${API_URL}/chef/dashboard/${id_chef}`);
    return await response.json();
  },

  // Editar perfil del chef (nombre, descripción, foto)
  updateChefProfile: async (id_chef, profileData) => {
    const response = await fetch(`${API_URL}/chef/profile/${id_chef}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },

  // Actualizar precios de suscripción
  updateChefPrices: async (id_chef, pricesData) => {
    try {
      const response = await fetch(`${API_URL}/chef/${id_chef}/prices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricesData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar precios:', error);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  // Obetener categorías disponibles para las recetas
  getCategories: async () => {
    const response = await fetch(`${API_URL}/chef/categorias`);
    return await response.json();
  },

  // Gestión de Recetas
  uploadRecipe: async (recipeData) => {
    const response = await fetch(`${API_URL}/chef/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipeData),
    });
    return await response.json();
  },

  // Obtener receta descifrada para edición
  getDecryptedRecipe: async (id_receta) => {
    const response = await fetch(`${API_URL}/chef/recipe/decrypt/${id_receta}`);
    if (!response.ok) throw new Error('Error al obtener receta descifrada');
    return await response.json();
  },

  // Actualizar receta existente
  updateRecipe: async (id_receta, recipeData) => {
    try {
      const response = await fetch(`${API_URL}/chef/recipe/${id_receta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });
      return await response.json();
    } catch (error) {
      console.error("Error en Api.updateRecipe:", error);
      throw error;
    }
  },

  // Eliminar receta
  deleteRecipe: async (id_receta) => {
    const response = await fetch(`${API_URL}/chef/recipe/${id_receta}`, {
      method: 'DELETE',
    });
    return await response.json();
  },

  // Cancelar suscripción de un usuario
  cancelSubscription: async (id_contrato) => {
    const res = await fetch(`${API_URL}/chef/subscription/cancel/${id_contrato}`, { method: 'PUT' });
    return await res.json();
  },

  // Reactivar suscripción de un usuario
  reactivateSubscription: async (id_contrato) => {
    const res = await fetch(`${API_URL}/chef/subscription/activate/${id_contrato}`, { method: 'PUT' });
    return await res.json();
  },
  
  // Eliminar completamente una suscripción
  deleteSubscription: async (id_contrato) => {
    const res = await fetch(`${API_URL}/chef/subscription/${id_contrato}`, { method: 'DELETE' });
    return await res.json();
  },


  // DASHBOARD Y FUNCIONES DEL SUSCRIPTOR
  // Exploración y Descubrimiento
  exploreRecipes: async (filters) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_URL}/subscriber/explore?${query}`);
    return await res.json();
  },

  // Ver perfil público de un chef
  getPublicChefProfile: async (id_chef) => {
    const res = await fetch(`${API_URL}/subscriber/chef-profile/${id_chef}`);
    return await res.json();
  },

  // Biblioteca Personal
  getUserLibrary: async (id_usuario) => {
    const res = await fetch(`${API_URL}/subscriber/my-library/${id_usuario}`);
    return await res.json();
  },

  // Agregar o quitar receta de favoritos
  toggleFavorite: async (id_usuario, id_receta) => {
    const res = await fetch(`${API_URL}/subscriber/favorite/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario, id_receta }),
    });
    return await res.json();
  },

  // Solicitar acceso al contenido de una receta (descifrado y verificación de suscripción)
  getSubscriberRecipeContent: async (payload) => {
    const res = await fetch(`${API_URL}/subscriber/recipe/access`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload), 
    });
    return await res.json();
  },

  // Crear nueva suscripción a un chef (procesar pago simulado y activar acceso)
  createSubscription: async (data) => {
    const res = await fetch(`${API_URL}/subscriber/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Cancelar suscripción activa (revocar acceso a la bóveda del chef)
  cancelUserSubscription: async (id_contrato) => {
    try {
      const response = await fetch(`${API_URL}/subscriber/subscription/cancel/${id_contrato}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error('Error en API al cancelar:', error);
      return { status: 'error', message: 'Error de conexión con el servidor' };
    }
  }

};