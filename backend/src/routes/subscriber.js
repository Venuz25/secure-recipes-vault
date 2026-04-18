const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

// ==== EXPLORACIÓN Y DESCUBRIMIENTO ====

// Explorar todas las recetas públicas con filtros de búsqueda
// GET /api/subscriber/explore
router.get('/explore', subscriberController.exploreRecipes);

// Ver el perfil público de un chef (estadísticas y planes) antes de suscribirse
// GET /api/subscriber/chef-profile/:id_chef
router.get('/chef-profile/:id_chef', subscriberController.getPublicChefProfile);

// ==== BÓVEDA Y BIBLIOTECA PERSONAL ====

// Obtener los favoritos y suscripciones activas de un usuario
// GET /api/subscriber/my-library/:id_usuario
router.get('/my-library/:id_usuario', subscriberController.getLibrary);

// Solicitar el descifrado y acceso seguro al contenido de una receta
// POST /api/subscriber/recipe/access
router.post('/recipe/access', subscriberController.getRecipeContent);

// Agregar o quitar una receta del libro de favoritos
// POST /api/subscriber/favorite/toggle
router.post('/favorite/toggle', subscriberController.toggleFavorite);

// ==== SUSCRIPCIONES Y PAGOS ====

// Procesar el pago y activar una nueva suscripción a un Chef
// POST /api/subscriber/subscribe
router.post('/subscribe', subscriberController.subscribe);

// Cancelar una suscripción activa (revoca el acceso a la bóveda del chef)
// PUT /api/subscriber/subscription/cancel/:id_contrato
router.put('/subscription/cancel/:id_contrato', subscriberController.cancelUserSubscription);

module.exports = router;