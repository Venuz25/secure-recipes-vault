const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// Probar conexión a BD
app.get('/api/db/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as ahora');
    res.json({ 
      status: 'ok', 
      message: 'Conexión a BD exitosa',
      timestamp: rows[0].ahora
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error de conexión a BD',
      error: error.message 
    });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({ 
    proyecto: 'Recetas Deliciosas Como Servicio',
    version: '1.0.0',
    equipo: 'Areli Guevara & Rigel Ocaña',
    grupo: '7CM1'
  });
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await pool.end();
  console.log('Conexión a BD cerrada');
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});