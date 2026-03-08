const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recetas_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('Conectado a MySQL');
    console.log(`Base de datos: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch(error => {
    console.error('ERROR DE CONEXIÓN A MYSQL:');
    console.error('   Código:', error.code);
    console.error('   Mensaje:', error.message);
    console.error('   Configuración:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
  });

module.exports = pool;