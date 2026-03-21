# Recetas Deliciosas Como Servicio

**ESCOM - IPN | Selected Topics of Cryptography | 7CM1**

-----

| | |
|---|---|
| **Profesora** | Sandra Díaz Santiago |
| **Alumnos** | Areli Alejandra Guevara Badillo / Héctor Rigel Ocaña Castro |
| **Inicio** | 2 de Marzo de 2026 |
| **Entrega Final** | 30 de Abril de 2026 |

-----

## Descripción

Sistema web seguro de suscripción culinaria diseñado para garantizar la confidencialidad de recetas exclusivas de la Chef. El sistema emplea un modelo de **confianza parcial (Zero-Knowledge parcial)** donde el servidor almacena las identidades digitales de los usuarios cifradas bajo sus propias contraseñas, asegurando que ni el administrador de la red ni terceros puedan acceder al contenido sin autorización.

-----

## Servicios de Seguridad

| Servicio | Algoritmo | Propósito |
|----------|-----------|-----------|
| **Identidad Digital** | **ECDSA (Curva P-256)** | Generación de pares de claves para firmas y cifrado asimétrico. |
| **Protección de Claves** | **PBKDF2 + AES-128-GCM** | Derivación de clave desde contraseña y cifrado de la clave privada en la BD. |
| **Cifrado de Recetas** | **AES-128-GCM** | Confidencialidad del contenido de las recetas (Motor Python). |
| **Integridad** | **SHA-256** | Verificación de que los archivos de recetas no han sido alterados. |
| **Validación de Identidad** | **Token Dinámico (32 bytes)** | Confirmación de suscripción vía correo electrónico (Mailtrap). |

-----

## Arquitectura del Sistema

El sistema utiliza un puente de comunicación entre un entorno de ejecución **Node.js** y scripts especializados en **Python** para las operaciones criptográficas críticas.

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   CLIENTE (Web)     │      │   SERVIDOR (API)    │      │    PERSISTENCIA     │
│                     │      │                     │      │                     │
│ • React + Tailwind  │ ───► │ • Node.js + Express │ ───► │ • SQLite (DB Local) │
│ • Axios (API Cons.) │      │ • Nodemailer (Mail) │      │ • recetas.db        │
└─────────────────────┘      └──────────┬──────────┘      └─────────────────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │ MOTOR CRIPTOGRÁFICO │
                             │      (PYTHON)       │
                             │ • PyCryptodome      │
                             │ • ECDSA / AES-GCM   │
                             └─────────────────────┘
```

-----

## Instalación y Configuración

### 1\. Requisitos Previos

  * Node.js v18+
  * Python 3.9+
  * Cuenta en Mailtrap.io para pruebas de correo.

### 2\. Configuración del Backend

```bash
cd backend
npm install
pip install -r requirements.txt
cp .env.example .env
npm run dev
```

### 3\. Configuración del Frontend

```bash
cd frontend
npm install
npm run dev
```

-----

## 🚀 API Endpoints Actualizados

| Método | Ruta | Descripción |
|--------|------|-------------|
| **POST** | `/api/users/register` | Registro de usuario y generación de claves ECDSA vía Python. |
| **POST** | `/api/users/login` | Autenticación y desbloqueo de clave privada en memoria. |
| **GET** | `/api/users/confirmar/:token` | Activación de cuenta mediante enlace de correo. |
| **GET** | `/api/users` | (Test) Listado de usuarios registrados. |

-----

## 📁 Estructura Criptográfica (`/crypto_vault`)

  * **`keys.py`**: Motor de generación de identidades ECDSA P-256 y cifrado/descifrado de llaves privadas mediante PBKDF2.
  * **`cipher.py`**: Lógica de cifrado simétrico AES para el contenido de las recetas.

-----

**Proyecto desarrollado para la materia de Tópicos Selectos de Criptografía - ESCOM 2026**
