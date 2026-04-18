const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');

// Rutas del Protocolo de Descifrado Local
router.post('/unlock-identity', cryptoController.unlockIdentity);
router.post('/unwrap-key', cryptoController.unwrapKey);
router.post('/decrypt-recipe', cryptoController.decryptRecipe);

module.exports = router;