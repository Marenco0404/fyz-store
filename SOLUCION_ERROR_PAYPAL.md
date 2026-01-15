# 🔍 Guía Detallada: Solucionar Error PayPal

## ⚠️ Error: "No se pudo cargar PayPal"

Este documento te guía paso a paso para identificar y solucionar el problema.

---

## 📋 Paso 1: Limpiar Cache (MUY IMPORTANTE)

El 90% de los problemas se debe a cache viejo del navegador.

### Windows:
1. **Ctrl + Shift + Delete**
2. Selecciona:
   - ✅ Todas las fechas
   - ✅ Cookies y otros datos de sitios web
   - ✅ Archivos en caché
3. Click **Limpiar datos**
4. Recarga la página

### Mac:
1. **Cmd + Shift + Delete**
2. Sigue los mismos pasos

### En modo incógnito (alternativa rápida):
- Windows: **Ctrl + Shift + N**
- Mac: **Cmd + Shift + N**
- Abre: `https://fyz-store.vercel.app/finalizarcompra.html`

---

## 🧪 Paso 2: Usar la Página de Diagnóstico

Abre esta URL en tu navegador:
```
https://fyz-store.vercel.app/diagnostico-paypal.html
```

**Qué esperar:**
- ✅ Todos deben estar verdes (success)
- ❌ Si algo está rojo (error) → problema identificado
- ⚠️ Si algo está naranja (warning) → puede ser normal

**Casos comunes:**

| Estado | Significa | Solución |
|--------|-----------|----------|
| ❌ Firebase SDK | Firebase no cargó | Recarga la página |
| ❌ PayPal Client ID | Configuración faltante | Revisar firebase-config.js |
| ⚠️ PayPal SDK | Aún no cargado (normal) | Hacer click "Probar Carga SDK" |
| ⚠️ AdBlock Detectado | Bloqueador activo | Desactiva AdBlock |
| ❌ Sin conexión | Sin internet | Verifica tu conexión |

---

## 🔧 Paso 3: Test Aislado

Si el diagnóstico muestra problemas, usa esta página:
```
https://fyz-store.vercel.app/test-aislado.html
```

**Haz los pasos EN ORDEN:**

1. **PASO 1: Verificar Config**
   - Debería mostrar ClientID, Environment, etc.
   - Si falta algo → **Problema en firebase-config.js**

2. **PASO 2: Inicializar Módulo**
   - Debería retornar TRUE
   - Si es FALSE → **Problema en la inicialización**

3. **PASO 3: Cargar SDK**
   - Espera 20 segundos máximo
   - Si falla:
     - ❌ Sin internet
     - ❌ AdBlock bloqueando
     - ❌ Firewall corporativo

4. **PASO 4: Verificar Global**
   - Debería mostrar `window.paypal` disponible
   - Si no → No se cargó el SDK (revisar Paso 3)

---

## 🛠️ Soluciones Específicas

### 1️⃣ "No se pudo cargar PayPal SDK" (CORS Error)

**Causas:**
- AdBlock está bloqueando PayPal
- Firewall corporativo
- DNS spoofing

**Soluciones:**
```
a) Desactiva AdBlock
   - Click derecho → Deshabilitar en este sitio
   - O usa modo incógnito

b) Si es en empresa:
   - Intenta en tu casa
   - O contacta IT

c) Prueba con otro navegador:
   - Chrome
   - Firefox
   - Edge
```

### 2️⃣ "PAYMENTS_CONFIG no está disponible"

**Causa:** `firebase-config.js` no cargó correctamente

**Verificación (en Console, F12):**
```javascript
// Abre F12 → Console
window.PAYMENTS_CONFIG

// Si muestra undefined → Problema
// Si muestra objeto con paypalClientId → Ok
```

**Solución:**
- Revisa la carga de firebase-config.js en finalizarcompra.html
- Verificar que `<script src="js/firebase-config.js"></script>` está ANTES que paypal-module.js

### 3️⃣ "TypeError: Cannot read property 'init'"

**Causa:** PayPalModule no se cargó

**Verificación (en Console):**
```javascript
window.PayPalModule // Debe estar definido
typeof window.PayPalModule.init // Debe ser 'function'
```

**Solución:**
- Verificar que paypal-module.js está en js/
- Revisar la sintaxis (¿hay errores en el archivo?)

