const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { spawn } = require('child_process');
const path = require('path');

// Configuración de transporte de correo
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "38cae516cfd1e7", 
    pass: "e5c208d4e17bc1"
  }
});

// GENERAR CLAVES: Llama al script de Python para generar claves
const callPythonKeys = (password) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/keys.py');
        const python = spawn('python', [scriptPath, 'generate', password]); 

        let result = "";
        let errorData = "";

        python.stdout.on('data', (data) => { result += data.toString(); });
        python.stderr.on('data', (data) => { errorData += data.toString(); });

        python.on('close', (code) => {
            if (code !== 0) {
                reject(`Error en Python (Código ${code}): ${errorData}`);
                return;
            }
            try {
                resolve(JSON.parse(result));
            } catch (e) {
                reject(`Error al procesar la respuesta de Python. Recibido: ${result}`);
            }
        });
    });
};

// REGISTRO USUARIO: Crea usuario, genera token de confirmación y envía correo
exports.registerUser = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos requeridos' });
        }

        const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Este correo ya está registrado.' });
        }

        const cryptoData = await callPythonKeys(password);
        const password_hash = await bcrypt.hash(password, 10);
        const token = crypto.randomBytes(32).toString('hex');

        // CORRECCIÓN: Se cambió encrypted_private_key por encrypted_private para coincidir con Python
        await pool.query(
            `INSERT INTO usuarios 
            (nombre, correo, contraseña_hash, clave_publica, clave_privada_cifrada, crypto_salt, crypto_nonce, token_confirmacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre, 
                correo, 
                password_hash, 
                cryptoData.public_key, 
                cryptoData.encrypted_private_key, 
                cryptoData.salt, 
                cryptoData.nonce,
                token
            ]
        );

        const confirmUrl = `http://localhost:3000/api/users/confirmar/${token}`;
        const mailOptions = {
            from: '"Chef Mexicana 🌶️" <boveda@recetas.com>',
            to: correo,
            subject: "🍲 Confirma tu suscripción a la Bóveda Culinaria",
            html: `
                <div style="background-color: #FDF8F1; padding: 30px; border: 2px solid #D7CCC8; border-radius: 15px; font-family: 'Georgia', serif; max-width: 500px; margin: auto;">
                    <h1 style="color: #5D4037; text-align: center;">¡Hola, ${nombre}!</h1>
                    <p style="color: #8D6E63; font-size: 16px; line-height: 1.6;">
                        Tu cuenta ha sido protegida con criptografía híbrida. Confirma tu correo para activar tu acceso:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmUrl}" style="background-color: #D35400; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Confirmar mi Cuenta
                        </a>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            status: 'ok',
            message: '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.',
            data: { id_usuario: token }
        });

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ status: 'error', message: "Error al procesar la seguridad del registro." });
    }
};

// REGISTRO CHEF: Similar a usuario pero inserta en la tabla chef
exports.registerChef = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    console.log("Datos recibidos:", { nombre, correo });

    const checkUser = await pool.query('SELECT correo FROM usuarios WHERE correo = ?', [correo]);
    const checkChef = await pool.query('SELECT correo FROM chef WHERE correo = ?', [correo]);
    
    if ((checkUser && checkUser.length > 0) || (checkChef && checkChef.length > 0)) {
      return res.status(400).json({ status: 'error', message: 'Este correo ya está registrado.' });
    }

    const cryptoData = await callPythonKeys(password);
    const password_hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO chef 
      (nombre, correo, contraseña_hash, clave_publica, clave_privada_cifrada, crypto_salt, crypto_nonce, token_confirmacion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, correo, password_hash, cryptoData.public_key, cryptoData.encrypted_private_key, cryptoData.salt, cryptoData.nonce, token]
    );

    const confirmUrl = `http://localhost:3000/api/users/confirmar/${token}?tipo=chef`;
    await transporter.sendMail({
      from: '"Bóveda Culinaria 🌶️" <chef@recetas.com>',
      to: correo,
      subject: "👨‍🍳 ¡Bienvenida Chef! Confirme su identidad",
      html: `<div style="background-color: #FDF8F1; padding: 30px; border: 2px solid #D7CCC8; border-radius: 15px; font-family: 'Georgia', serif; text-align: center;">
              <h1>Bienvenida Chef ${nombre}</h1>
              <p>Activa tu acceso para comenzar a subir tus secretos culinarios:</p>
              <a href="${confirmUrl}" style="background-color: #D35400; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activar Cuenta de Chef</a>
            </div>`
    });

    res.json({ status: 'ok', message: 'Registro de Chef exitoso. Revisa tu correo para confirmar.' });
  } catch (error) {
    console.error("Error en registro chef:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// LOGIN: Verifica credenciales y desbloquea llave privada
exports.loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;
    let rol = 'usuario';
    
    let rows = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    
    if (!rows || rows.length === 0) {
      rows = await pool.query('SELECT * FROM chef WHERE correo = ?', [correo]);
      if (rows && rows.length > 0) rol = 'chef';
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const persona = rows[0];

    const match = await bcrypt.compare(password, persona.contraseña_hash);
    if (!match) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });

    if (persona.confirmado === 0) {
      return res.status(403).json({ status: 'error', message: 'Por favor, confirma tu correo electrónico.' });
    }

    const cryptoCheck = await new Promise((resolve) => {
      const python = spawn('python', [
        path.join(__dirname, '../../crypto_vault/keys.py'),
        'decrypt', password, persona.clave_privada_cifrada, persona.crypto_salt, persona.crypto_nonce
      ]);
      let result = "";
      python.stdout.on('data', (d) => result += d);
      python.on('close', () => resolve(JSON.parse(result || '{"status":"error"}')));
    });

    if (cryptoCheck.status === 'error') {
      return res.status(401).json({ status: 'error', message: 'Error de integridad en las llaves' });
    }

    res.json({ 
      status: 'ok', 
      message: `¡Bienvenido ${rol === 'chef' ? 'Chef' : ''}!`, 
      data: { nombre: persona.nombre, rol: rol } 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// CONFIRMACIÓN: Ahora soporta tanto usuarios como chefs usando el parámetro ?tipo=chef
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const { tipo } = req.query; // Obtener ?tipo=chef si existe

    const esChef = tipo === 'chef';
    const tabla = esChef ? 'chef' : 'usuarios';
    const idColumna = esChef ? 'id_chef' : 'id_usuario';

    // Buscar el registro con el token
    const result = await pool.query(`SELECT ${idColumna} FROM ${tabla} WHERE token_confirmacion = ?`, [token]);

    if (!result || result.length === 0) {
      return res.send('<h1>El enlace ha expirado o es inválido.</h1>');
    }

    const id = result[0][idColumna];

    // Marcar como confirmado
    await pool.query(
      `UPDATE ${tabla} SET confirmado = 1, token_confirmacion = NULL WHERE ${idColumna} = ?`,
      [id]
    );

    res.send(`<h1>¡Cuenta de ${esChef ? 'Chef' : 'Suscriptor'} confirmada! Ya puedes iniciar sesión.</h1>`);
  } catch (error) {
    console.error("Error al confirmar:", error);
    res.status(500).send('Error al confirmar.');
  }
};

// TEST: Obtener todos los usuarios registrados
exports.getAllUsers = async (req, res) => {
  try {
    const rows = await pool.query('SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios');
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// TEST: Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await pool.query('SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios WHERE id_usuario = ?', [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    res.json({ status: 'ok', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};