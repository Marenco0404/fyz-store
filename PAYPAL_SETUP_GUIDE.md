# PayPal v2.0 - Configuración y Uso

## 📋 Resumen de Cambios

Se ha **reprogramado completamente** el sistema de integración de PayPal con las siguientes mejoras:

### ✅ Mejoras Implementadas

1. **Módulo PayPal Independiente** (`js/paypal-module.js`)
   - Código modular y reutilizable
   - Manejo robusto de errores y reintentos
   - Carga dinámica del SDK con timeout y fallback
   - Validaciones de seguridad en servidor

2. **Checkout Simplificado** (`js/checkout.js`)
   - Código más limpio y mantenible
   - Separación de responsabilidades
   - Mejor manejo de estados

3. **Características de Seguridad**
   - Validación de carrito y stock
   - Sanitización de datos de entrada
   - Rate limiting en API
   - Verificación de integridad de montos

## 🔧 Configuración Requerida

### 1. **PayPal Sandbox Setup**

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com)
2. En **Apps & Credentials** → **Sandbox**, copia tu **Client ID**
3. En `js/firebase-config.js`, actualiza:

```javascript
window.PAYMENTS_CONFIG = {
  paypalClientId: "TU_CLIENT_ID_AQUI",  // ← Reemplaza con tu Client ID
  paypalEnv: "sandbox",                  // ← "sandbox" o "production"
  paypalCurrency: "USD",
  paypalFxRate: 520                      // ← Tipo de cambio CRC -> USD
};
```

### 2. **Verificar Credenciales**

Activa los siguientes permisos en tu app PayPal Sandbox:
- ✅ Accept payments / Checkout / Payment capture

## 🧪 Cómo Probar

### Método 1: Prueba Rápida en el Navegador

1. Abre la consola (F12)
2. Usa los comandos de debug:

```javascript
// Ver carrito
CheckoutDebug.carrito()

// Ver totales
CheckoutDebug.totales()

// Ver configuración de PayPal
CheckoutDebug.config()

// Verificar módulo PayPal
CheckoutDebug.paypal()
```

### Método 2: Flujo Completo

1. **Agregar productos al carrito**
   - Ve a Perfumería o Sex Shop
   - Agregá algunos productos

2. **Ir a checkout**
   - Abre `finalizarcompra.html`
   - Deberías ver el resumen

3. **Completar envío**
   - Ingresá datos de envío válidos
   - Haz clic en "Continuar a Pago"

4. **Pagar con PayPal**
   - Selecciona "PayPal" como método
   - Deberías ver el botón de PayPal
   - Haz clic en el botón

5. **En Sandbox PayPal**
   - Inicia sesión con cuenta **Business** de sandbox
   - Confirma el pago

6. **Confirmación**
   - Deberías ser redirigido a `confirmacion.html`
   - El pedido debe estar en Firestore

## 📊 Tipo de Cambio

El sistema convierte **CRC (colones)** → **USD (dólares)** usando:

```
Tipo de Cambio = 520 CRC por 1 USD (configurable)

Ejemplo:
- Carrito: ₡5200
- En USD: $10.00 (5200 ÷ 520)
```

Para cambiar el tipo, edita `firebase-config.js`:

```javascript
paypalFxRate: 550  // ← Nuevo tipo de cambio
```

## 🐛 Troubleshooting

### "No se pudo cargar PayPal"

**Soluciones:**
1. ❌ Desactiva **AdBlock** o extensiones bloqueadoras
2. ❌ Abre en **modo incógnito**
3. ❌ Limpia **caché** del navegador
4. ❌ Recarga la página
5. ❌ Intenta en otro navegador

### "SDK no disponible"

**Causas:**
- Conectividad Internet lenta
- Firewall/proxy bloqueando CDN de PayPal
- Cliente ID incorrecto

**Soluciones:**
- Verifica consola (F12) para ver errores específicos
- Asegúrate que `paypalClientId` sea correcto en `firebase-config.js`

### "Payment capture failed"

**Posibles causas:**
- Datos de envío incompletos
- Stock insuficiente
- Firestore reglas demasiado restrictivas

**Soluciones:**
- Verifica que todos los campos de envío estén completos
- Revisa stock de productos
- Verifica reglas de Firestore en Firebase Console

## 📝 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `js/paypal-module.js` | Módulo PayPal v2.0 (nuevo) |
| `js/checkout.js` | Sistema de checkout (actualizado) |
| `js/firebase-config.js` | Configuración de pagos |
| `finalizarcompra.html` | Página de checkout |
| `js/checkout-BACKUP.js` | Backup del checkout original |

## 🔐 Seguridad

### En Cliente (navegador)
- ✅ Solo se usa `paypalClientId` (información pública)
- ✅ Validación de inputs
- ✅ Sanitización de datos

### En Servidor (Vercel)
- ✅ `STRIPE_SECRET_KEY` protegida en variables de entorno
- ✅ Rate limiting
- ✅ Validación de integridad de montos

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola** (F12 → Console) para errores
2. **Ve a Firebase Console** → Firestore → Collections → pedidos
3. **Verifica credenciales** en `firebase-config.js`
4. **Prueba en incógnito** para descartar caché

## ✨ Próximos Pasos

1. ✅ Cambiar a **paypalEnv: "production"** cuando estés listo
2. ✅ Actualizar a **Client ID de producción**
3. ✅ Cambiar **tipo de cambio** si es necesario
4. ✅ Probar flujo completo en producción

---

**Versión:** PayPal v2.0
**Última actualización:** Enero 2026
