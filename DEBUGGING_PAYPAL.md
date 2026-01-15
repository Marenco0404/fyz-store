# 🐛 DEBUGGING PayPal - Guía Completa

## Cómo Acceder a las Herramientas de Debug

### 1. Abre la Consola del Navegador

**Chrome/Edge:** `F12` → Pestaña "Console"  
**Firefox:** `F12` → Pestaña "Consola"  
**Safari:** `Cmd+Option+I` → "Console"

### 2. Verás mensajes como estos:

```
✅ [PayPal] Módulo PayPal v2.0 cargado
✅ [Checkout] Inicializando checkout
ℹ️ [PayPal] Intento 1/3 de cargar PayPal SDK
```

---

## Comandos de Debug Disponibles

### 🔧 CheckoutDebug

**Ver Carrito**
```javascript
CheckoutDebug.carrito()

// Resultado:
[
  { id: "prod1", nombre: "Perfume X", precio: 5000, cantidad: 2, ... },
  { id: "prod2", nombre: "Gel Y", precio: 1000, cantidad: 1, ... }
]
```

**Ver Totales**
```javascript
CheckoutDebug.totales()

// Resultado:
{
  total: 11000,  // ₡11,000
  items: [ ... ]
}
```

**Ver Configuración de Pagos**
```javascript
CheckoutDebug.config()

// Resultado:
{
  paypalClientId: "AVmvQ-COQxwhMn1z2ZaINic...",
  paypalEnv: "sandbox",
  paypalCurrency: "USD",
  paypalFxRate: 520,
  stripePublishableKey: "pk_test_...",
  ...
}
```

**Ver Estado de PayPal**
```javascript
CheckoutDebug.paypal()

// Resultado:
PayPalModule {
  sdkLoaded: true,
  renderAttempts: 1,
  isProcessing: false,
  ...
}
```

---

## Comandos Rápidos: paypalTest

Si ejecutas `test-paypal.js` desde consola, tendrás también:

```javascript
paypalTest.help()      // Ver todos los comandos
paypalTest.config()    // Ver config
paypalTest.carrito()   // Ver carrito
paypalTest.totales()   // Ver totales
paypalTest.init()      // Inicializar PayPal
paypalTest.render()    // Renderizar botones
```

---

## Interpretando los Logs

### ✅ Mensajes de Éxito

```
✅ [PayPal] PayPal SDK cargado correctamente
✅ [PayPal] Botones PayPal renderizados
✅ [PayPal] Módulo PayPal listo
✅ [PayPal] Orden capturada
✅ [PayPal] Pedido guardado: TX-ABC123
```

**Significado:** Todo está funcionando bien.

### ⚠️ Advertencias

```
⚠️ [PayPal] Timeout cargando PayPal SDK (20s)
⚠️ [PayPal] Intento 2/3 de cargar PayPal SDK
⚠️ [PayPal] Usuario canceló PayPal
```

**Significado:** Algo pasó pero se está recuperando o es una acción del usuario.

### ❌ Errores

```
❌ [PayPal] FALTA: PAYPAL clientId en window.PAYMENTS_CONFIG
❌ [PayPal] Error cargando PayPal SDK: networkError
❌ [PayPal] No se pudo cargar PayPal SDK después de varios intentos
❌ [Checkout] Datos de envío incompletos
```

**Significado:** Hay un problema que debe ser arreglado.

---

## Guía de Troubleshooting

### Error: "FALTA: PAYPAL clientId"

```javascript
// Abre firebase-config.js y busca:
window.PAYMENTS_CONFIG = {
  paypalClientId: "PON_AQUI_TU_CLIENT_ID"  // ← Debe tener un valor real
}
```

**Solución:** Reemplaza con tu Client ID real.

### Error: "Timeout cargando PayPal SDK"

```javascript
// Causas comunes:
// 1. AdBlock está bloqueando el SDK
// 2. Conexión lenta
// 3. Firewall bloqueando CDN de PayPal

// Soluciones:
// 1. Desactiva AdBlock
// 2. Abre en modo incógnito
// 3. Intenta en otra red
// 4. Prueba en otro navegador
```

### Error: "Payment capture failed"

```javascript
// Verifica:
// 1. Datos de envío completos
// 2. Stock disponible
// 3. Firestore rules permiten lectura/escritura

CheckoutDebug.carrito()   // Ver si tiene items
CheckoutDebug.totales()   // Ver si total es válido
CheckoutDebug.config()    // Ver si config es válida
```

---

## Monitoreo en Tiempo Real

### Ver cada transacción

