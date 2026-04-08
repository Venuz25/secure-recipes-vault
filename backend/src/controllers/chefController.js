const fs = require('fs-extra');
const pool = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// === UTILS PARA CIFRADO AES-128 ===
// Función para cifrar contenido usando el script de Python
const encryptContent = (jsonData) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');
        const python = spawn('python', [scriptPath, 'encrypt', JSON.stringify(jsonData)]);
        
        let result = "";
        let errorData = "";

        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());

        python.on('close', (code) => {
            if (code !== 0) return reject("Error en Python: " + errorData);
            try { resolve(JSON.parse(result)); }
            catch(e) { reject("Error al parsear JSON de Python: " + result); }
        });
    });
};

// Función para descifrar contenido usando el script de Python
const decryptContent = (nonce, ciphertext, aesKey, expectedHash) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');
        
        const python = spawn('python', [
            scriptPath, 
            'decrypt', 
            nonce, 
            ciphertext, 
            aesKey, 
            expectedHash 
        ]);
        
        let result = "";
        let errorData = "";

        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());

        python.on('close', (code) => {
            if (code !== 0) return reject(errorData || "Error en el módulo de seguridad");
            try {
                resolve(JSON.parse(result.trim()));
            } catch(e) {
                resolve(result.trim());
            }
        });
    });
};

