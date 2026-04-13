const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

// Exploración de la Bóveda
// GET /api/subscriber/explore
router.get('/explore', subscriberController.exploreRecipes);

// Biblioteca Personal (Favoritos y Contratos)
// GET /api/subscriber/my-library/:id_usuario
router.get('/my-library/:id_usuario', subscriberController.getLibrary);

// Suscripciones y Favoritos
// POST /api/subscriber/subscribe
router.post('/subscribe', subscriberController.subscribe);
router.post('/favorite/toggle', subscriberController.toggleFavorite);

// Acceso Seguro a Contenido Descifrado
// POST /api/subscriber/recipe/access
router.post('/recipe/access', subscriberController.getRecipeContent);

// Ruta pública para ver los detalles del chef antes de suscribirse
// GET /api/subscriber/chef-profile/:id_chef
router.get('/chef-profile/:id_chef', subscriberController.getPublicChefProfile);

module.exports = router;