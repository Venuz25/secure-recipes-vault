const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');

// ==== DASHBOARD Y PERFIL DEL CHEF ====

// Obtener estadísticas, perfil, recetas y suscriptores
// GET /api/chef/dashboard/:id_chef
router.get('/dashboard/:id_chef', chefController.getChefDashboard);

// Actualizar información del perfil del chef
// PUT /api/chef/profile/:id_chef
router.put('/profile/:id_chef', chefController.updateChefProfile);

// Actualizar los precios de suscripción
// PUT /api/chef/:id_chef/prices
router.put('/:id_chef/prices', chefController.updateChefPrices);

// ==== CATEGORÍAS ====

// Obtener categorías de cocina para el formulario de recetas
// GET /api/chef/categorias
router.get('/categorias', chefController.getCategories);

// ==== GESTIÓN DE RECETAS (BÓVEDA) ====

// Subir una nueva receta (Cifrado AES-128 + Registro en BD)
// POST /api/chef/upload
router.post('/upload', chefController.uploadRecipe);

// Obtener y descifrar una receta específica para edición
// GET /api/chef/recipe/decrypt/:id_receta
router.get('/recipe/decrypt/:id_receta', chefController.getDecryptedRecipe);

// Actualizar receta existente (Re-cifrado AES-128 + Actualización)
// PUT /api/chef/recipe/:id_receta
router.put('/recipe/:id_receta', chefController.updateRecipe);

// Eliminar receta y su archivo físico cifrado
// DELETE /api/chef/recipe/:id_receta
router.delete('/recipe/:id_receta', chefController.deleteRecipe);

// ==== GESTIÓN DE SUSCRIPCIONES ====

// Cancelar suscripción de un usuario
// PUT /api/chef/subscription/cancel/:id_contrato
router.put('/subscription/cancel/:id_contrato', chefController.cancelSubscription);

// Reactivar suscripción de un usuario
// PUT /api/chef/subscription/activate/:id_contrato
router.put('/subscription/activate/:id_contrato', chefController.reactivateSubscription);

// Eliminar contrato de suscripción permanentemente
// DELETE /api/chef/subscription/:id_contrato
router.delete('/subscription/:id_contrato', chefController.deleteSubscription);

module.exports = router;