### 4️⃣ "AdBlock Error"

**Solución:**
```
1. Click icono AdBlock (arriba a la derecha)
2. Click "No ejecutar en esta página"
3. Recarga la página
```

**O usa modo incógnito:**
- Windows: Ctrl + Shift + N
- AdBlock no funciona en modo incógnito

### 5️⃣ Botones PayPal se renderizan pero sin hacer nada

**Causa:** Problema en el carrito o Firebase

**Verificación (en Console):**
```javascript
// Verificar carrito
CheckoutDebug.carrito()
// Debería mostrar al menos 1 producto

// Verificar totales
CheckoutDebug.totales()
// Debería mostrar un total > 0

// Verificar Firebase
window.db  // Debe estar definido
window.auth // Debe estar definido
```

---

## 🐛 Debug Avanzado

### Abre Developer Tools (F12)

**1. Pestaña Console:**
```javascript
// Ejecuta estos comandos:
CheckoutDebug.config()      // Config de PayPal
CheckoutDebug.carrito()     // Productos en carrito
CheckoutDebug.totales()     // Monto a pagar
CheckoutDebug.paypal()      // Objeto PayPalModule
```

**2. Pestaña Network:**
- Abre DevTools ANTES de hacer cualquier acción
- Mira qué scripts no cargaron (rojo)
- Busca: `sdk?client-id=` → esto debe estar en verde

**3. Pestaña Console - Busca errores:**
- Rojo = error crítico
- Amarillo = warning (puede ser ok)
- Azul = información

### Errores Comunes en Console:

```
❌ "Cannot find variable firebase"
→ Los CDN de Firebase no cargaron

❌ "Error 401 Unauthorized"
→ Client ID inválido o expirado

❌ "CSP violation"
→ Política de seguridad bloqueando scripts

❌ "CORS error"
→ Problema de cross-origin (AdBlock probablemente)
```

---

## ✅ Checklist de Verificación

Marca todos los ✅ antes de usar PayPal:

- [ ] Caché limpiado (Ctrl+Shift+Delete)
- [ ] Sin AdBlock o AdBlock desactivado en el sitio
- [ ] Conectado a internet
- [ ] Navegador actualizado (Chrome 90+, Firefox 88+)
- [ ] Abrir F12 → Console sin errores rojos
- [ ] `window.PAYMENTS_CONFIG` está disponible
- [ ] `window.PayPalModule` está disponible
- [ ] `window.paypal` está disponible (después de init)
- [ ] Carrito tiene al menos 1 producto
- [ ] Monto total > $0.10 USD

---

## 📞 Si Nada Funciona

Si completaste todos los pasos y sigue sin funcionar:

1. **Captura de pantalla:**
   - F12 → Console
   - Todos los errores visibles

2. **Exporta el log:**
   - En test-aislado.html → ejecuta los 4 pasos
   - Captura screenshot

3. **Reporta con:**
   - Navegador + versión (ej: Chrome 120)
   - Sistema operativo (Windows/Mac/Linux)
   - Error exacto del console
   - URL donde ocurre

---

## 🚀 Para Recuperación Rápida

**Si está en Vercel y algo falla:**

1. Ir a [Vercel Dashboard](https://vercel.com)
2. Proyecto: fyz-store
3. Deployments
4. Busca el último deployment
5. Click "Redeploy"
6. Espera 2-3 minutos
7. Limpia caché del navegador

**O:**
```bash
# Desde tu máquina local:
git push origin main
# Vercel auto-redeploy en ~30s
```

---

## 📊 Diagrama de Flujo

```
¿Cargar página?
    ↓
¿Cache viejo? → SÍ → Ctrl+Shift+Delete → Recarga
    ↓ NO
¿PAYMENTS_CONFIG disponible?
    ↓ NO → Problema en firebase-config.js
    ↓ SÍ
¿PayPalModule.init() retorna TRUE?
    ↓ NO → ¿AdBlock? SÍ → Desactivar
    ↓ SÍ    ↓ NO → Recarga y reintentar
¿window.paypal disponible?
    ↓ NO → Esperar 20s o recarga
    ↓ SÍ
¿Botones se renderizan?
    ↓ NO → Revisar carrito/firebase
    ↓ SÍ
✅ LISTO - ¡A pagar!
```

---

**Última actualización:** 14 de Enero, 2026  
**Versión:** PayPal v2.0
