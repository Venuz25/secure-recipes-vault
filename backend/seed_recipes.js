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

const recipesToSeed = [
{
    titulo: "Mole Poblano Tradicional",
    subtitulo: "El sabor emblemático de Puebla",
    descripcion: "Una receta tradicional mexicana preparada con chiles secos, chocolate y especias que acompañan perfectamente al guajolote o pollo.",
    tiempo_preparacion: "180 min",
    dificultad: "Alta",
    porciones: 8,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de chile ancho", cantidad: "200" },
            { nombre: "grms de chile mulato", cantidad: "150" },
            { nombre: "grms de chile pasilla", cantidad: "150" },
            { nombre: "grms de jitomate", cantidad: "400" },
            { nombre: "grms de cebolla", cantidad: "250" },
            { nombre: "dientes de ajo", cantidad: "6" },
            { nombre: "grms de chocolate mexicano", cantidad: "120" },
            { nombre: "ml de caldo de pollo", cantidad: "1500" }
        ],
        pasos: [
            "Desvena y limpia todos los chiles secos retirando semillas y venas cuidadosamente.",
            "Tuesta ligeramente los chiles en un comal caliente evitando que se quemen para no amargar el mole.",
            "Fríe cebolla, ajo y jitomate hasta que estén completamente cocidos y ligeramente caramelizados.",
            "Licúa todos los ingredientes junto con especias, chocolate y parte del caldo de pollo hasta obtener una mezcla homogénea.",
            "Cuela la salsa y cocínala en una cacerola amplia con manteca o aceite removiendo constantemente.",
            "Agrega el resto del caldo y cocina a fuego bajo durante una hora hasta lograr una textura espesa y brillante.",
            "Sirve acompañado de pollo, ajonjolí tostado y arroz rojo."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
            "https://upload.wikimedia.org/wikipedia/commons/1/10/Mole_Poblano.jpg",
            "https://images.unsplash.com/photo-1544025162-d76694265947",
            "https://cdn7.kiwilimon.com/recetaimagen/30498/640x640/38192.jpg"
        ]
    }
},
{
    titulo: "Cochinita Pibil Yucateca",
    subtitulo: "Cerdo marinado con axiote y cítricos",
    descripcion: "Platillo tradicional de Yucatán cocinado lentamente y envuelto en hoja de plátano para lograr una carne suave y aromática.",
    tiempo_preparacion: "240 min",
    dificultad: "Media",
    porciones: 10,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de pierna de cerdo", cantidad: "2500" },
            { nombre: "grms de pasta de axiote", cantidad: "200" },
            { nombre: "ml de jugo de naranja agria", cantidad: "500" },
            { nombre: "grms de cebolla morada", cantidad: "300" },
            { nombre: "hojas de plátano", cantidad: "4" },
            { nombre: "dientes de ajo", cantidad: "8" },
            { nombre: "grms de sal", cantidad: "25" }
        ],
        pasos: [
            "Mezcla el axiote con jugo de naranja agria, ajo y sal hasta formar una marinada uniforme.",
            "Cubre completamente la carne de cerdo y deja reposar refrigerada durante toda la noche.",
            "Asa ligeramente las hojas de plátano para volverlas flexibles y resistentes.",
            "Envuelve la carne marinada con las hojas y colócala dentro de una bandeja profunda.",
            "Hornea tapado a baja temperatura durante aproximadamente cuatro horas hasta que la carne se deshaga fácilmente.",
            "Desmenuza la carne y mezcla con sus propios jugos de cocción.",
            "Sirve con cebolla morada curtida, habanero y tortillas calientes."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1613514785940-daed07799d9b",
            "https://upload.wikimedia.org/wikipedia/commons/5/57/Cochinita_Pibil.jpg",
            "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85",
            "https://cdn7.kiwilimon.com/recetaimagen/15433/640x640/15067.jpg"
        ]
    }
},
{
    titulo: "Chiles en Nogada",
    subtitulo: "Tradición barroca mexicana",
    descripcion: "Uno de los platillos más representativos de México elaborado con chile poblano relleno de picadillo y cubierto con nogada.",
    tiempo_preparacion: "150 min",
    dificultad: "Alta",
    porciones: 6,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "piezas de chile poblano", cantidad: "6" },
            { nombre: "grms de carne molida de res", cantidad: "400" },
            { nombre: "grms de carne molida de cerdo", cantidad: "400" },
            { nombre: "grms de nuez de castilla", cantidad: "300" },
            { nombre: "ml de crema", cantidad: "250" },
            { nombre: "grms de granada", cantidad: "200" },
            { nombre: "grms de manzana", cantidad: "150" }
        ],
        pasos: [
            "Asa y limpia los chiles poblanos retirando piel y semillas con cuidado de no romperlos.",
            "Prepara el relleno sofriendo cebolla y carnes hasta dorar completamente.",
            "Agrega frutas picadas, almendra y especias mezclando hasta integrar sabores.",
            "Rellena los chiles cuidadosamente y reserva.",
            "Licúa nuez de castilla con crema y queso fresco hasta obtener una salsa tersa.",
            "Baña los chiles con la nogada y decora con granada y perejil fresco.",
            "Sirve a temperatura ambiente acompañado de pan artesanal."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1625944525533-473f1b3d54c6",
            "https://upload.wikimedia.org/wikipedia/commons/7/7d/Chiles_en_nogada.jpg",
            "https://images.unsplash.com/photo-1604908554165-e9467e0e4d6f",
            "https://cdn7.kiwilimon.com/recetaimagen/31475/640x640/39334.jpg"
        ]
    }
},
{
    titulo: "Pozole Rojo Guerrero",
    subtitulo: "Caldo mexicano lleno de tradición",
    descripcion: "Pozole rojo preparado con maíz cacahuazintle, carne de cerdo y una salsa intensa de chile guajillo.",
    tiempo_preparacion: "210 min",
    dificultad: "Media",
    porciones: 12,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de maíz pozolero", cantidad: "1500" },
            { nombre: "grms de espinazo de cerdo", cantidad: "1200" },
            { nombre: "grms de chile guajillo", cantidad: "180" },
            { nombre: "grms de cebolla", cantidad: "300" },
            { nombre: "dientes de ajo", cantidad: "6" },
            { nombre: "litros de agua", cantidad: "5" },
            { nombre: "grms de lechuga", cantidad: "400" }
        ],
        pasos: [
            "Cuece el maíz pozolero hasta que los granos comiencen a abrirse completamente.",
            "Agrega la carne de cerdo y cocina lentamente retirando espuma e impurezas.",
            "Hierve los chiles guajillo y licúalos con ajo y cebolla.",
            "Cuela la salsa e intégrala al caldo mezclando constantemente.",
            "Cocina el pozole durante una hora adicional para integrar sabores.",
            "Rectifica sazón con sal y orégano seco.",
            "Sirve acompañado de lechuga, rábano, cebolla y tostadas."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1617093727343-374698b1b08d",
            "https://upload.wikimedia.org/wikipedia/commons/a/a9/Pozole_rojo.jpg",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
            "https://cdn7.kiwilimon.com/recetaimagen/27042/640x640/34916.jpg"
        ]
    }
},
{
    titulo: "Tacos de Barbacoa Hidalgo",
    subtitulo: "Cordero cocinado lentamente",
    descripcion: "Barbacoa tradicional mexicana preparada en cocción lenta con hojas de maguey y especias aromáticas.",
    tiempo_preparacion: "360 min",
    dificultad: "Alta",
    porciones: 10,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de pierna de cordero", cantidad: "3000" },
            { nombre: "hojas de maguey", cantidad: "6" },
            { nombre: "grms de chile guajillo", cantidad: "120" },
            { nombre: "dientes de ajo", cantidad: "10" },
            { nombre: "grms de cebolla", cantidad: "300" },
            { nombre: "grms de sal", cantidad: "30" },
            { nombre: "ml de vinagre blanco", cantidad: "120" }
        ],
        pasos: [
            "Licúa chile guajillo con ajo, cebolla, vinagre y especias hasta obtener un adobo espeso.",
            "Marina el cordero durante al menos ocho horas para potenciar el sabor.",
            "Asa ligeramente las hojas de maguey para suavizarlas.",
            "Envuelve completamente la carne y colócala en una olla profunda o vaporera.",
            "Cocina lentamente durante cinco horas hasta que la carne se desprenda fácilmente.",
            "Desmenuza la barbacoa y mezcla con sus jugos naturales.",
            "Sirve en tortillas calientes con cilantro, cebolla y salsa verde."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1529042410759-befb1204b468",
            "https://upload.wikimedia.org/wikipedia/commons/e/e6/Barbacoa.jpg",
            "https://images.unsplash.com/photo-1600335895229-6e75511892c8",
            "https://cdn7.kiwilimon.com/recetaimagen/30172/640x640/37854.jpg"
        ]
    }
},
{
    titulo: "Enchiladas Verdes",
    subtitulo: "Tortillas bañadas en salsa de tomatillo",
    descripcion: "Receta tradicional mexicana elaborada con tortillas rellenas de pollo y cubiertas con salsa verde casera.",
    tiempo_preparacion: "60 min",
    dificultad: "Fácil",
    porciones: 5,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de tomatillo verde", cantidad: "700" },
            { nombre: "piezas de tortilla de maíz", cantidad: "15" },
            { nombre: "grms de pechuga de pollo", cantidad: "500" },
            { nombre: "grms de cebolla", cantidad: "200" },
            { nombre: "grms de queso fresco", cantidad: "250" },
            { nombre: "dientes de ajo", cantidad: "3" },
            { nombre: "grms de chile serrano", cantidad: "60" }
        ],
        pasos: [
            "Hierve los tomatillos y chiles hasta que cambien ligeramente de color.",
            "Licúa junto con ajo, cebolla y cilantro fresco hasta obtener una salsa homogénea.",
            "Fríe ligeramente la salsa en una cacerola para intensificar sabores.",
            "Rellena las tortillas con pollo deshebrado previamente cocido.",
            "Dobla las tortillas y acomódalas en un plato amplio.",
            "Baña con abundante salsa verde y agrega queso fresco y cebolla.",
            "Sirve calientes acompañadas de crema y frijoles refritos."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d",
            "https://upload.wikimedia.org/wikipedia/commons/6/69/Enchiladas_Verdes.jpg",
            "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b",
            "https://cdn7.kiwilimon.com/recetaimagen/18168/640x640/19562.jpg"
        ]
    }
},
{
    titulo: "Tamales Oaxaqueños",
    subtitulo: "Masa suave envuelta en hoja de plátano",
    descripcion: "Tamales tradicionales rellenos de mole y pollo cocidos al vapor con aromas intensos de hoja de plátano.",
    tiempo_preparacion: "180 min",
    dificultad: "Media",
    porciones: 12,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de masa de maíz", cantidad: "2000" },
            { nombre: "grms de manteca de cerdo", cantidad: "400" },
            { nombre: "grms de pollo cocido", cantidad: "800" },
            { nombre: "ml de mole negro", cantidad: "700" },
            { nombre: "hojas de plátano", cantidad: "10" },
            { nombre: "grms de sal", cantidad: "20" },
            { nombre: "ml de caldo de pollo", cantidad: "500" }
        ],
        pasos: [
            "Bate la manteca hasta obtener una textura esponjosa y ligera.",
            "Integra la masa y caldo poco a poco mezclando hasta lograr suavidad.",
            "Asa ligeramente las hojas de plátano para facilitar el manejo.",
            "Coloca masa sobre cada hoja y agrega mole con pollo desmenuzado.",
            "Dobla cuidadosamente formando paquetes rectangulares.",
            "Cocina al vapor durante aproximadamente una hora y media.",
            "Sirve calientes acompañados de salsa picante y café de olla."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1601050690597-df0568f70950",
            "https://upload.wikimedia.org/wikipedia/commons/4/48/Tamales.jpg",
            "https://images.unsplash.com/photo-1626200419199-391ae4be7a41",
            "https://cdn7.kiwilimon.com/recetaimagen/32193/640x640/40252.jpg"
        ]
    }
},
{
    titulo: "Sopa de Tortilla",
    subtitulo: "Caldo tradicional con chile pasilla",
    descripcion: "Sopa mexicana elaborada con jitomate, tortilla frita y chile pasilla acompañada de aguacate y queso fresco.",
    tiempo_preparacion: "50 min",
    dificultad: "Fácil",
    porciones: 6,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "grms de jitomate", cantidad: "700" },
            { nombre: "piezas de tortilla de maíz", cantidad: "12" },
            { nombre: "grms de chile pasilla", cantidad: "80" },
            { nombre: "grms de cebolla", cantidad: "200" },
            { nombre: "dientes de ajo", cantidad: "4" },
            { nombre: "litros de caldo de pollo", cantidad: "2" },
            { nombre: "grms de aguacate", cantidad: "300" }
        ],
        pasos: [
            "Fríe las tortillas cortadas en tiras hasta obtener textura crujiente.",
            "Asa jitomate, cebolla y ajo hasta dorar ligeramente.",
            "Licúa los vegetales junto con caldo de pollo.",
            "Cuece la salsa resultante durante 20 minutos a fuego medio.",
            "Fríe ligeramente el chile pasilla cortado en tiras.",
            "Sirve la sopa caliente agregando tortilla frita, aguacate y queso fresco.",
            "Finaliza con crema y chile pasilla crujiente."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1547592180-85f173990554",
            "https://upload.wikimedia.org/wikipedia/commons/e/e6/Sopa_de_tortilla.jpg",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
            "https://cdn7.kiwilimon.com/recetaimagen/15667/640x640/15359.jpg"
        ]
    }
},
{
    titulo: "Tlayudas Oaxaqueñas",
    subtitulo: "Crujiente antojito del sur de México",
    descripcion: "Tortilla grande y crujiente cubierta con asiento, frijoles, quesillo y carne asada tradicional de Oaxaca.",
    tiempo_preparacion: "45 min",
    dificultad: "Fácil",
    porciones: 4,
    id_categoria: 1,
    contenido: {
        ingredientes: [
            { nombre: "piezas de tlayuda", cantidad: "4" },
            { nombre: "grms de frijoles refritos", cantidad: "500" },
            { nombre: "grms de quesillo", cantidad: "400" },
            { nombre: "grms de tasajo", cantidad: "500" },
            { nombre: "grms de jitomate", cantidad: "200" },
            { nombre: "grms de aguacate", cantidad: "250" },
            { nombre: "grms de lechuga", cantidad: "200" }
        ],
        pasos: [
            "Calienta las tlayudas sobre un comal amplio hasta volverlas ligeramente crujientes.",
            "Unta una capa de frijoles refritos sobre toda la superficie.",
            "Agrega quesillo deshebrado y carne asada previamente cocida.",
            "Cocina nuevamente hasta que el queso comience a fundirse.",
            "Añade jitomate, lechuga y aguacate fresco.",
            "Dobla parcialmente la tlayuda para facilitar el servicio.",
            "Sirve caliente acompañada de salsa molcajeteada."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c",
            "https://upload.wikimedia.org/wikipedia/commons/3/3c/Tlayuda.jpg",
            "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85",
            "https://cdn7.kiwilimon.com/recetaimagen/32377/640x640/40405.jpg"
        ]
    }
},
{
    titulo: "Pescado a la Veracruzana",
    subtitulo: "Sabores costeros del Golfo de México",
    descripcion: "Filetes de pescado cocinados con jitomate, aceitunas, alcaparras y hierbas frescas al estilo veracruzano.",
    tiempo_preparacion: "70 min",
    dificultad: "Media",
    porciones: 6,
    id_categoria: 10,
    contenido: {
        ingredientes: [
            { nombre: "grms de filete de huachinango", cantidad: "1200" },
            { nombre: "grms de jitomate", cantidad: "700" },
            { nombre: "grms de cebolla", cantidad: "250" },
            { nombre: "dientes de ajo", cantidad: "5" },
            { nombre: "grms de aceitunas verdes", cantidad: "120" },
            { nombre: "grms de alcaparras", cantidad: "50" },
            { nombre: "ml de aceite de oliva", cantidad: "100" }
        ],
        pasos: [
            "Sazona los filetes de pescado con sal y pimienta por ambos lados.",
            "Sofríe cebolla y ajo en aceite de oliva hasta transparentar.",
            "Agrega jitomate picado y cocina hasta formar una salsa espesa.",
            "Integra aceitunas, alcaparras y hojas de laurel mezclando suavemente.",
            "Coloca los filetes sobre la salsa y cocina tapado durante 15 minutos.",
            "Rectifica sazón y añade perejil fresco picado.",
            "Sirve acompañado de arroz blanco y plátano frito."
        ],
        imagenes: [
            "https://images.unsplash.com/photo-1544025162-d76694265947",
            "https://upload.wikimedia.org/wikipedia/commons/8/84/Huachinango_a_la_veracruzana.jpg",
            "https://images.unsplash.com/photo-1559847844-5315695dadae",
            "https://cdn7.kiwilimon.com/recetaimagen/15053/640x640/14784.jpg"
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