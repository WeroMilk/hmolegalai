# 🔑 Superusuarios y usuarios demo

## Superusuarios (solo tú)

| Email | Uso |
|-------|-----|
| `admin@avatar.com` | Panel admin: aprueba abogados, edita tu perfil. Genera documentos sin pagar. |
| `didi@dietas.com` | Cliente con acceso a DIDI (planes nutricionales comca'ac) |

**Password admin:** `admin123`  
**Password didi:** `didi123`

## Usuarios demo (para otros)

| Email | Uso |
|-------|-----|
| `abogado@avatar.com` | Ejemplo de abogado: dashboard con solicitudes, configuración editable |
| `cliente@avatar.com` | Ejemplo de cliente: genera documentos y ve Mis Documentos |

**Password abogado:** `abogado123`  
**Password cliente:** `cliente123`

## Flujo

- **admin@avatar.com** → `/admin/abogados` (administrar abogados + mi perfil)
- **abogado@avatar.com** → `/abogado/dashboard` (solicitudes + configuración)
- **cliente@avatar.com** y **didi@dietas.com** → catálogo, Mis Documentos, DIDI

## Más detalles

Ver **[DEMO_USERS.md](./DEMO_USERS.md)**.