// === CONTROLADORES DASHBOARD ===
// Controlador para obtener estadísticas y datos del dashboard del Chef
exports.getChefDashboard = async (req, res) => {
    const { id_chef } = req.params;
    try {
        const chef = await pool.query('SELECT * FROM chef WHERE id_chef = ?', [id_chef]);
        
        if (!chef || chef.length === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'El Chef con ID ' + id_chef + ' no existe en la base de datos.' 
            });
        }

        const recetas = await pool.query(`
            SELECT r.*, c.nombre AS categoria_nombre, COUNT(f.id_favorito) as favoritos 
            FROM receta r 
            LEFT JOIN categorias_cocina c ON r.id_categoria = c.id_categoria
            LEFT JOIN favoritos f ON r.id_receta = f.id_receta 
            WHERE r.id_chef = ? 
            GROUP BY r.id_receta`, [id_chef]);

        const suscriptores = await pool.query(`
            SELECT u.nombre, u.correo, c.fecha_fin 
            FROM contrato c 
            JOIN usuarios u ON c.id_usuario = u.id_usuario 
            WHERE c.id_chef = ? AND c.estado = 'active'`, [id_chef]);

        res.json({ 
            status: 'ok', 
            data: { perfil: chef[0], recetas, suscriptores } 
        });
    } catch (error) {
        console.error("ERROR EN DASHBOARD:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// === CONTROLADORES PERFIL ===
// Controlador para actualizar perfil del Chef
exports.updateChefProfile = async (req, res) => {
    try {
        const { id_chef } = req.params;
        const { descripcion, foto_url, estrellas } = req.body;

        await pool.query(
            `UPDATE chef SET descripcion = ?, foto_url = ?, estrellas = ? WHERE id_chef = ?`,
            [descripcion, foto_url, estrellas, id_chef]
        );

        res.json({ status: 'ok', message: 'Perfil actualizado' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// === CONTROLADORES RECETAS ===
// Controlador para obtener y descifrar una receta específica
exports.getDecryptedRecipe = async (req, res) => {
  try {
    const { id_receta } = req.params;

    const query = `
      SELECT r.url_archivo_cifrado, r.hash_archivo, c.clave_simetrica_cifrada 
      FROM receta r 
      JOIN clave_receta c ON r.id_receta = c.id_receta 
      WHERE r.id_receta = ?
    `;
    const [receta] = await pool.query(query, [id_receta]);

    const vaultPath = path.join(__dirname, '../../../external_vault', receta.url_archivo_cifrado);
    const fileRaw = await fs.readFile(vaultPath, 'utf8');
    const { nonce, ciphertext } = JSON.parse(fileRaw);

    const decryptedData = await decryptContent(nonce, ciphertext, receta.clave_simetrica_cifrada, receta.hash_archivo);

    res.json({ status: 'ok', data: decryptedData });

  } catch (error) {
    console.error("ERROR AL DESCIFRAR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("INTEGRITY_ERROR")) {
        return res.status(403).json({ 
            status: 'error', 
            message: "Alerta de Seguridad: El contenido de la receta no coincide con su hash." 
        });
    }

    res.status(500).json({ 
        status: 'error', 
        message: "No se pudo descifrar la receta. Verifique los permisos o la integridad del archivo." 
    });
  }
};

// Controlador para subir una nueva receta (cifrado AES-128 + registro en BD)
exports.uploadRecipe = async (req, res) => {
  try {
    const { 
      id_chef, titulo, subtitulo, descripcion, 
      tiempo_preparacion, dificultad, porciones, 
      id_categoria, contenido 
    } = req.body;

    // 1. Cifrado Centralizado en Python
    const cryptoData = await encryptContent(contenido);

    // 2. Guardado de archivo .enc
    const fileName = `recipe_${Date.now()}.enc`;
    const vaultPath = path.join(__dirname, '../../../external_vault', fileName);
    await fs.ensureDir(path.join(__dirname, '../../../external_vault'));
    
    // Guardamos el objeto con nonce y ciphertext que devolvió Python
    await fs.writeFile(vaultPath, JSON.stringify({
        nonce: cryptoData.nonce,
        ciphertext: cryptoData.ciphertext
    }));

    // 3. Inserción en la Base de Datos
    const sql = `
      INSERT INTO receta 
      (titulo, subtitulo, descripcion, tiempo_preparacion, dificultad, porciones, id_categoria, url_archivo_cifrado, hash_archivo, id_chef) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      titulo, subtitulo, descripcion, 
      tiempo_preparacion, dificultad, porciones, 
      id_categoria, fileName, cryptoData.hash, id_chef
    ];

    const result = await pool.query(sql, params);

    // 4. Guardar la llave generada para el Chef
    await pool.query(
      `INSERT INTO clave_receta (id_receta, id_chef, clave_simetrica_cifrada) VALUES (?, ?, ?)`,
      [result.insertId, id_chef, cryptoData.key]
    );

    res.json({ status: 'ok', message: '¡Receta cifrada y guardada!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Controlador para editar una receta existente (cifrado AES-128 + actualización en BD)
exports.updateRecipe = async (req, res) => {
    try {
        const { id_receta } = req.params;
        const { titulo, contenido, ...otrosDatos } = req.body;

        // 1. Obtener referencia del archivo viejo
        const oldFileResult = await pool.query('SELECT url_archivo_cifrado FROM receta WHERE id_receta = ?', [id_receta]);
        const oldFileName = oldFileResult[0]?.url_archivo_cifrado;

        // 2. Proceso de Re-cifrado Centralizado
        const cryptoData = await encryptContent(contenido);
        
        const fileName = `recipe_${id_receta}_${Date.now()}.enc`;
        const vaultPath = path.join(__dirname, '../../../external_vault', fileName);
        
        await fs.writeFile(vaultPath, JSON.stringify({
            nonce: cryptoData.nonce,
            ciphertext: cryptoData.ciphertext
        }));

        // 3. Actualización Atómica en BD
        await pool.query(
            `UPDATE receta SET 
            titulo = ?, subtitulo = ?, descripcion = ?, tiempo_preparacion = ?, 
            dificultad = ?, porciones = ?, id_categoria = ?, url_archivo_cifrado = ?, hash_archivo = ?
            WHERE id_receta = ?`,
            [titulo, otrosDatos.subtitulo, otrosDatos.descripcion, otrosDatos.tiempo_preparacion, 
             otrosDatos.dificultad, otrosDatos.porciones, otrosDatos.id_categoria, fileName, cryptoData.hash, id_receta]
        );

        // Actualizamos la clave con la nueva generada por Python
        await pool.query(
            `UPDATE clave_receta SET clave_simetrica_cifrada = ? WHERE id_receta = ?`,
            [cryptoData.key, id_receta]
        );

        // 4. Limpieza del archivo anterior
        if (oldFileName) {
            await fs.remove(path.join(__dirname, '../../../external_vault', oldFileName));
        }

        res.json({ status: 'ok', message: 'Receta actualizada con nueva llave de seguridad!' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Controlador para obtener categorías de cocina
exports.getCategories = async (req, res) => {
    try {
        const categorias = await pool.query('SELECT * FROM categorias_cocina ORDER BY nombre ASC');
        res.json({ status: 'ok', data: categorias });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Controlador para eliminar una receta y su archivo físico
exports.deleteRecipe = async (req, res) => {
    try {
        const { id_receta } = req.params;

        // 1. Obtener el nombre del archivo antes de borrar el registro
        const rows = await pool.query(
            'SELECT url_archivo_cifrado FROM receta WHERE id_receta = ?', 
            [id_receta]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'La receta no existe.' });
        }

        const fileName = rows[0].url_archivo_cifrado;

        // 2. Borrar de la base de datos
        await pool.query('DELETE FROM receta WHERE id_receta = ?', [id_receta]);

        // 3. Borrar el archivo físico de external_vault
        const filePath = path.join(__dirname, '../../../external_vault', fileName);
        
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        } else {
            console.warn(`El archivo ${fileName} no se encontró en la bóveda, pero el registro fue eliminado.`);
        }

        res.json({ 
            status: 'ok', 
            message: 'Receta y archivo secreto eliminados permanentemente.' 
        });

    } catch (error) {
        console.error("ERROR AL ELIMINAR:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
};