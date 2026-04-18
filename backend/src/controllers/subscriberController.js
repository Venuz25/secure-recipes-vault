const pool = require('../config/database');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

// UTILS: Criptografía
// Descifrado de la receta usando Python
const decryptRecipeProcess = (nonce, ciphertext, aesKey, hash) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault/cipher.py');
        const python = spawn('python', [scriptPath, 'decrypt', nonce, ciphertext, aesKey, hash]);
        
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

// EXPLORACIÓN Y DESCUBRIMIENTO
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

// Obtener perfil público detallado de un chef para el suscriptor
exports.getPublicChefProfile = async (req, res) => {
    try {
        const { id_chef } = req.params;
        const chefResult = await pool.query('SELECT * FROM chef WHERE id_chef = ?', [id_chef]);
        
        if (!chefResult || chefResult.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Chef no encontrado en la base de datos' });
        }

        const chef = chefResult[0];
        const recetasResult = await pool.query('SELECT COUNT(*) as total FROM receta WHERE id_chef = ?', [id_chef]);
        const total_recetas = recetasResult && recetasResult.length > 0 ? recetasResult[0].total : 0;

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

// BÓVEDA Y BIBLIOTECA PERSONAL
// Obtener Suscripciones Activas y Favoritos
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

// Función para obtener la privada PEM
const getSubscriberPrivateKey = (password, userRow) => {
    return new Promise((resolve) => {
        const python = spawn('python', [
            path.join(__dirname, '../../crypto_vault/keys.py'),
            'decrypt', password, userRow.clave_privada_cifrada, userRow.crypto_salt, userRow.crypto_nonce, userRow.contraseña_hash
        ]);
        let result = "";
        python.stdout.on('data', (d) => result += d.toString());
        python.on('close', () => {
            try { resolve(JSON.parse(result)); } catch { resolve({status: 'error'}); }
        });
    });
};

// Función para desenvolver la AES Key (ECDH)
const unwrapRecipeKey = (privatePem, ephPub, wrappedKey, nonce) => {
    return new Promise((resolve) => {
        const python = spawn('python', [
            path.join(__dirname, '../../crypto_vault/sharing.py'),
            'unwrap', privatePem, ephPub, wrappedKey, nonce
        ]);
        let result = "";
        python.stdout.on('data', (d) => result += d.toString());
        python.on('close', () => resolve(result.trim()));
    });
};

exports.getRecipeContent = async (req, res) => {
    try {
        const { id_usuario, id_receta, password } = req.body;

        // 1. VALIDACIÓN DE PERMISOS Y METADATOS
        const recipeRows = await pool.query(
            'SELECT id_chef, url_archivo_cifrado, hash_archivo FROM receta WHERE id_receta = ?', 
            [id_receta]
        );
        
        if (!recipeRows || recipeRows.length === 0) return res.status(404).json({ status: 'error', message: 'Receta no encontrada.' });
        
        const { id_chef, url_archivo_cifrado, hash_archivo } = recipeRows[0];

        const contratoRows = await pool.query(
            `SELECT id_contrato FROM contrato 
             WHERE id_usuario = ? AND id_chef = ? 
             AND estado = 'activo' 
             AND fecha_fin >= DATE('now')`, 
            [id_usuario, id_chef]
        );

        if (!contratoRows || contratoRows.length === 0) {
            return res.status(403).json({ status: 'expired', message: 'Acceso denegado: Suscripción inactiva.' });
        }

        console.log("\n========== INICIANDO PROTOCOLO DE TRANSFERENCIA SEGURA (ECDH) ==========");
        console.log("Solicitante ID:", id_usuario);
        console.log("Receta ID:", id_receta);

        // 2. RECUPERACIÓN DE IDENTIDAD CIFRADA
        console.log("\nRecuperando Identidad Cifrada del Suscriptor para exportación...");
        const userRows = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        const user = userRows[0];

        console.log("   Clave Privada (ECDSA cifrada):", user.clave_privada_cifrada);
        console.log("   Salt (PBKDF2):", user.crypto_salt);
        console.log("   Nonce (AES-GCM):", user.crypto_nonce);

        // 3. RECUPERACIÓN DE CLAVE SIMÉTRICA DE LA RECETA
        console.log("\nAccediendo a la Clave Simétrica de la Receta...");
        const keyRows = await pool.query(
            'SELECT clave_simetrica_cifrada FROM clave_receta WHERE id_receta = ?', 
            [id_receta]
        );
        const recipeAesKey = keyRows[0].clave_simetrica_cifrada;
        console.log("   Clave AES de Receta (B64):", recipeAesKey);

        // 4. PROTOCOLO DE ENVOLTURA (KEY WRAPPING)
        console.log("\nEjecutando ECDH para protección en tránsito...");
        const pythonWrap = spawn('python', [path.join(__dirname, '../../crypto_vault/sharing.py'), 'wrap', user.clave_publica, recipeAesKey]);
        let wrapRes = "";
        await new Promise(r => { pythonWrap.stdout.on('data', d => wrapRes += d); pythonWrap.on('close', r); });
        const wrappedPackage = JSON.parse(wrapRes);

        console.log("Paquete de Clave Envuelta generado:");
        console.log("   Clave Pública Efémera:", wrappedPackage.ephemeral_public_key);
        console.log("   Clave AES Cifrada (Wrapped):", wrappedPackage.wrapped_key);
        console.log("   Nonce de Envoltura:", wrappedPackage.nonce);

        // 5. OBTENCIÓN DE CONTENIDO CIFRADO (BLOB)
        console.log("\nRecuperando contenido cifrado de external_vault...");
        const vaultPath = path.join(__dirname, '../../../external_vault', url_archivo_cifrado);
        const fileContent = await fs.readJson(vaultPath);
        console.log("Contenido cifrado recuperado de", vaultPath);
        console.log("   Contenido cifrado :", fileContent.ciphertext);
        console.log("   Nonce del archivo:", fileContent.nonce);
        console.log("   Hash del archivo:", hash_archivo);

        console.log("\nEnviando datos al cliente...");

        res.json({ 
            status: 'ok', 
            crypto_payload: {
                // Componentes para reconstruir la llave privada
                user_identity: {
                    privada_cifrada: user.clave_privada_cifrada,
                    salt: user.crypto_salt,
                    nonce: user.crypto_nonce
                },
                // Componentes de la llave AES envuelta
                key_wrap: {
                    wrapped_key: wrappedPackage.wrapped_key,
                    ephemeral_public: wrappedPackage.ephemeral_public_key,
                    nonce: wrappedPackage.nonce
                },
                // Componentes del archivo de receta
                recipe_data: {
                    ciphertext: fileContent.ciphertext,
                    nonce: fileContent.nonce,
                    hash: hash_archivo
                }
            }
        });

    } catch (error) {
        console.error("\nERROR CRÍTICO EN EL PROTOCOLO DE TRANSFERENCIA:", error);
        res.status(500).json({ status: 'error', message: 'Fallo interno en el despacho de la bóveda.' });
    }
};

// Agregar/Quitar recetas de favoritos
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

// SUSCRIPCIONES Y PAGOS
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

// Cancelar suscripción desde el lado del usuario
exports.cancelUserSubscription = async (req, res) => {
    try {
        const { id_contrato } = req.params;
        
        await pool.query('UPDATE contrato SET estado = "cancelado" WHERE id_contrato = ?', [id_contrato]);
        
        res.json({ status: 'ok', message: 'Suscripción cancelada exitosamente. Se ha revocado el acceso a la bóveda.' });
    } catch (error) {
        console.error("Error al cancelar suscripción:", error);
        res.status(500).json({ status: 'error', message: "Error interno del servidor al cancelar." });
    }
};

// PERFIL DEL SUSCRIPTOR
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