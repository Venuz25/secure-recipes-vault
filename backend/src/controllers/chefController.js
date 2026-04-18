const fs = require('fs-extra');
const pool = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// UTILS: Cifrado y Descifrado (Python)
// Función para ejecutar el script de cifrado en Python
const encryptContent = (jsonData) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');

        console.log("\nEjecutando script de cifrado...\n");
        const python = spawn('python', [scriptPath, 'encrypt', JSON.stringify(jsonData)]);
        
        let result = "";
        let errorData = "";

        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());

        python.on('close', (code) => {
            if (code !== 0) return reject("Error en Python: " + errorData);
            try { 
                resolve(JSON.parse(result)); 
            } catch(e) { 
                reject("Error al parsear JSON de Python: " + result); 
            }
        });
    });
};

// Función para ejecutar el script de descifrado en Python
const decryptContent = (nonce, ciphertext, aesKey, expectedHash) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');

        console.log("\nEjecutando script de descifrado...\n");
        const python = spawn('python', [scriptPath, 'decrypt', nonce, ciphertext, aesKey, expectedHash]);
        
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

// DASHBOARD
// Obtener datos para el dashboard del chef (perfil, recetas, suscriptores)
exports.getChefDashboard = async (req, res) => {
    const { id_chef } = req.params;
    try {
        const chef = await pool.query('SELECT * FROM chef WHERE id_chef = ?', [id_chef]);
        
        if (!chef || chef.length === 0) {
            return res.status(404).json({ status: 'error', message: `El Chef con ID ${id_chef} no existe.` });
        }

        const recetas = await pool.query(`
            SELECT r.*, c.nombre AS categoria_nombre, COUNT(f.id_favorito) as favoritos 
            FROM receta r 
            LEFT JOIN categorias_cocina c ON r.id_categoria = c.id_categoria
            LEFT JOIN favoritos f ON r.id_receta = f.id_receta 
            WHERE r.id_chef = ? 
            GROUP BY r.id_receta`, [id_chef]);

        const suscriptores = await pool.query(`
            SELECT c.id_contrato, c.estado, u.nombre, u.correo, c.fecha_fin 
            FROM contrato c 
            JOIN usuarios u ON c.id_usuario = u.id_usuario 
            WHERE c.id_chef = ? 
            ORDER BY c.fecha_fin DESC`, [id_chef]);

        res.json({ status: 'ok', data: { perfil: chef[0], recetas, suscriptores } });
    } catch (error) {
        console.error("Error en Dashboard:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// PERFIL DEL CHEF
// Actualizar perfil del chef (descripción, foto, precios, etc.)
exports.updateChefProfile = async (req, res) => {
    try {
        const { id_chef } = req.params;
        const { descripcion, foto_url, estrellas, precio_3m, precio_6m, precio_12m } = req.body;

        await pool.query(
            `UPDATE chef SET descripcion = ?, foto_url = ?, estrellas = ?, precio_3m = ?, precio_6m = ?, precio_12m = ? WHERE id_chef = ?`,
            [descripcion, foto_url, estrellas, precio_3m, precio_6m, precio_12m, id_chef]
        );

        res.json({ status: 'ok', message: 'Perfil actualizado' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Endpoint para actualizar solo los precios de suscripción
exports.updateChefPrices = async (req, res) => {
    try {
        const { id_chef } = req.params;
        const { precio_3m, precio_6m, precio_12m } = req.body;
        
        await pool.query(
            'UPDATE chef SET precio_3m = ?, precio_6m = ?, precio_12m = ? WHERE id_chef = ?',
            [precio_3m, precio_6m, precio_12m, id_chef]
        );
        res.json({ status: 'ok', message: 'Precios actualizados exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// GESTIÓN DE RECETAS
// Crear nueva receta (con cifrado y almacenamiento seguro)
exports.uploadRecipe = async (req, res) => {
  try {
    const { id_chef, titulo, subtitulo, descripcion, tiempo_preparacion, dificultad, porciones, id_categoria, contenido } = req.body;

    console.log("\n\n========== CIFRANDO NUEVA RECETA ==========");
    console.log("Cifrando receta:", titulo);
    console.log("Contenido recibido para cifrado:", contenido);
    const cryptoData = await encryptContent(contenido);

    // 2. Guardar archivo físico
    const fileName = `recipe_${Date.now()}.enc`;
    const vaultPath = path.join(__dirname, '../../../external_vault', fileName);
    await fs.ensureDir(path.join(__dirname, '../../../external_vault'));
    
    await fs.writeFile(vaultPath, JSON.stringify({
        nonce: cryptoData.nonce,
        ciphertext: cryptoData.ciphertext
    }));

    console.log("Datos criptográficos:", cryptoData);
    console.log("Archivo cifrado guardado en vault:", vaultPath);

    // 3. Registrar receta en BD
    const sql = `
      INSERT INTO receta (titulo, subtitulo, descripcion, tiempo_preparacion, dificultad, porciones, id_categoria, url_archivo_cifrado, hash_archivo, id_chef) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [titulo, subtitulo, descripcion, tiempo_preparacion, dificultad, porciones, id_categoria, fileName, cryptoData.hash, id_chef];
    const result = await pool.query(sql, params);

    // 4. Guardar la llave
    await pool.query(
      `INSERT INTO clave_receta (id_receta, clave_simetrica_cifrada) VALUES (?, ?)`,
      [result.insertId, cryptoData.key]
    );

    res.json({ status: 'ok', message: 'Receta cifrada y guardada.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtener receta descifrada para visualización o edición
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

    console.log("\n\n========== DESCIFRANDO RECETA ==========");
    console.log("Descifrando receta:", {id: id_receta, file: receta.url_archivo_cifrado});
    console.log("Contenido para cifrado:", { ciphertext });
    console.log("Datos del archivo:", {nonce, clave: receta.clave_simetrica_cifrada, hash: receta.hash_archivo});

    const decryptedData = await decryptContent(nonce, ciphertext, receta.clave_simetrica_cifrada, receta.hash_archivo);

    console.log("Datos descifrados:", decryptedData);

    res.json({ status: 'ok', data: decryptedData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("INTEGRITY_ERROR")) {
        return res.status(403).json({ status: 'error', message: "Alerta de Seguridad: El contenido de la receta no coincide con su hash oficial." });
    }
    res.status(500).json({ status: 'error', message: "No se pudo descifrar la receta." });
  }
};

// Actualizar receta (con re-cifrado y manejo de archivos)
exports.updateRecipe = async (req, res) => {
    try {
        const { id_receta } = req.params;
        const { titulo, contenido, ...otrosDatos } = req.body;

        const oldFileResult = await pool.query('SELECT url_archivo_cifrado FROM receta WHERE id_receta = ?', [id_receta]);
        const oldFileName = oldFileResult[0]?.url_archivo_cifrado;

        // 1. Re-cifrar y guardar nuevo archivo
        console.log("\n\n========== RECIFRANDO RECETA ==========");
        console.log("Recifrando receta:", {titulo, oldFileName});
        console.log("Contenido recibido para re-cifrado:", contenido);

        const cryptoData = await encryptContent(contenido);
        const fileName = `recipe_${id_receta}_${Date.now()}.enc`;
        const vaultPath = path.join(__dirname, '../../../external_vault', fileName);
        
        await fs.writeFile(vaultPath, JSON.stringify({
            nonce: cryptoData.nonce,
            ciphertext: cryptoData.ciphertext
        }));

        console.log("Datos criptográficos del recifrado:", cryptoData);
        console.log("Nuevo archivo cifrado guardado en vault:", vaultPath);

        // 2. Actualizar BD
        await pool.query(
            `UPDATE receta SET 
            titulo = ?, subtitulo = ?, descripcion = ?, tiempo_preparacion = ?, 
            dificultad = ?, porciones = ?, id_categoria = ?, url_archivo_cifrado = ?, hash_archivo = ?
            WHERE id_receta = ?`,
            [titulo, otrosDatos.subtitulo, otrosDatos.descripcion, otrosDatos.tiempo_preparacion, 
             otrosDatos.dificultad, otrosDatos.porciones, otrosDatos.id_categoria, fileName, cryptoData.hash, id_receta]
        );

        await pool.query(
            `UPDATE clave_receta SET clave_simetrica_cifrada = ? WHERE id_receta = ?`,
            [cryptoData.key, id_receta]
        );

        // 3. Limpiar archivo anterior
        if (oldFileName) {
            await fs.remove(path.join(__dirname, '../../../external_vault', oldFileName));
        }

        res.json({ status: 'ok', message: 'Receta actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Eliminar receta (con eliminación de archivos y claves)
exports.deleteRecipe = async (req, res) => {
    try {
        const { id_receta } = req.params;

        const rows = await pool.query('SELECT url_archivo_cifrado FROM receta WHERE id_receta = ?', [id_receta]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'La receta no existe.' });
        }

        const fileName = rows[0].url_archivo_cifrado;

        await pool.query('DELETE FROM receta WHERE id_receta = ?', [id_receta]);

        const filePath = path.join(__dirname, '../../../external_vault', fileName);
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }

        res.json({ status: 'ok', message: 'Receta eliminada permanentemente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// CATEGORÍAS
// Obtener categorías de cocina para asignar a las recetas
exports.getCategories = async (req, res) => {
    try {
        const categorias = await pool.query('SELECT * FROM categorias_cocina ORDER BY nombre ASC');
        res.json({ status: 'ok', data: categorias });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// GESTIÓN DE SUSCRIPCIONES (Lado del Chef)
// Cancelar suscripción de un usuario (cambiar estado a "cancelado")
exports.cancelSubscription = async (req, res) => {
    try {
        const { id_contrato } = req.params;
        await pool.query('UPDATE contrato SET estado = "cancelado" WHERE id_contrato = ?', [id_contrato]);
        res.json({ status: 'ok', message: 'Suscripción cancelada' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Reactivar suscripción de un usuario (cambiar estado a "activo")
exports.reactivateSubscription = async (req, res) => {
    try {
        const { id_contrato } = req.params;
        await pool.query(
            'UPDATE contrato SET estado = "activo" WHERE id_contrato = ? AND estado = "cancelado"', 
            [id_contrato]
        );
        res.json({ status: 'ok', message: 'Suscripción reactivada' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Eliminar suscripción de un usuario (borrar registro de contrato)
exports.deleteSubscription = async (req, res) => {
    try {
        const { id_contrato } = req.params;
        await pool.query('DELETE FROM contrato WHERE id_contrato = ?', [id_contrato]);
        res.json({ status: 'ok', message: 'Registro de suscripción eliminado' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};