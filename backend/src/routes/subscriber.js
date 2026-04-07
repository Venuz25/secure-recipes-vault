// backend/src/routes/subscriber.js
const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

// Exploración de la Bóveda
router.get('/explore', subscriberController.exploreRecipes);

// Biblioteca Personal (Favoritos y Contratos)
router.get('/my-library/:id_usuario', subscriberController.getLibrary);

// Suscripciones y Favoritos
router.post('/subscribe', subscriberController.subscribe);
router.post('/favorite/toggle', subscriberController.toggleFavorite);

// Acceso Seguro a Contenido Descifrado
router.post('/recipe/access', subscriberController.getRecipeContent);

module.exports = router;