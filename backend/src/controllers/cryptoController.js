const { spawn } = require('child_process');
const path = require('path');

// Helper para ejecutar scripts de Python
const runPython = (script, args) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../crypto_vault', script);
        const python = spawn('python', [scriptPath, ...args]);
        
        let result = "";
        let errorData = "";

        python.stdout.on('data', (d) => result += d.toString());
        python.stderr.on('data', (d) => errorData += d.toString());

        python.on('close', (code) => {
            if (code !== 0) return reject(errorData);
            resolve(result.trim());
        });
    });
};

// Desbloquear Identidad (Reconstruir Privada PEM)
exports.unlockIdentity = async (req, res) => {
    try {
        const { password, privada_cifrada, salt, nonce } = req.body;
        
        console.log("\n========== INICIANDO PROCESO DE DESBLOQUEO DE IDENTIDAD ==========");
        console.log("\nReconstruyendo Clave Privada PEM...");
        console.log("Datos de identidad cifrada recibidos:");
        console.log("   Clave Privada Cifrada:", privada_cifrada);
        console.log("   Salt (Derivación):", salt);
        console.log("   Nonce (AES-GCM):", nonce);
        console.log("   Password (Input):", password);

        const output = await runPython('keys.py', ['decrypt', password, privada_cifrada, salt, nonce, 'VERIFY_SKIP']);
        const data = JSON.parse(output);
        
        console.log("\nResultado de reconstrucción ECDSA:");
        console.log("   Estado:", data.status);
        console.log("   Private Key PEM:\n" + data.private_key);

        res.json({ status: 'ok', private_key: data.private_key });
    } catch (error) {
        console.error("\n[ERROR CRÍTICO]:", error);
        res.status(500).json({ status: 'error', message: 'Fallo al reconstruir llave privada.' });
    }
};

// Unwrap de la Llave AES (ECDH)
exports.unwrapKey = async (req, res) => {
    try {
        const { privateKey, ephemeralPublic, wrappedKey, nonce } = req.body;

        console.log("Desarrollando protocolo ECDH para recuperación de clave AES...");
        console.log("Datos para desenvolvimiento ECDH:");
        console.log("   Private Key PEM (Usuario):\n" + privateKey);
        console.log("   Ephemeral Public Key (Servidor):\n" + ephemeralPublic);
        console.log("   Wrapped AES Key:", wrappedKey);
        console.log("   Wrap Nonce:", nonce);

        const aesKey = await runPython('sharing.py', ['unwrap', privateKey, ephemeralPublic, wrappedKey, nonce]);
        
        console.log("\nResultado del protocolo ECDH:");
        console.log("   Clave Simétrica AES Recuperada (B64):", aesKey);

        res.json({ status: 'ok', aes_key: aesKey });
    } catch (error) {
        console.error("\n[ERROR CRÍTICO]:", error);
        res.status(500).json({ status: 'error', message: 'Fallo en el protocolo ECDH.' });
    }
};

// PASO C: Descifrado Final de la Receta
exports.decryptRecipe = async (req, res) => {
    try {
        const { ciphertext, nonce, aesKey, hash } = req.body;

        console.log("\nIniciando descifrado del contenido de la receta...");
        console.log("Datos para descifrado de contenido:");
        console.log("   Ciphertext:", ciphertext.substring(0, 60) + "...");
        console.log("   AES Key:", aesKey);
        console.log("   Nonce de archivo:", nonce);
        console.log("   Hash SHA3 esperado:", hash);

        const decryptedData = await runPython('cipher.py', ['decrypt', nonce, ciphertext, aesKey, hash]);
        
        console.log("\nResultado del descifrado AES-GCM:");
        console.log("   Integridad: Verificada satisfactoriamente.");
        console.log("   Contenido JSON:\n", decryptedData);

        res.json({ status: 'ok', data: JSON.parse(decryptedData) });
    } catch (error) {
        console.error("\n[ERROR CRÍTICO]:", error);
        res.status(500).json({ status: 'error', message: 'Fallo en el descifrado final del archivo.' });
    }
};