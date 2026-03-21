const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios registrados
exports.getAllUsers = async (req, res) => {
  try {
    const rows = await pool.query(
      'SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios'
    );
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await pool.query(
      'SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    res.json({ status: 'ok', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Registrar nuevo suscriptor
exports.registerUser = async (req, res) => {
  try {
    const { nombre, correo, password, clave_publica } = req.body;

    if (!nombre || !correo || !password || !clave_publica) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos requeridos' });
    }

    const existing = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'El correo ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, contraseña_hash, clave_publica) VALUES (?, ?, ?, ?)`,
      [nombre, correo, password_hash, clave_publica]
    );

    res.json({
      status: 'ok',
      message: 'Usuario registrado con éxito',
      data: {
        id_usuario: result.insertId,
        nombre,
        correo
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};