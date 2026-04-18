const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ==== AUTENTICACIÓN Y REGISTRO ====

// Registrar un nuevo usuario (Suscriptor)
// POST /api/users/register
router.post('/register', userController.registerUser);

// Registrar un nuevo creador de contenido (Chef)
// POST /api/users/register-chef
router.post('/register-chef', userController.registerChef);

// Iniciar sesión (para ambos roles: Suscriptor y Chef)
// POST /api/users/login
router.post('/login', userController.loginUser);

// ==== VALIDACIÓN Y SEGURIDAD ====

// Confirmar correo electrónico mediante token de seguridad
// GET /api/users/confirmar/:token
router.get('/confirmar/:token', userController.confirmEmail);

// ==== RUTAS DE PRUEBA / DESARROLLO ====

// Listar todos los usuarios registrados
// GET /api/users
router.get('/', userController.getAllUsers);

// Obtener la información de un usuario específico por su ID
// GET /api/users/:id
router.get('/:id', userController.getUserById);

module.exports = router;