const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - Listar usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getUserById);

router.post('/register', userController.registerUser);
router.post('/register-chef', userController.registerChef);
router.post('/login', userController.loginUser);
router.get('/confirmar/:token', userController.confirmEmail);

module.exports = router;