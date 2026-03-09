-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contraseña_hash VARCHAR(255) NOT NULL,
    clave_publica TEXT NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: chef
CREATE TABLE chef (
    id_chef INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    clave_publica TEXT NOT NULL,
    clave_privada_cifrada TEXT NOT NULL
);

-- Tabla: receta
CREATE TABLE receta (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    url_archivo_cifrado VARCHAR(255) NOT NULL,
    hash_archivo VARCHAR(255) NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_chef INT,
    
    CONSTRAINT fk_receta_chef
        FOREIGN KEY (id_chef)
        REFERENCES chef(id_chef)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Tabla: contrato
CREATE TABLE contrato (
    id_contrato INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_chef INT NOT NULL,
    periodo_meses INT NOT NULL,
    costo DECIMAL(8,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado ENUM('activo','expirado','cancelado') DEFAULT 'activo',

    CONSTRAINT chk_periodo
        CHECK (periodo_meses IN (3,6,12)),

    CONSTRAINT fk_contrato_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_contrato_chef
        FOREIGN KEY (id_chef)
        REFERENCES chef(id_chef)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Tabla: clave_receta
CREATE TABLE clave_receta (
    id_clave INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_receta INT,
    clave_simetrica_cifrada TEXT NOT NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clave_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_clave_receta
        FOREIGN KEY (id_receta)
        REFERENCES receta(id_receta)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);