# Recetas Deliciosas Como Servicio

**ESCOM - IPN | Selected Topics of Cripthography | 7CM1**

---

| | |
|---|---|
| **Profesora** | Sandra Díaz Santiago |
| **Alumnos** | Areli Alejandra Guevara Badillo \| Héctor Rigel Ocaña Castro |
| **Inicio** | 2 de Marzo de 2026 |
| **Entrega Final** | 30 de Abril de 2026 |

---

## Descripción

Sistema web seguro donde una chef comparte recetas exclusivas mediante suscripción. Los suscriptores firman contratos digitales y acceden a recetas cifradas. Las recetas se almacenan en un servidor de terceros (AWS S3) garantizando confidencialidad mediante criptografía híbrida.

---

## Servicios de Seguridad

| Servicio | Algoritmo | Propósito |
|----------|-----------|-----------|
| Cifrado de Recetas | AES-256-GCM | Confidencialidad del contenido |
| Hash de Contratos | SHA-256 | Integridad de documentos |
| Firma Digital | ECDSA (P-256) | Autenticación y no repudio |
| Intercambio de Claves | ECDHE | Canal seguro (Forward Secrecy) |
| Tickets de Acceso | AES-256-GCM | Control de expiración |

---

## Arquitectura

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   CLIENTE (Web)     │         │  SERVIDOR (Chef)    │         │   TERCEROS          │
│                     │         │                     │         │                     │
│  • React + Tailwind │ ──────► │  • Node.js + Express│ ──────► │  • AWS S3           │
│  • Web Crypto API   │         │  • PostgreSQL       │         │  • Recetas Cifradas │
│  • Cifrado/Descifrado│        │  • Gestión de Claves│         │                     │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

---

## Backend

### Instalación
```bash
npm install
cp .env.example .env
npm run dev
```

### Endpoints (Semana 1)
GET /api/health  
GET /api/db/test  
GET /api/users  
GET /api/users/:id  
POST /api/users/register  

### Variables de Entorno
Ver .env.example

---

<div align="center">

**Proyecto desarrollado para ESCOM-IPN 2026**

</div>
