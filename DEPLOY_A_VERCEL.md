# 🚀 DESPLIEGUE A VERCEL - Instrucciones Paso a Paso

## Estado Actual

✅ Cambios pusheados a GitHub: `main` branch
✅ vercel.json configurado
✅ Dependencias instaladas
✅ Proyecto listo para desplegar

## Opción 1: Despliegue Manual desde Dashboard Vercel

### Paso 1: Ir a Vercel Dashboard
1. Ve a https://vercel.com/dashboard
2. Inicia sesión con tu cuenta (GitHub, GitLab, etc.)

### Paso 2: Importar Proyecto
1. Click en **"Add New"** → **"Project"**
2. Selecciona **"Import Git Repository"**
3. Busca tu repositorio **fyz-store**
4. Click en **"Import"**

### Paso 3: Configurar Environment Variables
Vercel te pedirá que definas variables de entorno:

```
STRIPE_SECRET_KEY = sk_test_...
```

Deja en blanco o rellena si tienes.

### Paso 4: Deploy
1. Click en **"Deploy"**
2. Espera a que compile y depliegue (~2-3 minutos)
3. Verás un link: `https://fyz-store.vercel.app`

---

## Opción 2: Despliegue con CLI de Vercel

### Paso 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Paso 2: Autenticarse
```bash
vercel login
```
Te pedirá email/contraseña de Vercel

### Paso 3: Desplegar
```bash
cd c:\Users\pablo\Downloads\fyz_checkout_integrado_abajo
vercel
```

### Paso 4: Responder Preguntas
```
Set up and deploy "fyz-store"? [Y/n] → Y
Which scope? → Tu cuenta personal
Link to existing project? [y/N] → N
Project name: → fyz-store
Detected framework: → Other
Build Command: → (dejar en blanco)
Output Directory: → (dejar en blanco)
```

Vercel desplegará automáticamente.

---

## Verificación Post-Despliegue

Después de desplegar, verifica:

1. **URL del sitio**
   - Vercel te dará algo como: `https://fyz-store.vercel.app`

2. **Funcionalidad de PayPal**
   - Abre en navegador
   - Abre F12 (Developer Tools)
   - Ejecuta: `CheckoutDebug.config()`
   - Deberías ver tu configuración de PayPal

3. **Conexión a Firebase**
   - Intenta agregar un producto al carrito
   - Intenta ir a checkout
   - Deberías ver los datos de Firestore

4. **APIs funcionando**
   - Las funciones en `/api` deberían estar disponibles
   - Stripe payments (si lo implementas) debería funcionar

---

## Configuraciones Importantes

### Variables de Entorno en Vercel

Si necesitas variables secretas en Vercel:

1. Ve a Project Settings → Environment Variables
2. Agrega:
   ```
   STRIPE_SECRET_KEY = tu_secret_key
   ```

3. Redeploy para aplicar cambios

### Dominios Personalizados

Si quieres tu propio dominio:

1. En Vercel Dashboard
2. Project → Settings → Domains
3. Agrega tu dominio
4. Sigue instrucciones para actualizar DNS

---

## Resolución de Problemas

### Error: "Build failed"
- Verifica que `vercel.json` esté correcto
- Verifica que no haya errores en JavaScript
- Mira los logs en Vercel Dashboard

### Error: "Firebase not found"
- Asegúrate de que `js/firebase-config.js` está correcto
- Verifica que Firebase config tenga los datos correctos

### PayPal no funciona en Vercel
- Verifica que `paypalClientId` esté en `firebase-config.js`
- Verifica que sea una URL HTTPS (Vercel es HTTPS)
- Asegúrate de que PayPal permita tu dominio

### API errors
- Verifica que `/api` carpeta existe
- Verifica que funciones tengan formato correcto
- Mira logs en Vercel Dashboard

---

## Próximos Pasos

Después de desplegar:

1. ✅ Prueba la URL en navegador
2. ✅ Verifica que PayPal funciona
3. ✅ Prueba flujo de compra completo
4. ✅ Verifica Firestore registra pedidos
5. ✅ Si todo OK, cambiar a producción

---

## Para Producción (Futuro)

Cuando estés listo:

1. **Cambiar PayPal a producción:**
   - Editar `firebase-config.js`
   - Cambiar `paypalEnv: "production"`
   - Usar Client ID de producción

2. **Usar Stripe en producción:**
   - Obtener secret key de producción
   - Configurar en Vercel variables de entorno
   - Cambiar `stripePublishableKey` a production

3. **Dominio personalizado:**
   - Agregar en Vercel Settings
   - Configurar DNS

4. **HTTPS:**
   - Vercel proporciona HTTPS automáticamente
   - No requiere configuración

---

## URL del Proyecto

Tu proyecto está en:
- **GitHub:** https://github.com/Marenco0404/fyz-store
- **Vercel:** https://fyz-store.vercel.app (después de desplegar)

---

## Monitoreo Post-Despliegue

### Logs en Vercel
1. Ve a Vercel Dashboard
2. Project → Deployments
3. Haz click en tu despliegue
4. Ve a "Functions" para ver logs

### Errores en Producción
- Los errores aparecerán en la console del navegador
- Y en los logs de Vercel
- Úsalos para debuggear

---

**¡Tu proyecto está listo para desplegar!** 🚀

El código está en GitHub y puede ser desplegado a Vercel en cualquier momento.

