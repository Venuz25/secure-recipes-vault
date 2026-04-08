const pool = require('./database');

const migrate = async () => {
  try {
    console.log("--- Iniciando limpieza de clave_receta ---");

    // 1. Crear la nueva estructura simplificada
    await pool.query(`
      CREATE TABLE clave_receta_nueva (
        id_clave INTEGER PRIMARY KEY AUTOINCREMENT,
        id_receta INTEGER NOT NULL,
        clave_simetrica_cifrada TEXT NOT NULL,
        fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_receta) REFERENCES receta(id_receta) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 2. Mover los datos existentes
    await pool.query(`
      INSERT INTO clave_receta_nueva (id_clave, id_receta, clave_simetrica_cifrada, fecha_generacion)
      SELECT id_clave, id_receta, clave_simetrica_cifrada, fecha_generacion FROM clave_receta
    `);

    // 3. Eliminar la vieja y renombrar
    await pool.query(`DROP TABLE clave_receta`);
    await pool.query(`ALTER TABLE clave_receta_nueva RENAME TO clave_receta`);

    console.log("✅ ¡Tabla clave_receta limpia y optimizada con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
};

migrate();