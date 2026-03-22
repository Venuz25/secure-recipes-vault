const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rutas
const usersRouter = require('./routes/users');
const chefRouter = require('./routes/chef');

app.use('/api/users', usersRouter);
app.use('/api/chef', chefRouter);

// Probar conexión a BD
app.get('/api/db/test', async (req, res) => {
  try {

    const [rows] = await pool.query('SELECT NOW() AS ahora');

    res.json({
      status: 'ok',
      message: 'Conexión a BD exitosa',
      database_time: rows[0].ahora
    });

  } catch (error) {

    res.status(500).json({
      status: 'error',
      message: 'Error de conexión a la base de datos',
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

// Manejo global de errores
app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor'
  });

});

// Cierre graceful del servidor
const shutdown = async () => {

  console.log('Cerrando servidor...');

  try {

    await pool.end();
    console.log('Conexión a BD cerrada');

  } catch (error) {

    console.error('Error cerrando BD:', error);

  }

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Iniciar servidor
app.listen(PORT, () => {

  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);

});