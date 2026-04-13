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

    await db.get('PRAGMA foreign_keys = ON');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        contraseña_hash TEXT NOT NULL,
        clave_publica TEXT NOT NULL,
        clave_privada_cifrada TEXT NOT NULL,
        crypto_salt TEXT NOT NULL,
        crypto_nonce TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmado INTEGER DEFAULT 0,
        token_confirmacion TEXT
      );

      CREATE TABLE IF NOT EXISTS chef (
        id_chef INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        contraseña_hash TEXT NOT NULL,
        clave_publica TEXT NOT NULL,
        clave_privada_cifrada TEXT NOT NULL,
        crypto_salt TEXT NOT NULL,
        crypto_nonce TEXT NOT NULL,
        descripcion TEXT,
        foto_url TEXT,
        estrellas INTEGER DEFAULT 5,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmado INTEGER DEFAULT 0,
        token_confirmacion TEXT,
        precio_3m DECIMAL(10,2) DEFAULT 150.00,
        precio_6m DECIMAL(10,2) DEFAULT 250.00,
        precio_12m DECIMAL(10,2) DEFAULT 400.00
      );

      -- MODIFICADO: Cambiamos 'categoria TEXT' por 'id_categoria INTEGER' para hacerlo relacional
      CREATE TABLE IF NOT EXISTS receta (
        id_receta INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        subtitulo TEXT,
        descripcion TEXT,
        tiempo_preparacion TEXT,
        dificultad TEXT,
        porciones INTEGER,
        id_categoria INTEGER, 
        url_archivo_cifrado TEXT NOT NULL,
        hash_archivo TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_chef INTEGER,
        FOREIGN KEY (id_chef) REFERENCES chef(id_chef) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria) REFERENCES categorias_cocina(id_categoria)
      );

      CREATE TABLE IF NOT EXISTS favoritos (
        id_favorito INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        id_receta INTEGER NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_receta) REFERENCES receta(id_receta) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS categorias_cocina (
        id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );

      INSERT OR IGNORE INTO categorias_cocina (nombre) VALUES 
      ('Mexicana'), ('Italiana'), ('Japonesa'), ('China'), 
      ('Francesa'), ('Mediterránea'), ('Vegetariana'), ('Vegana'), 
      ('Postres y Repostería'), ('Mariscos'), ('Desayunos'), 
      ('Comida Rápida'), ('Bebidas y Coctelería'), ('Cortes de Carne');

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

      -- MODIFICADO: Agregamos 'id_chef' para que el autor también pueda guardar/recuperar su llave
      CREATE TABLE IF NOT EXISTS clave_receta (
        id_clave INTEGER PRIMARY KEY AUTOINCREMENT,
        id_receta INTEGER,
        clave_simetrica_cifrada TEXT NOT NULL,
        fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    // Limpiamos espacios en blanco extra que puedan causar el error "."
    const cleanSql = sql.trim();
    const isSelect = cleanSql.toUpperCase().startsWith('SELECT');

    try {
      if (isSelect) {
        return await database.all(cleanSql, params);
      } else {
        const result = await database.run(cleanSql, params);
        return { 
          insertId: result.lastID, 
          lastID: result.lastID, 
          changes: result.changes 
        };
      }
    } catch (err) {
      console.error("Error ejecución SQL:", err.message);
      throw err;
    }
  }
};

module.exports = pool;