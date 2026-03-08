-- Usar la base de datos
USE recetas_db;

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    clave_publica TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: contratos
CREATE TABLE IF NOT EXISTS contratos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    hash_contrato CHAR(64) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    periodo_meses INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_expiracion DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    firmado_por_chef BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: recetas
CREATE TABLE IF NOT EXISTS recetas (
    id VARCHAR(36) PRIMARY KEY,
    chef_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    url_externo TEXT NOT NULL,
    metadata_cifrado JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chef_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: accesos_recetas (auditoría)
CREATE TABLE IF NOT EXISTS accesos_recetas (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    receta_id VARCHAR(36) NOT NULL,
    contrato_id VARCHAR(36) NOT NULL,
    ticket_entregado_at DATETIME NOT NULL,
    ticket_expiracion DATETIME NOT NULL,
    acceso_exitoso BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_contratos_usuario ON contratos(usuario_id);
CREATE INDEX idx_contratos_estado ON contratos(estado);
CREATE INDEX idx_recetas_chef ON recetas(chef_id);
CREATE INDEX idx_accesos_usuario ON accesos_recetas(usuario_id);