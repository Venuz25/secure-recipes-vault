const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - Listar usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getUserById);

// POST /api/users/register - Registrar usuario
router.post('/register', userController.registerUser);

module.exports = router;