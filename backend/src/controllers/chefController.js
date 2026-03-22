const fs = require('fs-extra');
const pool = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Función para llamar al cifrador de Python
const encryptContent = (jsonData, aesKey) => {
    return new Promise((resolve, reject) => {
        const python = spawn('python', [
            path.join(__dirname, '../../crypto_vault/cipher.py'),
            JSON.stringify(jsonData),
            aesKey
        ]);
        let result = "";
        python.stdout.on('data', (d) => result += d.toString());
        python.on('close', () => {
            try { resolve(JSON.parse(result)); }
            catch(e) { reject("Error en cifrado Python: " + result); }
        });
    });
};

// Controlador para obtener estadísticas y datos del dashboard del Chef
exports.getChefDashboard = async (req, res) => {
    const { id_chef } = req.params;
    try {
        // Datos del Chef
        const chef = await pool.query('SELECT nombre, descripcion, foto_url, estrellas FROM chef WHERE id_chef = ?', [id_chef]);
        
        // Recetas con conteo de favoritos
        const recetas = await pool.query(`
            SELECT r.*, COUNT(f.id_favorito) as favoritos 
            FROM receta r 
            LEFT JOIN favoritos f ON r.id_receta = f.id_receta 
            WHERE r.id_chef = ? 
            GROUP BY r.id_receta`, [id_chef]);

        // Suscriptores activos
        const suscriptores = await pool.query(`
            SELECT u.nombre, u.correo, c.fecha_fin, c.periodo_meses 
            FROM contrato c 
            JOIN usuarios u ON c.id_usuario = u.id_usuario 
            WHERE c.id_chef = ? AND c.estado = 'activo'`, [id_chef]);

        res.json({ status: 'ok', data: { perfil: chef[0], recetas, suscriptores } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Controlador para subir una nueva receta (Cifrado + Upload)
exports.uploadRecipe = async (req, res) => {
    try {
        const { id_chef, titulo, subtitulo, dificultad, porciones, categoria, tiempo_preparacion, contenido } = req.body;
        
        const aesKey = crypto.randomBytes(16).toString('hex');
        const encryptedData = await encryptContent(contenido, aesKey);
        
        const fileName = `recipe_${Date.now()}.enc`;
        const vaultPath = path.join(__dirname, '../../../external_vault', fileName);
        
        await fs.ensureDir(path.join(__dirname, '../../../external_vault'));
        await fs.writeFile(vaultPath, encryptedData.ciphertext);

        const hash = crypto.createHash('sha256').update(encryptedData.ciphertext).digest('hex');

        await pool.query(
            `INSERT INTO receta 
            (titulo, subtitulo, dificultad, porciones, categoria, tiempo_preparacion, url_archivo_cifrado, hash_archivo, id_chef) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titulo, subtitulo, dificultad, porciones, categoria, tiempo_preparacion, fileName, hash, id_chef]
        );

        res.json({ status: 'ok', message: 'Receta publicada con tiempo de preparación.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

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