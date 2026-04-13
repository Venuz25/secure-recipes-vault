const pool = require('../config/database');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

// Descifrado de la receta
const decryptRecipeProcess = (nonce, ciphertext, aesKey) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');
        const python = spawn('python', [scriptPath, 'decrypt', nonce, ciphertext, aesKey]);
        
        python.stdout.setEncoding('utf8');
        let result = "";
        let errorData = "";

        python.stdout.on('data', (d) => result += d);
        python.stderr.on('data', (d) => errorData += d.toString());

        python.on('close', (code) => {
            if (code !== 0) return reject(errorData);
            resolve(result.trim());
        });
    });
};

// Buscador de recetas con filtros avanzados
exports.exploreRecipes = async (req, res) => {
    try {
        const { search, categoria, dificultad, tiempo, orden } = req.query;
        
        let sql = `
            SELECT r.*, ch.nombre as nombre_chef, cat.nombre as nombre_categoria,
            (SELECT COUNT(*) FROM favoritos f WHERE f.id_receta = r.id_receta) as valoracion
            FROM receta r
            JOIN chef ch ON r.id_chef = ch.id_chef
            JOIN categorias_cocina cat ON r.id_categoria = cat.id_categoria
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (r.titulo LIKE ? OR ch.nombre LIKE ? OR r.descripcion LIKE ?)`;
            const p = `%${search}%`;
            params.push(p, p, p);
        }
        if (categoria) {
            sql += ` AND r.id_categoria = ?`;
            params.push(categoria);
        }
        if (dificultad) {
            sql += ` AND r.dificultad = ?`;
            params.push(dificultad);
        }
        if (tiempo) {
            sql += ` AND CAST(r.tiempo_preparacion AS INTEGER) <= ?`;
            params.push(tiempo);
        }

        sql += (orden === 'valoracion') ? ` ORDER BY valoracion DESC` : ` ORDER BY r.fecha_creacion DESC`;

        const recipes = await pool.query(sql, params);
        res.json({ status: 'ok', data: recipes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Simulación de pasarela de pago y creación de contrato
exports.subscribe = async (req, res) => {
    try {
        const { id_usuario, id_chef, periodo_meses, costo, datos_pago } = req.body;

        // Simulación de pasarela de pago
        if (!datos_pago || datos_pago.numero_tarjeta.length < 16) {
            return res.status(400).json({ status: 'error', message: 'Pago rechazado: Datos de tarjeta inválidos.' });
        }

        const fecha_inicio = new Date();
        const fecha_fin = new Date();
        fecha_fin.setMonth(fecha_fin.getMonth() + parseInt(periodo_meses));

        await pool.query(
            `INSERT INTO contrato (id_usuario, id_chef, periodo_meses, costo, fecha_inicio, fecha_fin, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
            [id_usuario, id_chef, periodo_meses, costo, 
             fecha_inicio.toISOString().split('T')[0], 
             fecha_fin.toISOString().split('T')[0]]
        );

        res.json({ status: 'ok', message: `Suscripción de ${periodo_meses} meses activada correctamente.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 3. BIBLIOTECA DEL USUARIO (Suscripciones y Libro de Cocina)
exports.getLibrary = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Suscripciones vigentes y fecha de vencimiento
        const subscriptions = await pool.query(
            `SELECT c.*, ch.nombre as nombre_chef, ch.foto_url 
             FROM contrato c
             JOIN chef ch ON c.id_chef = ch.id_chef
             WHERE c.id_usuario = ? AND c.estado = 'activo'`,
            [id_usuario]
        );

        // Favoritos (Libro de cocina)
        const favorites = await pool.query(
            `SELECT r.*, ch.nombre as nombre_chef 
             FROM favoritos f
             JOIN receta r ON f.id_receta = r.id_receta
             JOIN chef ch ON r.id_chef = ch.id_chef
             WHERE f.id_usuario = ?`,
            [id_usuario]
        );

        res.json({ status: 'ok', data: { subscriptions, favorites } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Acceso seguro al contenido de la receta (Ver/Editar)
exports.getRecipeContent = async (req, res) => {
    try {
        const { id_usuario, id_receta } = req.body;

        // A. Identificar al dueño de la receta
        const recipe = await pool.query('SELECT id_chef, url_archivo_cifrado FROM receta WHERE id_receta = ?', [id_receta]);
        if (!recipe.length) return res.status(404).json({ message: 'Receta no encontrada.' });
        
        const { id_chef, url_archivo_cifrado } = recipe[0];

        // B. Verificar suscripción activa y NO caducada
        const contrato = await pool.query(
            `SELECT * FROM contrato 
             WHERE id_usuario = ? AND id_chef = ? 
             AND estado = 'activo' 
             AND fecha_fin >= DATE('now')`, 
            [id_usuario, id_chef]
        );

        if (!contrato.length) {
            return res.status(403).json({ 
                status: 'expired', 
                message: 'Acceso denegado. Tu suscripción a este Chef ha expirado o no existe.' 
            });
        }

        // C. Recuperar llaves y archivo para descifrado
        const keyRow = await pool.query(
            'SELECT clave_simetrica_cifrada FROM clave_receta WHERE id_receta = ? LIMIT 1', 
            [id_receta]
        );
        
        const vaultPath = path.join(__dirname, '../../../external_vault', url_archivo_cifrado);
        if (!await fs.pathExists(vaultPath)) {
            return res.status(404).json({ message: 'El archivo cifrado no se encuentra en la bóveda.' });
        }

        const fileContent = await fs.readJson(vaultPath);
        const aesKey = keyRow[0].clave_simetrica_cifrada;

        // D. Ejecutar descifrado híbrido
        const decryptedData = await decryptRecipeProcess(fileContent.nonce, fileContent.ciphertext, aesKey);
        
        res.json({ status: 'ok', data: JSON.parse(decryptedData) });

    } catch (error) {
        console.error("Error de acceso:", error);
        res.status(500).json({ status: 'error', message: 'Error al procesar el acceso seguro.' });
    }
};

// Favoritos (Agregar/Quitar del libro de cocina)
exports.toggleFavorite = async (req, res) => {
    try {
        const { id_usuario, id_receta } = req.body;
        const exists = await pool.query('SELECT 1 FROM favoritos WHERE id_usuario = ? AND id_receta = ?', [id_usuario, id_receta]);

        if (exists.length) {
            await pool.query('DELETE FROM favoritos WHERE id_usuario = ? AND id_receta = ?', [id_usuario, id_receta]);
            res.json({ status: 'ok', action: 'removed' });
        } else {
            await pool.query('INSERT INTO favoritos (id_usuario, id_receta) VALUES (?, ?)', [id_usuario, id_receta]);
            res.json({ status: 'ok', action: 'added' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Editar perfil del usuario (nombre, descripción, foto)
exports.updateProfile = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { nombre, descripcion, foto_url } = req.body;

        if (!nombre) {
            return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio.' });
        }

        await pool.query(
            `UPDATE usuarios SET nombre = ?, descripcion = ?, foto_url = ? WHERE id_usuario = ?`,
            [nombre, descripcion, foto_url, id_usuario]
        );

        res.json({ status: 'ok', message: 'Perfil actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener perfil público detallado de un chef para el suscriptor
exports.getPublicChefProfile = async (req, res) => {
    try {
        const { id_chef } = req.params;

        // 1. Obtenemos al chef
        const chefResult = await pool.query('SELECT * FROM chef WHERE id_chef = ?', [id_chef]);
        
        if (!chefResult || chefResult.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Chef no encontrado en la base de datos' });
        }

        const chef = chefResult[0];

        // 2. Contamos sus recetas totales
        const recetasResult = await pool.query('SELECT COUNT(*) as total FROM receta WHERE id_chef = ?', [id_chef]);
        const total_recetas = recetasResult && recetasResult.length > 0 ? recetasResult[0].total : 0;

        // 3. Contamos el total de favoritos
        const favoritosResult = await pool.query(`
            SELECT COUNT(f.id_favorito) as total 
            FROM favoritos f 
            JOIN receta r ON f.id_receta = r.id_receta 
            WHERE r.id_chef = ?`, [id_chef]);
        const total_favoritos = favoritosResult && favoritosResult.length > 0 ? favoritosResult[0].total : 0;

        res.json({ 
            status: 'ok', 
            data: { 
                ...chef, 
                total_recetas, 
                total_favoritos 
            } 
        });
    } catch (error) {
        console.error("==== ERROR AL CARGAR PERFIL DE CHEF ====");
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};