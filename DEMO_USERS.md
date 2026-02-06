# 🔑 Usuarios Demo para Pruebas

Credenciales para probar los distintos roles de la plataforma AVATAR Legal AI.

## Las 4 cuentas demo

| Rol | Email | Contraseña | Qué ve |
|-----|-------|------------|--------|
| **DIDI** | `didi@dietas.com` | `didi123` | Cliente con acceso a la pestaña DIDI (planes nutricionales comca'ac) |
| **Admin** | `admin@avatar.com` | `admin1234` | Panel para **aprobar abogados** que se inscriben al programa |
| **Abogado** | `abogado@avatar.com` | `abogado123` | Dashboard con **solicitudes/documentos** que le llegan para revisar |
| **Cliente** | `cliente@avatar.com` | `cliente123` | Usuario normal: genera documentos y ve Mis Documentos |

## Dashboards según rol

- **Admin** → `/admin/abogados`: ve y aprueba/rechaza a los abogados que quieren inscribirse
- **Abogado** → `/abogado/dashboard`: ve las solicitudes de documentos asignadas a él
- **Cliente** y **DIDI** → catálogo, Mis Documentos, sin dashboard especial

## Notas

- Las cuentas se **auto-crean** en Firebase al hacer sign-in si no existen
- El admin genera documentos sin pagar (superusuario)
- DIDI tiene acceso exclusivo a la pestaña DIDI (comca'ac)
