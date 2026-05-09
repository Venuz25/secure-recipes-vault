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
{
    titulo: "Enchiladas Verdes de Pollo",
    subtitulo: "Salsa casera llena de sabor",
    descripcion: "Enchiladas suaves bañadas en salsa verde cremosa y acompañadas con pollo deshebrado.",
    tiempo_preparacion: "60 min",
    dificultad: "Media",
    porciones: 5,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de pechuga de pollo cocida", cantidad: "700" },
            { nombre: "piezas de tortilla de maíz", cantidad: "15" },
            { nombre: "grms de tomate verde", cantidad: "800" },
            { nombre: "piezas de chile serrano", cantidad: "4" },
            { nombre: "ml de crema", cantidad: "250" },
            { nombre: "grms de queso fresco", cantidad: "200" },
            { nombre: "ml de aceite vegetal", cantidad: "300" }
        ],
        pasos: [
            "Hierve los tomates verdes junto con los chiles serranos en suficiente agua durante aproximadamente 15 minutos hasta que cambien ligeramente de color y estén suaves al tacto.",
            
            "Licúa los tomates, chiles, ajo, cebolla y un poco del agua de cocción hasta obtener una salsa homogénea y ligeramente espesa. Cocina la salsa en una olla con un poco de aceite durante varios minutos para intensificar el sabor.",
            
            "Deshebra cuidadosamente la pechuga de pollo cocida utilizando dos tenedores y reserva caliente para el relleno de las enchiladas.",
            
            "Calienta las tortillas en aceite caliente durante algunos segundos por lado para suavizarlas sin que se vuelvan crujientes. Escúrrelas sobre papel absorbente.",
            
            "Rellena cada tortilla con pollo deshebrado y dóblalas cuidadosamente. Colócalas en un plato amplio y báñalas generosamente con salsa verde caliente.",
            
            "Agrega crema, queso fresco desmoronado y cebolla picada encima antes de servir inmediatamente."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c",
            "https://cdn7.kiwilimon.com/recetaimagen/30449/640x640/39466.jpg.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/2/21/Enchiladas_Verdes.jpg",
            "https://images.unsplash.com/photo-1600891964092-4316c288032e"
        ]
    }
},
{
    titulo: "Risotto de Champiñones",
    subtitulo: "Cremosidad italiana perfecta",
    descripcion: "Risotto suave preparado con arroz arborio, champiñones frescos y queso parmesano.",
    tiempo_preparacion: "50 min",
    dificultad: "Alta",
    porciones: 4,
    id_categoria: 2,
    contenido: {
        ingredientes: [
            { nombre: "grms de arroz arborio", cantidad: "400" },
            { nombre: "grms de champiñones frescos", cantidad: "350" },
            { nombre: "ml de caldo de verduras", cantidad: "1200" },
            { nombre: "grms de queso parmesano", cantidad: "120" },
            { nombre: "grms de mantequilla", cantidad: "80" },
            { nombre: "ml de vino blanco", cantidad: "150" }
        ],
        pasos: [
            "Limpia cuidadosamente los champiñones utilizando un paño húmedo y córtalos en láminas delgadas para facilitar una cocción uniforme.",
            
            "Derrite parte de la mantequilla en un sartén amplio y sofríe cebolla picada hasta que esté transparente. Agrega los champiñones y cocina hasta que reduzcan su tamaño y suelten su aroma.",
            
            "Incorpora el arroz arborio y mezcla constantemente durante varios minutos para sellar ligeramente los granos y potenciar el sabor del risotto.",
            
            "Añade el vino blanco y cocina hasta que el líquido se evapore casi por completo. Después agrega el caldo caliente poco a poco mientras remueves constantemente.",
            
            "Continúa agregando caldo gradualmente permitiendo que el arroz absorba el líquido antes de añadir más. Este proceso tarda aproximadamente 25 minutos.",
            
            "Integra mantequilla y queso parmesano rallado al final para lograr una textura cremosa y brillante. Sirve inmediatamente."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1633964913295-ceb43826e7c1",
            "https://upload.wikimedia.org/wikipedia/commons/3/39/Risotto_ai_funghi.jpg",
            "https://cdn7.kiwilimon.com/recetaimagen/30185/640x640/39141.jpg.jpg",
            "https://images.unsplash.com/photo-1547592180-85f173990554"
        ]
    }
},
{
    titulo: "Tempura de Vegetales",
    subtitulo: "Crujiente estilo japonés",
    descripcion: "Vegetales frescos cubiertos con una ligera y crujiente masa tempura.",
    tiempo_preparacion: "40 min",
    dificultad: "Media",
    porciones: 4,
    id_categoria: 3,
    contenido: {
        ingredientes: [
            { nombre: "grms de zanahoria", cantidad: "200" },
            { nombre: "grms de calabaza", cantidad: "250" },
            { nombre: "grms de brócoli", cantidad: "200" },
            { nombre: "grms de harina tempura", cantidad: "300" },
            { nombre: "ml de agua mineral fría", cantidad: "450" },
            { nombre: "ml de aceite vegetal", cantidad: "1000" }
        ],
        pasos: [
            "Lava perfectamente todos los vegetales y córtalos en bastones o piezas medianas para facilitar una cocción uniforme y mantener una textura agradable.",
            
            "Prepara la mezcla tempura combinando harina especial con agua mineral muy fría. Mezcla suavemente para evitar desarrollar demasiado gluten y mantener una textura ligera.",
            
            "Calienta abundante aceite en una olla profunda hasta alcanzar temperatura alta. Es importante mantener el aceite caliente para lograr un acabado crujiente.",
            
            "Sumerge los vegetales en la mezcla tempura cubriendo completamente cada pieza y colócalos inmediatamente en el aceite caliente.",
            
            "Fríe los vegetales durante algunos minutos hasta obtener un color dorado claro y una textura crujiente. Retira y coloca sobre papel absorbente.",
            
            "Sirve acompañados de salsa de soya, salsa tentsuyu o limón fresco."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1604908176997-431221e2b47d",
            "https://upload.wikimedia.org/wikipedia/commons/a/ac/Tempura_udon.jpg",
            "https://cdn7.kiwilimon.com/recetaimagen/30473/640x640/39492.jpg.jpg",
            "https://images.unsplash.com/photo-1562967916-eb82221dfb92"
        ]
    }
},
{
    titulo: "Cerdo Agridulce",
    subtitulo: "Clásico sabor oriental",
    descripcion: "Trozos de cerdo crujiente mezclados con salsa agridulce y vegetales.",
    tiempo_preparacion: "70 min",
    dificultad: "Media",
    porciones: 5,
    id_categoria: 4,
    contenido: {
        ingredientes: [
            { nombre: "grms de lomo de cerdo", cantidad: "800" },
            { nombre: "grms de fécula de maíz", cantidad: "150" },
            { nombre: "grms de pimiento verde", cantidad: "150" },
            { nombre: "grms de cebolla", cantidad: "120" },
            { nombre: "ml de salsa de tomate", cantidad: "180" },
            { nombre: "ml de vinagre de arroz", cantidad: "90" },
            { nombre: "grms de azúcar", cantidad: "70" }
        ],
        pasos: [
            "Corta el lomo de cerdo en cubos medianos y sazónalos con sal y pimienta. Cubre cada pieza con fécula de maíz para crear una capa crujiente.",
            
            "Fríe los cubos de cerdo en aceite caliente hasta que estén completamente dorados y cocidos por dentro. Escurre el exceso de aceite.",
            
            "En otro sartén saltea cebolla y pimientos hasta que estén ligeramente suaves pero mantengan algo de firmeza.",
            
            "Prepara la salsa mezclando salsa de tomate, vinagre, azúcar y salsa de soya. Cocina la mezcla hasta que espese ligeramente.",
            
            "Agrega el cerdo frito a la salsa y mezcla cuidadosamente para cubrir cada pieza de manera uniforme.",
            
            "Sirve caliente acompañado de arroz blanco o noodles."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1525755662778-989d0524087e",
            "https://upload.wikimedia.org/wikipedia/commons/5/52/Sweet_and_sour_chicken.jpg",
            "https://cdn7.kiwilimon.com/recetaimagen/30477/640x640/39497.jpg.jpg",
            "https://images.unsplash.com/photo-1603360946369-dc9bb6258143"
        ]
    }
},
{
    titulo: "Crepas Dulces Francesas",
    subtitulo: "Elegancia y suavidad en cada bocado",
    descripcion: "Crepas delgadas rellenas con chocolate, frutas y crema batida.",
    tiempo_preparacion: "35 min",
    dificultad: "Fácil",
    porciones: 6,
    id_categoria: 5,
    contenido: {
        ingredientes: [
            { nombre: "grms de harina", cantidad: "250" },
            { nombre: "ml de leche", cantidad: "500" },
            { nombre: "piezas de huevo", cantidad: "3" },
            { nombre: "grms de mantequilla", cantidad: "60" },
            { nombre: "grms de chocolate", cantidad: "180" },
            { nombre: "grms de fresas", cantidad: "250" }
        ],
        pasos: [
            "Mezcla harina, huevos, leche y mantequilla derretida hasta obtener una masa líquida completamente uniforme y sin grumos.",
            
            "Deja reposar la mezcla durante al menos 20 minutos para mejorar la textura final de las crepas.",
            
            "Calienta un sartén antiadherente ligeramente engrasado y vierte una pequeña cantidad de mezcla distribuyéndola en toda la superficie.",
            
            "Cocina la crepa durante aproximadamente un minuto por lado hasta que tenga un color ligeramente dorado.",
            
            "Rellena con chocolate derretido, fresas frescas o crema batida y dobla cuidadosamente.",
            
            "Sirve calientes decoradas con azúcar glass o frutas adicionales."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1519676867240-f03562e64548",
            "https://upload.wikimedia.org/wikipedia/commons/0/09/Crepes_with_strawberries.jpg",
            "https://cdn7.kiwilimon.com/recetaimagen/30300/640x640/39309.jpg.jpg",
            "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c"
        ]
    }
}
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