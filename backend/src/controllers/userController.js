const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración de transporte de correo
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "38cae516cfd1e7", 
    pass: "e5c208d4e17bc1"
  }
});

// REGISTRO: Crea usuario, genera token de confirmación y envía correo
exports.registerUser = async (req, res) => {
  try {
    const { nombre, correo, password, clave_publica } = req.body;

    // Validación de campos
    if (!nombre || !correo || !password || !clave_publica) {
      return res.status(400).json({ status: 'error', message: 'Faltan ingredientes (campos requeridos)' });
    }

    // Verificar si el correo ya existe
    const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Este correo ya está en nuestro recetario.' });
    }

    // Generar un token único para este registro
    const token = crypto.randomBytes(32).toString('hex');

    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar en la base de datos (incluyendo el token)
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, contraseña_hash, clave_publica, token_confirmacion) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, correo, password_hash, clave_publica, token]
    );

    // Preparar el diseño del correo rústico
    const confirmUrl = `http://localhost:3000/api/users/confirmar/${token}`;
    
    const mailOptions = {
      from: '"Chef Mexicana 🌶️" <boveda@recetas.com>',
      to: correo,
      subject: "🍲 Confirma tu suscripción a la Bóveda Culinaria",
      html: `
        <div style="background-color: #FDF8F1; padding: 30px; border: 2px solid #D7CCC8; border-radius: 15px; font-family: 'Georgia', serif; max-width: 500px; margin: auto;">
          <h1 style="color: #5D4037; text-align: center;">¡Hola, ${nombre}!</h1>
          <p style="color: #8D6E63; font-size: 16px; line-height: 1.6;">
            Gracias por interesarte en mis recetas secretas. Para completar tu contrato digital y 
            asegurar que nadie más use tu cuenta, por favor confirma tu correo haciendo clic abajo:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #D35400; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
              Confirmar mi Cuenta
            </a>
          </div>
          <p style="color: #A1887F; font-size: 12px; font-style: italic; text-align: center;">
            Este enlace es parte de nuestro protocolo de criptografía híbrida para tu seguridad.
          </p>
        </div>
      `
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.json({
      status: 'ok',
      message: '¡Casi listo! Revisa tu correo para confirmar tu cuenta y entrar a la cocina.',
      data: { id_usuario: result.insertId }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ status: 'error', message: "Error al sazonar el registro." });
  }
};

// LOGIN: Verifica credenciales y estado de confirmación
exports.loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const rows = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    // 1. Verificar contraseña
    const match = await bcrypt.compare(password, usuario.contraseña_hash);
    if (!match) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    // 2. Verificar si ya confirmó su correo
    if (usuario.confirmado === 0) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Por favor, confirma tu correo electrónico para entrar a la cocina.' 
      });
    }

    res.json({ status: 'ok', message: '¡Acceso exitoso! Bienvenido a la bóveda.', data: { nombre: usuario.nombre } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// CONFIRMACIÓN: Activa la cuenta mediante el token
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await pool.query('SELECT id_usuario FROM usuarios WHERE token_confirmacion = ?', [token]);

    if (!user || user.length === 0) {
      return res.send('<h1>El enlace ha expirado o es inválido.</h1>');
    }

    await pool.query(
      'UPDATE usuarios SET confirmado = 1, token_confirmacion = NULL WHERE id_usuario = ?',
      [user[0].id_usuario]
    );

    res.send('<h1>¡Cuenta confirmada! Ya puedes cerrar esta pestaña e iniciar sesión.</h1>');
  } catch (error) {
    res.status(500).send('Error al confirmar.');
  }
};

// TEST: Obtener todos los usuarios registrados
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

// TEST: Obtener usuario por ID
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