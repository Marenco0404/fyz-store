# ✅ CHECKLIST - PayPal v2.0 Setup

## 📋 Antes de Empezar

- [ ] **Backup creado** (`js/checkout-BACKUP.js` existe)
- [ ] **Node version actual:** (opcional, solo si usas Vercel)
- [ ] **Firebase Firestore activado** (en Firebase Console)

---

## 🔧 Configuración (REQUERIDO)

### 1. Obtener Credenciales de PayPal
- [ ] Ir a https://developer.paypal.com
- [ ] Navegar a **Apps & Credentials**
- [ ] Seleccionar **Sandbox**
- [ ] **Copiar Client ID** (formato: AVmvQ-COQxwh...)

### 2. Actualizar firebase-config.js
- [ ] Abrir `js/firebase-config.js`
- [ ] Buscar `window.PAYMENTS_CONFIG`
- [ ] Encontrar `paypalClientId: "PON_AQUI_TU_CLIENT_ID"`
- [ ] **Reemplazar** con tu Client ID copiado
- [ ] Verificar que `paypalEnv: "sandbox"`
- [ ] **Guardar archivo**

### 3. Verificar Archivos Están en Lugar
- [ ] `js/paypal-module.js` existe
- [ ] `js/checkout.js` fue actualizado (251 líneas, no 946)
- [ ] `finalizarcompra.html` incluye `paypal-module.js`

---

## 🧪 Verificación (IMPORTANTE)

### En la Consola del Navegador (F12)

#### Verificación 1: Config
```javascript
CheckoutDebug.config()
```
- [ ] `paypalClientId` muestra tu Client ID (no "PON_AQUI")
- [ ] `paypalEnv` es `"sandbox"`
- [ ] `paypalFxRate` es `520` (o tu valor)

#### Verificación 2: PayPal Module
```javascript
CheckoutDebug.paypal()
```
- [ ] Muestra un objeto `PayPalModule`
- [ ] `sdkLoaded` es `true` o `false` (ambos OK en este punto)

#### Verificación 3: Carrito
```javascript
CheckoutDebug.carrito()
```
- [ ] Muestra un array `[]` (vacío está bien por ahora)

---

## 🎯 Prueba Completa (OPCIONAL pero RECOMENDADO)

### Paso 1: Agregar Producto
- [ ] Ve a `perfumeria.html` o `sexshop.html`
- [ ] Haz clic en un producto
- [ ] Haz clic en "Agregar al Carrito"
- [ ] Verás notificación "Agregado"

### Paso 2: Ir a Checkout
- [ ] Haz clic en carrito (esquina superior derecha)
- [ ] Haz clic en "Pagar" o "Finalizar Compra"
- [ ] Deberías ir a `finalizarcompra.html`

### Paso 3: Ver Resumen
- [ ] ✅ Deberías ver:
  - Producto agregado
  - Total en CRC (₡)
  - Equivalente en USD ($)
  - Botón "Continuar a Pago"

### Paso 4: Completar Envío
- [ ] Ingresa email válido
- [ ] Ingresa teléfono (8+ dígitos)
- [ ] Ingresa dirección
- [ ] Selecciona país (CR)
- [ ] ✅ Haz clic en "Continuar a Pago"

### Paso 5: Seleccionar PayPal
- [ ] Deberías ver opciones de pago
- [ ] Selecciona "PayPal"
- [ ] ✅ Deberías ver botón azul de PayPal

### Paso 6: Hacer Pago
- [ ] Haz clic en botón azul de PayPal
- [ ] ✅ Se abre ventana de PayPal
- [ ] Inicia sesión con cuenta Business de Sandbox
- [ ] Aprueba el pago

### Paso 7: Confirmación
- [ ] ✅ Serás redirigido a `confirmacion.html`
- [ ] Deberías ver "¡Gracias por tu compra!"
- [ ] Verás número de pedido

---