```javascript
// En consola, filtrar solo mensajes PayPal:
// Haz click derecho en consola → Filter "PayPal"

// O copia en consola:
console.log("Monitoreando PayPal...");

// Los logs aparecerán con [PayPal]
```

### Ver Firestore en tiempo real

1. Abre [Firebase Console](https://console.firebase.google.com)
2. Proyecto → Firestore Database
3. Colección "pedidos"
4. Deberías ver nuevos documentos cuando haces un pago

---

## Casos de Uso Comunes

### Caso 1: Verificar que todo está en orden

```javascript
// Ejecuta en consola:
CheckoutDebug.config()      // ✅ Ver config
CheckoutDebug.carrito()     // ✅ Ver carrito
CheckoutDebug.paypal()      // ✅ Ver PayPal
console.log("✅ Todo bien")
```

### Caso 2: Probar renderización de PayPal

```javascript
// Asume que tienes productos en carrito
await PayPalModule.renderButtons("paypal-button-container")

// Si funciona, deberías ver el botón azul de PayPal en la página
```

### Caso 3: Verificar conversión de moneda

```javascript
const cfg = CheckoutDebug.config()
const crc = 5200
const usd = crc / cfg.paypalFxRate
console.log(`${crc} CRC = $${usd} USD`)

// Output:
// 5200 CRC = 10 USD
```

### Caso 4: Debuggear un error específico

```javascript
// 1. Abre F12
// 2. Ve a Sources/Debugger
// 3. Establece breakpoint en paypal-module.js
// 4. Ejecuta la acción nuevamente
// 5. El código se pausará en el breakpoint
```

---

## Información que Necesitas Reportar si hay Problemas

Si algo no funciona, aquí está la información útil a reportar:

```javascript
// Copia y ejecuta todo esto en consola y copia el output:

console.log("=== INFORMACIÓN PARA DEBUGGING ===");
console.log("1. Configuración:");
CheckoutDebug.config();

console.log("\n2. Carrito:");
CheckoutDebug.carrito();

console.log("\n3. Totales:");
CheckoutDebug.totales();

console.log("\n4. PayPal:");
CheckoutDebug.paypal();

console.log("\n5. Usuario:");
console.log(firebase.auth().currentUser?.email || "No logueado");

console.log("\n6. Navegador:");
console.log(navigator.userAgent);

console.log("=== FIN ===");
```

---

## Herramientas Útiles en F12

| Herramienta | Uso |
|------------|-----|
| **Console** | Ver logs, ejecutar comandos JS |
| **Network** | Ver peticiones HTTP (buscar "paypal" o "api") |
| **Storage** | Ver localStorage (fyz_carrito, fyz_checkout_shipping) |
| **Sources** | Establecer breakpoints, step-through debugging |
| **Application** | Ver Firestore offline (si estuviera disponible) |

---

## Variables Globales Útiles

```javascript
// Accedibles en consola en cualquier página:

window.PAYMENTS_CONFIG    // Configuración de pagos
window.PayPalModule       // Módulo PayPal
window.CheckoutDebug      // Debug helpers
window.CheckoutSystem     // Sistema de checkout
window.auth               // Firebase Auth
window.db                 // Firestore Database
window.paypalTest         // Test helpers (si incluiste test-paypal.js)
```

---

## Próximos Pasos si Algo Falla

1. **Abre F12** en tu navegador
2. **Ve a Console**
3. **Busca errores** (líneas rojas)
4. **Copia el error completo**
5. **Verifica firebase-config.js:**
   - `paypalClientId` está configurado
   - `paypalEnv` es "sandbox"
6. **Intenta:**
   - Desactivar AdBlock
   - Abrir en incógnito
   - Limpiar caché
   - Recargar página

---

## 🎓 Tips Avanzados

### Monitorear Peticiones HTTP

```javascript
// Abre F12 → Network
// Haz una compra con PayPal
// Busca requests a:
// - www.paypal.com
// - api.paypal.com
// - Tu endpoint /api/createPaymentIntent
```

### Ver LocalStorage

```javascript
// F12 → Application → LocalStorage
// Busca:
// - fyz_carrito (el carrito)
// - fyz_checkout_shipping (datos de envío)
// - fyz_confirmacion_pago (confirmación después de pagar)
```

### Limpiar Cache y LocalStorage

```javascript
// En consola:
localStorage.clear()       // Limpiar TODO
localStorage.removeItem("fyz_carrito")  // Solo carrito
location.reload()          // Recargar
```

---

**¡Con estas herramientas puedes debuggear y arreglar cualquier problema!** 🎉

