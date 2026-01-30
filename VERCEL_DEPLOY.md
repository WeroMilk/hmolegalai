# Si Vercel sigue fallando

1. **En el dashboard de Vercel** → tu proyecto → **Settings** → **General**  
   - Comprueba que **Framework Preset** sea **Next.js**.  
   - Comprueba que **Root Directory** esté vacío (o sea `.`).

2. **Borrar caché y volver a desplegar**  
   - **Deployments** → los tres puntos del último deployment → **Redeploy**.  
   - Marca **Clear Build Cache** y confirma.  
   Así Vercel usa el código último y no una build antigua.

3. **Variables de entorno**  
   No son necesarias para que el **build** pase (Stripe y OpenAI se inicializan solo en runtime).  
   Para que la app funcione en producción, configura en **Settings → Environment Variables** las que uses: Firebase, Stripe, OpenAI, etc.

4. **Ver el error concreto**  
   En **Deployments** → clic en el deployment fallido → **Building** y revisa la última línea de los logs.  
   Si sigue fallando, copia ese mensaje para poder afinar el fix.
