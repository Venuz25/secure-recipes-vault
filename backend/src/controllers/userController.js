const pool = require('../config/database');
const crypto = require('crypto');

// Generar UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Obtener todos los usuarios (pruebas)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, rol, created_at FROM usuarios');
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, email, rol, created_at FROM usuarios WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    
    res.json({ status: 'ok', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Registrar usuario
exports.registerUser = async (req, res) => {
  try {
    const { email, password, rol } = req.body;
    
    // Validar datos
    if (!email || !password || !rol) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos requeridos' });
    }
    
    // Validar rol
    if (!['chef', 'suscriptor'].includes(rol)) {
      return res.status(400).json({ status: 'error', message: 'Rol inválido' });
    }
    
    // Generar ID y hash de contraseña
    const id = generateUUID();
    const password_hash = password; // Temporal
    
    // Insertar usuario
    await pool.query(
      'INSERT INTO usuarios (id, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [id, email, password_hash, rol]
    );
    
    res.json({ 
      status: 'ok', 
      message: 'Usuario registrado',
      data: { id, email, rol }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};