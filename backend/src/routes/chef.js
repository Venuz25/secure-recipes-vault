const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');

// Obtener estadísticas, perfil, recetas y suscriptores de un chef específico
// GET /api/chef/dashboard/:id_chef
router.get('/dashboard/:id_chef', chefController.getChefDashboard);

// Actualizar perfil del chef
// PUT /api/chef/profile/:id_chef
router.put('/profile/:id_chef', chefController.updateChefProfile);

// Obtener categorías de cocina para el formulario de subida de recetas
// GET /api/chef/categorias
router.get('/categorias', chefController.getCategories);

// Subir una nueva receta (Cifrado AES-128 + Registro en BD)
// POST /api/chef/upload
router.post('/upload', chefController.uploadRecipe);

// Obtener y descifrar una receta específica
// GET /api/chef/recipe/decrypt/:id_receta
router.get('/recipe/decrypt/:id_receta', chefController.getDecryptedRecipe);

// Actualizar receta (Cifrado AES-128 + Actualización en BD)
// PUT /api/chef/recipe/:id_receta
router.put('/recipe/:id_receta', chefController.updateRecipe);

// Eliminar receta
// DELETE /api/chef/recipe/:id_receta
router.delete('/recipe/:id_receta', chefController.deleteRecipe);

// Actualizar precios de suscripción del chef
// PUT /api/chef/prices/:id_chef
router.put('/prices/:id_chef', chefController.updateChefPrices);

// Cancelar suscripción de un usuario (solo para el chef)
// POST /api/chef/subscription/:id_contrato/cancel
router.put('/subscription/cancel/:id_contrato', chefController.cancelSubscription);

// Reactivar suscripción de un usuario
// PUT /api/chef/subscription/activate/:id_contrato
router.put('/subscription/activate/:id_contrato', chefController.reactivateSubscription);

// Eliminar contrato de suscripción
// DELETE /api/chef/subscription/:id_contrato
router.delete('/subscription/:id_contrato', chefController.deleteSubscription);

module.exports = router;