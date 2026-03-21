# Esquema de Base de Datos

## Base de Datos: recetas_db

### Tabla: usuarios
| Propiedad       | Tipo                        | Restricciones      | Descripción                                         |
| --------------- | --------------------------- | ------------------ | --------------------------------------------------- |
| id_usuario      | INT                         | PK, AUTO_INCREMENT | Identificador único del usuario                     |
| nombre          | VARCHAR(100)                | NOT NULL           | Nombre del suscriptor                               |
| correo          | VARCHAR(120)                | NOT NULL, UNIQUE   | Correo electrónico                                  |
| contraseña_hash | VARCHAR(255)                | NOT NULL           | Contraseña almacenada como hash                     |
| clave_publica   | TEXT                        | NOT NULL           | Clave pública del usuario para criptografía híbrida |
| fecha_registro  | DATETIME                    | NOT NULL           | Fecha de registro                                   |

### Tabla: chef
| Propiedad             | Tipo de dato | Restricciones      | Descripción                                     |
| --------------------- | ------------ | ------------------ | ----------------------------------------------- |
| id_chef               | INT          | PK, AUTO_INCREMENT | Identificador de la chef                        |
| nombre                | VARCHAR(100) | NOT NULL           | Nombre de la chef                               |
| correo                | VARCHAR(120) | NOT NULL, UNIQUE   | Correo de contacto                              |
| clave_publica         | TEXT         | NOT NULL           | Clave pública utilizada en criptografía híbrida |
| clave_privada_cifrada | TEXT         | NOT NULL           | Clave privada almacenada cifrada                |

### Tabla: receta
| Propiedad           | Tipo         | Restricciones      | Descripción                    |
| ------------------- | ------------ | ------------------ | ------------------------------ |
| id_receta           | INT          | PK, AUTO_INCREMENT | Identificador de la receta     |
| titulo              | VARCHAR(150) | NOT NULL           | Nombre de la receta            |
| descripcion         | TEXT         | NULL               | Descripción breve              |
| url_archivo_cifrado | VARCHAR(255) | NOT NULL           | Ruta del archivo cifrado       |
| hash_archivo        | VARCHAR(255) | NOT NULL           | Hash para verificar integridad |
| fecha_creacion      | DATETIME     | NOT NULL           | Fecha de creación              |
| id_chef             | INT          | FK                 | Chef que creó la receta        |

### Tabla: contrato
| Propiedad     | Tipo                                  | Restricciones      | Descripción                |
| ------------- | ------------------------------------- | ------------------ | -------------------------- |
| id_contrato   | INT                                   | PK, AUTO_INCREMENT | Identificador del contrato |
| id_usuario    | INT                                   | FK, NOT NULL       | Usuario suscriptor         |
| id_chef       | INT                                   | FK, NOT NULL       | Chef                       |
| periodo_meses | INT                                   | NOT NULL           | Duración del contrato      |
| costo         | DECIMAL(8,2)                          | NOT NULL           | Precio de la suscripción   |
| fecha_inicio  | DATE                                  | NOT NULL           | Inicio del contrato        |
| fecha_fin     | DATE                                  | NOT NULL           | Fin del contrato           |
| estado        | ENUM('activo','expirado','cancelado') | DEFAULT 'activo'   | Estado del contrato        |

### Tabla: clave_receta
| Propiedad               | Tipo     | Restricciones      | Descripción                                        |
| ----------------------- | -------- | ------------------ | -------------------------------------------------- |
| id_clave                | INT      | PK, AUTO_INCREMENT | Identificador                                      |
| id_usuario              | INT      | FK                 | Usuario que puede acceder                          |
| id_receta               | INT      | FK                 | Receta asociada                                    |
| clave_simetrica_cifrada | TEXT     | NOT NULL           | Clave AES cifrada con la clave pública del usuario |
| fecha_generacion        | DATETIME | NOT NULL           | Fecha en que se generó la clave                    |