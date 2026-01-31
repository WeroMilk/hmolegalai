# Configurar avatarlegalai.com.mx en GoDaddy

Tu app está en Vercel. Para que el dominio apunte correctamente, configura estos registros DNS en GoDaddy.

---

## 1. Ir a la administración DNS en GoDaddy

1. Entra a [GoDaddy](https://www.godaddy.com) e inicia sesión
2. **Mis Productos** → busca **avatarlegalai.com.mx**
3. Clic en **DNS** o **Administrar DNS** (no uses "Conectar sitio" ni "Páginas Web")

---

## 2. Registros DNS a configurar

### Para www.avatarlegalai.com.mx (subdominio www)

| Tipo  | Nombre/Host | Valor/Apuntar a                    | TTL   |
|-------|-------------|-------------------------------------|-------|
| CNAME | www         | 72759d539079ea28.vercel-dns-017.com | 1 hora |

### Para avatarlegalai.com.mx (dominio raíz)

| Tipo | Nombre/Host | Valor/Apuntar a | TTL   |
|------|-------------|-----------------|-------|
| A    | @           | 76.76.21.21     | 1 hora |

> **Nota:** En algunos paneles de GoDaddy el nombre se escribe como `@` o se deja vacío para el dominio raíz. Si piden "Nombre", usa `@`.

---

## 3. Eliminar registros conflictivos

Antes de guardar, revisa si ya existen:

- Un registro **A** o **CNAME** para `@` (dominio raíz) que apunte a otro sitio
- Un registro **CNAME** para `www` que apunte a otro lugar

Si existen, edítalos para que coincidan con la tabla anterior o elimínalos y créalos de nuevo.

---

## 4. Guardar y esperar

1. Guarda los cambios en GoDaddy
2. La propagación DNS suele tardar **entre 5 minutos y 48 horas**
3. En [Vercel → Domains](https://vercel.com/dashboard) el estado pasará de "Invalid Configuration" a "Valid Configuration"

---

## 5. Si Vercel muestra otros valores

Si en la sección **DNS Records** de Vercel aparecen registros diferentes a los anteriores, usa exactamente esos. Vercel puede mostrar IPs o CNAMEs específicos de tu proyecto.

Para ver los registros correctos:
- Vercel Dashboard → tu proyecto → **Settings** → **Domains** → clic en el dominio

---

## Resumen rápido

```
www  →  CNAME  →  72759d539079ea28.vercel-dns-017.com
@    →  A      →  76.76.21.21
```
