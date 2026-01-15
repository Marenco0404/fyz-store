# 🚀 INICIO RÁPIDO - PayPal v2.0

## ⚡ 3 Pasos para Empezar

### 1. Obtén tu Client ID

- Ve a https://developer.paypal.com
- Apps & Credentials → Sandbox
- Copia tu **Client ID**

### 2. Actualiza firebase-config.js

Busca esta sección:
```javascript
window.PAYMENTS_CONFIG = {
  // ...
  paypalClientId: "PON_AQUI_TU_CLIENT_ID",  // ← REEMPLAZA ESTO
  // ...
};
```

### 3. Prueba en Consola

```javascript
// Abre F12 en cualquier página y ejecuta:
CheckoutDebug.config()

// Deberías ver:
// ✅ paypalClientId (tu ID)
// ✅ paypalEnv: "sandbox"
```

---

## ✅ Verificación Rápida

| Paso | Comando | Resultado Esperado |
|------|---------|-------------------|
| 1 | `CheckoutDebug.config()` | Ver `paypalClientId` |
| 2 | `CheckoutDebug.carrito()` | Ver array de productos |
| 3 | `CheckoutDebug.totales()` | Ver `{ total: X, items: [...] }` |
| 4 | `CheckoutDebug.paypal()` | Ver `PayPalModule` object |

---

## 🧪 Prueba Completa (5 min)

```
1. Agregar producto → Perfumería → agregar un perfume
2. Ir a Checkout → click en "Finalizar Compra"
3. Completar Envío → rellenar formulario → "Continuar a Pago"
4. Seleccionar PayPal → Deberías ver botón azul
5. Click en botón → Sandbox PayPal → Confirmar
6. Confirmación → Página de "Gracias por tu compra"
```

---

## ❓ Problemas Comunes

**"No se pudo cargar PayPal"**
→ Desactiva AdBlock, abre en incógnito

**"Botón no aparece"**
→ Revisa consola (F12) para errores

**"Payment failed"**
→ Completa todos los campos de envío

---

## 📚 Más Información

- [PAYPAL_SETUP_GUIDE.md](PAYPAL_SETUP_GUIDE.md) - Guía completa
- [CAMBIOS_PAYPAL_V2.md](CAMBIOS_PAYPAL_V2.md) - Cambios detallados  
- [PAYPAL_RESUMEN_FINAL.md](PAYPAL_RESUMEN_FINAL.md) - Resumen completo
- [test-paypal.js](test-paypal.js) - Script de verificación

---

**Estado:** ✅ **Listo para Usar**
