# Secure Recipes Vault

Sistema web de suscripción culinaria segura diseñado para garantizar la confidencialidad e integridad de recetas exclusivas mediante el uso de criptografía híbrida y un modelo parcial de Conocimiento Cero (*Zero-Knowledge*).

---

## Descripción del Proyecto

**Secure Recipes Vault** aborda el desafío de la monetización de propiedad intelectual culinaria en entornos digitales. El sistema permite a un chef mexicano publicar y vender el acceso a sus recetas mediante suscripciones por períodos definidos (3, 6 o 12 meses). 

El principal reto de seguridad radica en que el contenido se almacena en un servidor de terceros. Para garantizar que solo el chef y los suscriptores activos puedan acceder a las recetas, el sistema implementa un modelo parcial de *Zero-Knowledge*. En este esquema, el servidor almacena las identidades digitales y el contenido cifrado, pero nunca tiene acceso a las claves privadas en texto plano ni a las claves simétricas de descifrado. Al finalizar la suscripción, la criptografía de clave secreta asegura la revocación inmediata del acceso, protegiendo efectivamente los secretos culinarios.

---

## Características Principales

### Seguridad Criptográfica
- **Gestión de Identidad Digital (ECDSA P-256):** Generación segura de pares de claves para identidades de usuarios y chefs, utilizadas para cifrado asimétrico y firmas digitales.
- **Protección de Claves Privadas (PBKDF2 + AES-128-GCM):** Las claves privadas se derivan de las contraseñas mediante PBKDF2 y se cifran localmente con AES-128-GCM. El servidor nunca almacena claves privadas en texto plano.
- **Cifrado de Contenido (AES-128-GCM):** El contenido de las recetas se cifra simétricamente, garantizando la confidencialidad de los datos en reposo.
- **Integridad de Datos (SHA-256):** Uso de funciones *hash* para verificar que los archivos de recetas y los elementos criptográficos no han sido alterados.
- **Protocolo de Acceso Seguro (ECDH):** Implementación de un intercambio de claves Diffie-Hellman de Curva Elíptica para la derivación segura de claves de sesión entre el cliente y el servidor.

### Funcionalidades del Sistema
- **Validación Dinámica de Tokens:** Confirmación de cuentas mediante tokens de un solo uso enviados por correo electrónico.
- **Panel de Administración para Chefs:** Gestión de perfil, configuración de precios de suscripción y operaciones CRUD sobre recetas (carga, cifrado, edición y eliminación).
- **Gestión de Suscripciones:** Control de suscriptores activos, con capacidad para cancelar, reactivar o eliminar contratos digitalmente.
- **Exploración y Biblioteca para Suscriptores:** Búsqueda y filtrado de recetas por categoría, dificultad y tiempo de preparación, junto con una biblioteca personal de favoritos.

---

## Tecnologías Utilizadas

- **Frontend:** React, Tailwind CSS.
- **Backend:** Node.js, Express.js, Python (para módulos criptográficos).
- **Base de Datos:** SQLite.
- **Criptografía:** ECDSA P-256, ECDH, AES-128-GCM, PBKDF2, SHA-256.

---

## Instalación y Configuración

### 1. Prerrequisitos
- Node.js y npm instalados.
- Python 3.12 instalado.
- SQLite3 disponible en el sistema.

### 2. Generación de Llaves del Bóveda
Ejecute el script de inicialización criptográfica para generar las claves maestras del servidor:
```bash
python scripts/generate_vault_keys.py
```

### 3. Instalación de Dependencias
Instale los paquetes requeridos tanto para el frontend como para el backend:
```bash
# Dependencias del servidor
cd server && npm install

# Dependencias del cliente
cd ../client && npm install
```

### 4. Inicialización de la Base de Datos
Ejecute el script de migración para crear las tablas y esquemas en la base de datos SQLite:
```bash
cd ../server
python init_db.py
```
---

### Flujo de Trabajo por Rol

**Para el Chef:**
1. Registro y verificación de cuenta.
2. Configuración del perfil y definición de los planes de suscripción.
3. Carga de recetas: El sistema cifra automáticamente el contenido antes de almacenarlo.
4. Gestión de suscriptores: Supervisión de contratos activos y revocación de accesos.

**Para el Suscriptor:**
1. Registro, verificación y selección de un plan de suscripción.
2. Exploración del catálogo de recetas (metadatos públicos).
3. Acceso al contenido: Al seleccionar una receta, el cliente solicita la clave cifrada, la descifra localmente usando la contraseña del usuario y realiza el intercambio ECDH con el servidor para obtener la clave simétrica que desencripta el contenido.

---
  
<div align="center">
  <strong>© 2026 | <a href="https://github.com/Venuz25">Areli Guevara</strong>
</div>
