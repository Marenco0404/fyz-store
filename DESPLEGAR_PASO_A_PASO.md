# 📸 GUÍA VISUAL - Desplegar a Vercel en 5 Pasos

## ✅ Estado Actual

Tu proyecto está:
- ✅ En GitHub (`main` branch)
- ✅ Completamente actualizado
- ✅ Listo para desplegar
- ✅ Sincronizado y seguro

## 🚀 Despliegue en 5 Pasos

### PASO 1: Ir a Vercel Dashboard
```
1. Abre: https://vercel.com/dashboard
2. Inicia sesión si es necesario
3. Verás tu "Projects Dashboard"
```

### PASO 2: Importar Proyecto
```
1. Click en botón azul "Add New"
2. Selecciona: "Project"
3. Selecciona: "Import Git Repository"
```

### PASO 3: Seleccionar Repositorio
```
1. Busca: "fyz-store"
2. Click en tu repositorio
3. Click en: "Import"
```

### PASO 4: Configurar (Opcional)
```
Vercel te mostrará una pantalla de configuración:

Project Name: fyz-store (ya está)
Build Command: (dejar en blanco)
Output Directory: (dejar en blanco)
Environment Variables: (dejar en blanco, o agregar si tienes Stripe key)

Simplemente: Click "Deploy"
```

### PASO 5: Esperar y Celebrar 🎉
```
Tiempo: 2-3 minutos
Vercel estará:
  ✓ Clonando tu repositorio
  ✓ Instalando dependencias
  ✓ Compilando (si es necesario)
  ✓ Desplegando
```

## 📍 Resultado Final

Después de desplegar, tendrás:

```
URL: https://fyz-store.vercel.app
HTTPS: ✅ Automático
Dominio: Puedes cambiarlo después en Settings
```

## ✨ Después del Despliegue

### Prueba 1: Abre el sitio
```
Abre: https://fyz-store.vercel.app
Deberías ver tu tienda funcionando
```

### Prueba 2: Verifica PayPal
```
1. En el navegador, abre F12
2. Ve a Console
3. Ejecuta: CheckoutDebug.config()
4. Deberías ver tu configuración de PayPal
```

### Prueba 3: Prueba flujo de compra
```
1. Agrega un producto al carrito
2. Ve a checkout
3. Completa datos de envío
4. Selecciona PayPal
5. Haz clic en botón de PayPal
```

### Prueba 4: Verifica Firestore
```
1. Abre: https://console.firebase.google.com
2. Proyecto: fyzperfumeria
3. Firestore → pedidos
4. Deberías ver los pedidos de prueba
```

## 🎯 ¿Qué Significa Cada URL?

| URL | Significado |
|-----|------------|
| `https://fyz-store.vercel.app` | Tu sitio en Vercel |
| `/api/createPaymentIntent` | API de pagos (automática) |
| Vercel logs | Panel de control, Deployments → Logs |

## 🔒 Seguridad

Vercel proporciona automáticamente:
- ✅ HTTPS (certificado SSL)
- ✅ CDN global
- ✅ DDoS protection
- ✅ Ambiente seguro para variables

## 📊 Monitoreo

### En Vercel Dashboard
```
1. Ve a tu proyecto
2. Pestaña "Deployments"
3. Verás historial de deployments
4. Cada uno tiene un ID único
```

### Logs
```
1. Click en un deployment
2. Verás logs en tiempo real
3. Cualquier error aparecerá aquí
```

## 🐛 Si Algo Falla

### Error: "Build failed"
```
1. Mira los logs en Vercel
2. Busca la línea con ERROR
3. Lee DEPLOY_A_VERCEL.md para soluciones
```

### Error: "Firebase not found"
```
1. Verifica firebase-config.js existe
2. Verifica las credenciales son correctas
3. Redeployer desde Vercel Dashboard
```

### PayPal no funciona
```
1. Abre F12 en navegador
2. Mira console para errores
3. Verifica paypalClientId es correcto
4. Lee DEBUGGING_PAYPAL.md
```

## ⏱️ Timeline

```
TIEMPO          ACCIÓN
─────────────────────────────────────
00:00           Haces click "Deploy"
00:10           Vercel clona repositorio
00:30           Instala dependencias
00:45           Compila proyecto
01:30           Despliega a servidor
02:00           Propagación global (CDN)
03:00           ✅ Sitio completamente online
```

## 🎁 Bonos

### Dominio Personalizado (después)
```
1. En Vercel, ve a Settings
2. Domains
3. Agrega tu dominio
4. Sigue instrucciones para DNS
5. En 5-10 minutos estará activo
```

### Variables de Entorno (si las necesitas)
```
1. En Vercel, Settings → Environment Variables
2. Agrega tus variables (ej: STRIPE_SECRET_KEY)
3. Redeployer
4. Las variables estarán disponibles
```

### Rollback (si algo falla)
```
1. En Deployments
2. Selecciona un deployment anterior
3. Click "Redeploy"
4. ¡Listo! Vuelves a la versión anterior
```

## ✅ Checklist Final

Antes de desplegar:
- [ ] Leí esta guía
- [ ] Tengo acceso a https://vercel.com/dashboard
- [ ] Mi repositorio está sincronizado en GitHub

Durante el despliegue:
- [ ] Hago click en "Deploy"
- [ ] Espero 2-3 minutos
- [ ] Vercel me da una URL

Después del despliegue:
- [ ] Pruebo abrir la URL
- [ ] Pruebo PayPal funciona
- [ ] Pruebo flujo de compra

## 🎉 ¡Listo!

Si seguiste todos estos pasos, tu sitio está online en:
```
https://fyz-store.vercel.app
```

¡Felicidades! 🎊

---

**Para preguntas, lee:**
- [DEPLOY_A_VERCEL.md](DEPLOY_A_VERCEL.md) - Guía técnica
- [RESUMEN_FINAL_COMPLETO.md](RESUMEN_FINAL_COMPLETO.md) - Resumen ejecutivo
- [DEBUGGING_PAYPAL.md](DEBUGGING_PAYPAL.md) - Si hay problemas con PayPal

