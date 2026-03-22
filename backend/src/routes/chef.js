const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');

// Obtener estadísticas, perfil, recetas y suscriptores de un chef específico
// GET /api/chef/dashboard/:id_chef
router.get('/dashboard/:id_chef', chefController.getChefDashboard);

// Actualizar perfil del chef
// PUT /api/chef/profile/:id_chef
router.put('/profile/:id_chef', chefController.updateChefProfile);

// Subir una nueva receta (Cifrado AES-128 + Registro en BD)
// POST /api/chef/upload
router.post('/upload', chefController.uploadRecipe);

// Eliminar una receta de la bóveda
// DELETE /api/chef/recipe/:id_receta
router.delete('/recipe/:id_receta', async (req, res) => {
    // Implementación rápida para borrar
    try {
        const { id_receta } = req.params;
        const pool = require('../config/database');
        await pool.query('DELETE FROM receta WHERE id_receta = ?', [id_receta]);
        res.json({ status: 'ok', message: 'Receta eliminada de la bóveda.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

module.exports = router;