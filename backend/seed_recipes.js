const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const pool = require('./src/config/database');
require('dotenv').config();

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

const recipesToSeed =
[
{
    titulo: "Ratatouille Provenzal",
    subtitulo: "Vegetales franceses llenos de aroma",
    descripcion: "El clásico platillo provenzal popularizado por Julia Child preparado con vegetales frescos y hierbas aromáticas.",
    tiempo_preparacion: "90 min",
    dificultad: "Media",
    porciones: 6,
    id_categoria: 5,
    contenido: {
        ingredientes: [
            { nombre: "grms de berenjena", cantidad: "500" },
            { nombre: "grms de calabaza", cantidad: "400" },
            { nombre: "grms de jitomate", cantidad: "700" },
            { nombre: "grms de pimiento rojo", cantidad: "250" },
            { nombre: "grms de cebolla", cantidad: "250" },
            { nombre: "ml de aceite de oliva", cantidad: "120" },
            { nombre: "dientes de ajo", cantidad: "5" }
        ],
        pasos: [
            "Lava perfectamente todos los vegetales y córtalos en rodajas o cubos medianos procurando mantener tamaños similares para lograr una cocción uniforme.",
            
            "Espolvorea sal sobre la berenjena y deja reposar durante 20 minutos para eliminar el exceso de humedad y reducir cualquier sabor amargo. Después enjuaga y seca cuidadosamente.",
            
            "Calienta aceite de oliva en una sartén amplia y sofríe cebolla y ajo hasta que desprendan aroma y comiencen a dorarse ligeramente.",
            
            "Agrega pimientos, berenjena y calabaza cocinando cada vegetal por separado para conservar mejor sus sabores y texturas naturales.",
            
            "Integra jitomate fresco triturado y hierbas provenzales. Cocina lentamente a fuego bajo durante aproximadamente 40 minutos removiendo ocasionalmente.",
            
            "Sirve caliente o a temperatura ambiente acompañado de pan francés, carne asada o pasta fresca."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
            "https://upload.wikimedia.org/wikipedia/commons/7/74/Ratatouille_2.jpg",
            "https://images.unsplash.com/photo-1547592180-85f173990554",
            "https://cdn7.kiwilimon.com/recetaimagen/36744/640x640/46030.jpg.jpg"
        ]
    }
},
{
    titulo: "Soufflé de Queso",
    subtitulo: "Ligero, elegante y clásico",
    descripcion: "Soufflé francés esponjoso elaborado con queso gruyere y técnica tradicional francesa.",
    tiempo_preparacion: "70 min",
    dificultad: "Alta",
    porciones: 4,
    id_categoria: 5,
    contenido: {
        ingredientes: [
            { nombre: "grms de queso gruyere rallado", cantidad: "250" },
            { nombre: "ml de leche", cantidad: "500" },
            { nombre: "grms de mantequilla", cantidad: "90" },
            { nombre: "grms de harina", cantidad: "70" },
            { nombre: "piezas de huevo", cantidad: "6" },
            { nombre: "grms de queso parmesano", cantidad: "40" }
        ],
        pasos: [
            "Derrite la mantequilla en una olla y agrega harina removiendo constantemente hasta formar una mezcla homogénea ligeramente dorada.",
            
            "Añade leche caliente poco a poco mientras mezclas vigorosamente para evitar grumos y obtener una salsa espesa y suave.",
            
            "Separa las claras de las yemas. Incorpora las yemas una por una a la salsa caliente junto con queso gruyere rallado.",
            
            "Bate las claras a punto de nieve hasta obtener picos firmes y brillantes. Este paso es fundamental para lograr la textura esponjosa característica del soufflé.",
            
            "Integra las claras cuidadosamente utilizando movimientos envolventes para conservar la mayor cantidad de aire posible.",
            
            "Vierte la mezcla en moldes previamente engrasados y espolvoreados con queso parmesano.",
            
            "Hornea sin abrir el horno durante aproximadamente 30 minutos hasta que el soufflé suba y tenga una superficie dorada."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f",
            "https://upload.wikimedia.org/wikipedia/commons/3/36/Cheese_souffle.jpg",
            "https://images.unsplash.com/photo-1601315488950-3b5047998b38",
            "https://cdn7.kiwilimon.com/recetaimagen/36682/640x640/45940.jpg.jpg"
        ]
    }
},
{
    titulo: "Moules Marinières",
    subtitulo: "Mejillones franceses al vino blanco",
    descripcion: "Mejillones cocinados con vino blanco, mantequilla, ajo y perejil fresco.",
    tiempo_preparacion: "40 min",
    dificultad: "Media",
    porciones: 4,
    id_categoria: 10,
    contenido: {
        ingredientes: [
            { nombre: "grms de mejillones frescos", cantidad: "1800" },
            { nombre: "ml de vino blanco", cantidad: "350" },
            { nombre: "grms de mantequilla", cantidad: "100" },
            { nombre: "grms de cebolla", cantidad: "150" },
            { nombre: "dientes de ajo", cantidad: "4" },
            { nombre: "grms de perejil fresco", cantidad: "40" }
        ],
        pasos: [
            "Limpia cuidadosamente los mejillones retirando cualquier impureza o barba adherida a las conchas. Desecha los mejillones que permanezcan abiertos antes de cocinar.",
            
            "Derrite mantequilla en una olla grande y sofríe cebolla y ajo finamente picados hasta obtener una textura suave y aromática.",
            
            "Agrega vino blanco y deja hervir durante algunos minutos para evaporar ligeramente el alcohol y concentrar los sabores.",
            
            "Incorpora los mejillones y tapa inmediatamente la olla permitiendo que el vapor abra las conchas durante aproximadamente 6 minutos.",
            
            "Agita ocasionalmente la olla para distribuir el calor y asegurar una cocción uniforme de todos los mejillones.",
            
            "Añade perejil fresco picado antes de servir acompañado de pan francés crujiente."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
            "https://upload.wikimedia.org/wikipedia/commons/4/41/Moules_frites.jpg",
            "https://images.unsplash.com/photo-1559847844-d721426d6edc",
            "https://cdn7.kiwilimon.com/recetaimagen/36733/640x640/46016.jpg.jpg"
        ]
    }
},
{
    titulo: "Tarte Tatin",
    subtitulo: "El famoso pastel francés invertido",
    descripcion: "Tarta caramelizada de manzana preparada al estilo clásico francés.",
    tiempo_preparacion: "80 min",
    dificultad: "Media",
    porciones: 8,
    id_categoria: 9,
    contenido: {
        ingredientes: [
            { nombre: "grms de manzana", cantidad: "1200" },
            { nombre: "grms de azúcar", cantidad: "250" },
            { nombre: "grms de mantequilla", cantidad: "120" },
            { nombre: "grms de harina", cantidad: "350" },
            { nombre: "ml de agua fría", cantidad: "120" },
            { nombre: "grms de sal", cantidad: "5" }
        ],
        pasos: [
            "Prepara la masa mezclando harina, mantequilla fría y agua hasta formar una textura uniforme. Refrigera durante al menos 30 minutos.",
            
            "Pela las manzanas y córtalas en mitades retirando cuidadosamente el corazón y las semillas.",
            
            "En un sartén apto para horno derrite azúcar junto con mantequilla hasta obtener un caramelo dorado y brillante.",
            
            "Coloca las manzanas sobre el caramelo acomodándolas firmemente para evitar espacios vacíos.",
            
            "Cocina las manzanas a fuego medio durante varios minutos hasta que comiencen a suavizarse y absorber el caramelo.",
            
            "Extiende la masa y cubre completamente las manzanas introduciendo los bordes hacia dentro del sartén.",
            
            "Hornea hasta que la masa esté dorada y crujiente. Deja reposar algunos minutos antes de voltear cuidadosamente."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1519915028121-7d3463d20b13",
            "https://upload.wikimedia.org/wikipedia/commons/7/74/Tarte_Tatin.jpg",
            "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2",
            "https://cdn7.kiwilimon.com/recetaimagen/30291/640x640/39300.jpg.jpg"
        ]
    }
},
{
    titulo: "Vichyssoise",
    subtitulo: "La elegante sopa fría francesa",
    descripcion: "Sopa cremosa de papa y poro servida fría al estilo clásico francés.",
    tiempo_preparacion: "60 min",
    dificultad: "Media",
    porciones: 6,
    id_categoria: 5,
    contenido: {
        ingredientes: [
            { nombre: "grms de poro", cantidad: "500" },
            { nombre: "grms de papa", cantidad: "700" },
            { nombre: "ml de caldo de pollo", cantidad: "1500" },
            { nombre: "ml de crema para batir", cantidad: "300" },
            { nombre: "grms de mantequilla", cantidad: "70" },
            { nombre: "grms de cebollín", cantidad: "30" }
        ],
        pasos: [
            "Lava perfectamente el poro retirando cualquier resto de tierra entre las capas y córtalo en rodajas delgadas.",
            
            "Derrite mantequilla en una olla grande y sofríe el poro lentamente hasta que esté suave y ligeramente transparente sin llegar a dorarse.",
            
            "Agrega papa cortada en cubos medianos y mezcla cuidadosamente para impregnarla con la mantequilla y el aroma del poro.",
            
            "Incorpora caldo de pollo caliente y cocina a fuego medio hasta que las papas estén completamente suaves.",
            
            "Licúa la sopa hasta obtener una textura completamente cremosa y uniforme sin grumos visibles.",
            
            "Añade crema para batir y deja enfriar completamente antes de refrigerar durante varias horas.",
            
            "Sirve fría decorando con cebollín finamente picado."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1547592180-85f173990554",
            "https://upload.wikimedia.org/wikipedia/commons/6/64/Vichyssoise.jpg",
            "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d",
            "https://cdn7.kiwilimon.com/recetaimagen/36790/640x640/46080.jpg.jpg"
        ]
    }
}
]
;

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

seed(2);