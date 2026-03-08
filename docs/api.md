# Documentación de API - Recetas Deliciosas

## Base URL: http://localhost:3000/api

## Endpoints Disponibles

### Health Check 
GET /api/health  
Response: { "status": "ok", "message": "Servidor funcionando" }

### Database Test
GET /api/db/test  
Response: { "status": "ok", "message": "Conexión a BD exitosa" }

### Usuarios
GET /api/users - Listar todos los usuarios  
GET /api/users/:id - Obtener usuario por ID  
POST /api/users/register - Registrar nuevo usuario
