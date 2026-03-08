# Esquema de Base de Datos - MySQL

## Base de Datos: recetas_db

### Tabla: usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | VARCHAR(36) | Primary Key (UUID) |
| email | VARCHAR(255) | Unique, Not Null |
| password_hash | VARCHAR(255) | Hash de contraseña |
| rol | VARCHAR(50) | 'chef' o 'suscriptor' |
| clave_publica | TEXT | Clave pública ECDSA |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: contratos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | VARCHAR(36) | Primary Key |
| usuario_id | VARCHAR(36) | Foreign Key → usuarios |
| hash_contrato | CHAR(64) | SHA-256 del contrato |
| costo | DECIMAL(10,2) | Costo de suscripción |
| periodo_meses | INT | 3, 6 o 12 meses |
| estado | VARCHAR(50) | pendiente/activo/expirado |

### Tabla: recetas
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | VARCHAR(36) | Primary Key |
| chef_id | VARCHAR(36) | Foreign Key → usuarios |
| titulo | VARCHAR(255) | Título de receta |
| url_externo | TEXT | URL en AWS S3 |

### Tabla: accesos_recetas
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | VARCHAR(36) | Primary Key |
| usuario_id | VARCHAR(36) | Foreign Key → usuarios |
| receta_id | VARCHAR(36) | Foreign Key → recetas |
| ticket_expiracion | TIMESTAMP | Expiración del ticket |