## 🔍 Validación Post-Pago

### En Consola
```javascript
// Después de hacer un pago, ejecuta:
CheckoutDebug.carrito()
// Deberías ver: [] (vacío, fue limpiado)
```

### En Firebase Console
- [ ] Ve a [Firebase Console](https://console.firebase.google.com)
- [ ] Proyecto: fyzperfumeria
- [ ] Firestore Database
- [ ] Colección: **pedidos**
- [ ] ✅ Deberías ver un documento nuevo con:
  - `metodoPago: "paypal"`
  - `estado: "pago_completado"`
  - `totalCRC`: tu total
  - `totalUSD`: convertido

---

## ⚠️ Si Algo Falla

### Error: "No se pudo cargar PayPal"
- [ ] Desactiva **AdBlock**
- [ ] Abre en **Modo Incógnito**
- [ ] Limpia **Caché** (Ctrl+Shift+Del)
- [ ] Recarga (F5)
- [ ] Intenta en **otro navegador**

### Error: "Datos de envío incompletos"
- [ ] Completa **TODOS** los campos
- [ ] Especialmente **email** y **teléfono**
- [ ] Teléfono debe tener **mínimo 8 dígitos**
- [ ] Email debe ser válido (nombre@dominio.ext)

### Error: "Stock insuficiente"
- [ ] Reduce la **cantidad** de productos
- [ ] O agrega **otros productos** más
- [ ] Verifica en Firebase que el stock > 0

### Botón PayPal no aparece
- [ ] Abre **F12**
- [ ] Busca errores en **Console**
- [ ] Verifica que:
  - Datos de envío estén completos
  - Carrito no esté vacío
  - No haya errores rojos en consola

---

## 📚 Documentación de Referencia

- [ ] Leído [PAYPAL_QUICK_START.md](PAYPAL_QUICK_START.md)
- [ ] Leído [PAYPAL_SETUP_GUIDE.md](PAYPAL_SETUP_GUIDE.md)
- [ ] Leído [DEBUGGING_PAYPAL.md](DEBUGGING_PAYPAL.md)
- [ ] Leído [INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)

---

## 🎉 Finalización

- [ ] Todo verificado en consola
- [ ] Prueba completa exitosa
- [ ] Pedido visible en Firestore
- [ ] Documentación leída

---

## 🚀 Próximos Pasos (FUTURO)

Cuando estés listo para producción:
- [ ] Cambiar `paypalEnv: "production"`
- [ ] Obtener Client ID de producción en PayPal
- [ ] Reemplazar con Client ID de producción
- [ ] Hacer pruebas de pago real
- [ ] Monitorear Firestore

---

## 💡 Tips

1. **Guarda este checklist** para referencia
2. **Usa F12 frecuentemente** para verificar logs
3. **Lee DEBUGGING_PAYPAL.md** si tienes dudas
4. **No editees other archivos** además de `firebase-config.js`
5. **Siempre ten un backup** (ya está en `js/checkout-BACKUP.js`)

---

## ❓ Preguntas Comunes

**¿Debo editar otros archivos?**
No, solo `firebase-config.js`

**¿Qué pasa si tengo el código viejo?**
Está en `js/checkout-BACKUP.js`, pero no lo necesitas

**¿Es seguro reemplazar checkout.js?**
Sí, es un reemplazo seguro. El backup está guardado.

**¿Puedo volver atrás?**
Sí, copia `checkout-BACKUP.js` sobre `checkout.js`

**¿Necesito Stripe?**
No (solo PayPal está implementado actualmente)

---

## ✅ Estado Final

**Si completaste TODO el checklist:**
- ✅ PayPal está 100% configurado
- ✅ Estás listo para aceptar pagos
- ✅ Todo funciona correctamente

**¡Felicidades! 🎉**

---

**Versión:** PayPal v2.0
**Fecha:** 14 de Enero de 2026
**Estado:** ✅ Listo para Usar
