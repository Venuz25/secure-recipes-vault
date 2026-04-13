const pool = require('./database');

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE chef ADD COLUMN precio_3m DECIMAL(10,2) DEFAULT 150.00;
    `);
    await pool.query(`
      ALTER TABLE chef ADD COLUMN precio_6m DECIMAL(10,2) DEFAULT 250.00;
    `);
    await pool.query(`
      ALTER TABLE chef ADD COLUMN precio_12m DECIMAL(10,2) DEFAULT 400.00;
    `);

    console.log("✅ Alteración completada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

migrate();