const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - Listar usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getUserById);

// POST /api/users/register - Registrar nuevo usuario
router.post('/register', userController.registerUser);

// POST /api/users/register-chef - Registrar nuevo chef
router.post('/register-chef', userController.registerChef);

// POST /api/users/login - Iniciar sesión
router.post('/login', userController.loginUser);

// GET /api/users/confirmar/:token - Confirmar correo electrónico
router.get('/confirmar/:token', userController.confirmEmail);

module.exports = router;