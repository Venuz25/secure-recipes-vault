const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function getDB() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, '../../recetas.db'),
      driver: sqlite3.Database
    });

    // Activar soporte para claves foráneas
    await db.get('PRAGMA foreign_keys = ON');

    // Creación de tablas según el esquema de MySQL adaptado a SQLite
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        contraseña_hash TEXT NOT NULL,
        clave_publica TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chef (
        id_chef INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        clave_publica TEXT NOT NULL,
        clave_privada_cifrada TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS receta (
        id_receta INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        url_archivo_cifrado TEXT NOT NULL,
        hash_archivo TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_chef INTEGER,
        FOREIGN KEY (id_chef) REFERENCES chef(id_chef) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contrato (
        id_contrato INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        id_chef INTEGER NOT NULL,
        periodo_meses INTEGER NOT NULL,
        costo DECIMAL(8,2) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo','expirado','cancelado')),
        CHECK (periodo_meses IN (3,6,12)),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_chef) REFERENCES chef(id_chef) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS clave_receta (
        id_clave INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        id_receta INTEGER,
        clave_simetrica_cifrada TEXT NOT NULL,
        fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_receta) REFERENCES receta(id_receta) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    console.log('Base de datos SQLite inicializada correctamente.');
  }
  return db;
}

const pool = {
  query: async (sql, params = []) => {
    const database = await getDB();
    const trimmedSql = sql.trim().toLowerCase();
    
    if (trimmedSql.startsWith('select')) {
      return await database.all(sql, params);
    } else {
      const result = await database.run(sql, params);
      return { 
        insertId: result.lastID,
        changes: result.changes
      };
    }
  }
};

module.exports = pool;