const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const pool = require('./src/config/database');
require('dotenv').config(); // IMPORTANTE: Para cargar VAULT_PUBLIC_KEY

// 1. Helper para cifrado simétrico (AES-GCM)
const encryptContent = (jsonData) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'crypto_vault/cipher.py');
        const python = spawn('python', [scriptPath, 'encrypt', JSON.stringify(jsonData)]);
        let result = "";
        let errorData = "";
        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());
        python.on('close', (code) => {
            if (code !== 0) return reject("Error en cipher.py: " + errorData);
            try { resolve(JSON.parse(result)); } catch(e) { reject("Error parseo cipher: " + result); }
        });
    });
};

// 2. Helper para envolver la clave (Hybrid Crypto - ECDH/RSA)
const wrapKey = (aesKeyB64) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'crypto_vault/sharing.py');
        const vaultPubKeyB64 = process.env.VAULT_PUBLIC_KEY;
        
        if (!vaultPubKeyB64) return reject("Error: VAULT_PUBLIC_KEY no definida en .env");

        const python = spawn('python', [scriptPath, 'wrap', vaultPubKeyB64, aesKeyB64]);
        let result = "";
        let errorData = "";
        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());
        python.on('close', (code) => {
            if (code !== 0) return reject("Error en sharing.py: " + errorData);
            try { resolve(JSON.parse(result)); } catch(e) { reject("Error parseo sharing: " + result); }
        });
    });
};

const recipesToSeed = [

];

async function seed(idChef) {
    console.log(`Cargando ${recipesToSeed.length} recetas...`);
    
    for (const recipe of recipesToSeed) {
        try {
            // PASO A: Cifrar el contenido
            const cryptoData = await encryptContent(recipe.contenido);

            // PASO B: Guardar archivo .enc
            const fileName = `recipe_seed_${Date.now()}.enc`;
            const vaultPath = path.join(__dirname, '../external_vault', fileName);
            await fs.ensureDir(path.join(__dirname, '../external_vault'));
            await fs.writeFile(vaultPath, JSON.stringify({
                nonce: cryptoData.nonce,
                ciphertext: cryptoData.ciphertext
            }));

            // PASO C: Envolver la clave (La parte que faltaba)
            const vaultWrappedKey = await wrapKey(cryptoData.key);
            
            // PASO D: Convertir el objeto envuelto a Base64 para la DB
            const dbPayloadBase64 = Buffer.from(JSON.stringify(vaultWrappedKey)).toString('base64');

            // PASO E: Insertar en DB
            const sqlReceta = `INSERT INTO receta (titulo, subtitulo, descripcion, tiempo_preparacion, dificultad, porciones, id_categoria, url_archivo_cifrado, hash_archivo, id_chef) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [recipe.titulo, recipe.subtitulo, recipe.descripcion, recipe.tiempo_preparacion, recipe.dificultad, recipe.porciones, recipe.id_categoria, fileName, cryptoData.hash, idChef];
            const result = await pool.query(sqlReceta, params);

            await pool.query(
                `INSERT INTO clave_receta (id_receta, clave_simetrica_cifrada) VALUES (?, ?)`,
                [result.insertId, dbPayloadBase64]
            );

            console.log(`✅ ${recipe.titulo} (ID: ${result.insertId})`);
        } catch (error) {
            console.error(`❌ Error en ${recipe.titulo}:`, error);
        }
    }
    console.log("Proceso terminado.");
    process.exit();
}

seed(1);