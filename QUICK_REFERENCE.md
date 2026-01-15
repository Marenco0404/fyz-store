# 📚 GUÍA RÁPIDA - F&Z Store Checkout

## Estado actual
✅ Aplicación funciona en localhost:5500
✅ Firebase configurado
✅ Stripe integrado (cliente + server)
✅ PayPal integrado
✅ CORS configurado en Cloud Functions
✅ Listo para producción

## Estructura del proyecto

```
fyz_checkout_integrado_abajo/
├── index.html                      # Página inicio
├── finalizarcompra.html           # Checkout
├── confirmacion.html              # Confirmación pago
├── carrito.html                   # Carrito
├── css/
│   ├── main.css
│   ├── checkout.css
│   └── ...
├── js/
│   ├── firebase-config.js         # ⚙️ Configuración Firebase + Stripe + PayPal
│   ├── checkout.js                # ⚙️ Lógica de checkout
│   ├── auth.js
│   ├── carrito.js
│   └── ...
├── functions/
│   ├── index.js                   # ⚙️ Cloud Functions (Stripe PaymentIntent)
│   └── package.json
├── firebase.json                  # ⚙️ Configuración Firebase (Functions + Hosting)
├── .firebaserc                    # ⚙️ Proyecto Firebase
├── .gitignore
├── DEPLOYMENT.md                  # Instrucciones detalladas
└── DEPLOY_STEPS.txt              # Pasos rápidos

⚙️ = Archivos que NO deben cambiar para despliegue
```

## 🔑 Claves configuradas

### Cliente (js/firebase-config.js)
- ✅ Firebase API Key
- ✅ Firebase Auth Domain  
- ✅ Stripe Publishable Key (pk_test_...)
- ✅ PayPal Client ID
- ✅ USD/CRC Exchange Rate (520)

### Servidor (Cloud Functions)
- ✅ Stripe Secret Key (sk_test_...)
- ✅ CORS headers
- ✅ Payment Intent creation

## 🚀 Despliegue: Paso a paso

```
1. npm install -g firebase-tools
2. firebase login
3. cd functions && npm install && cd ..
4. firebase functions:config:set stripe.secret="sk_test_..."
5. firebase deploy
6. Accedé a: https://fyzperfumeria.web.app
```

## 🧪 Testear en desarrollo

**Servidor local:**
```bash
# Terminal 1: Servidor web (si usas Live Server)
# Abre: http://localhost:5500/finalizarcompra.html

# Terminal 2: Firebase emulators (opcional)
firebase emulators:start --only functions
```

**Tarjeta de prueba Stripe:**
- `4242 4242 4242 4242`
- Cualquier fecha futura
- CVC: `123`
- Nombre: cualquiera

## 📊 Flujo de pago

```
Cliente (HTML/JS)
    ↓
    → Valida shipping ✓
    → Lee carrito ✓
    → Calcula total en USD ✓
    ↓
    → Llama: POST /createPaymentIntent
              (amountCents, items, totalCRC, fxRate)
    ↓
Cloud Functions (Node.js/Stripe)
    ↓
    → Recibe amount en centavos USD
    → Crea Stripe PaymentIntent
    → Retorna: { clientSecret }
    ↓
Cliente (Stripe.js)
    ↓
    → Confirma pago con tarjeta + clientSecret
    → Retorna: { paymentIntent.id, status }
    ↓
    → Si éxito: registra pedido en Firestore
    → Descontar stock
    → Limpiar carrito
    → Redirige a confirmación.html
```

## 🔐 Seguridad

✅ CORS habilitado solo para solicitudes legítimas
✅ Cloud Functions validan monto mínimo
✅ Stripe Secret Key solo en servidor (nunca en cliente)
✅ Stock se descuenta con transacciones Firestore
✅ Pedidos se registran en Firestore autenticado

## 📱 URLs importantes

**Desarrollo:**
- Web: http://localhost:5500
- Functions: https://us-central1-fyzperfumeria.cloudfunctions.net/createPaymentIntent

**Producción:**
- Web: https://fyzperfumeria.web.app
- Functions: https://us-central1-fyzperfumeria.cloudfunctions.net/createPaymentIntent
- Console: https://console.firebase.google.com/project/fyzperfumeria

## ⚠️ Cambios necesarios para producción

- [ ] Activar Stripe Live Keys (cuando estés listo)
- [ ] Configurar PayPal Production (cuando estés listo)
- [ ] Activar Firestore Security Rules
- [ ] Configurar dominio personalizado (opcional)
- [ ] Habilitar Google Authentication (si lo necesitas)

## 🐛 Debugging

**Ver logs de functions:**
```bash
firebase functions:log
```

**Ver configuración:**
```bash
firebase functions:config:get
```

**Browser DevTools (F12):**
- Console: Ve logs de checkout.js
- Network: Ve request a createPaymentIntent
- Application: LocalStorage con carrito y confirmación

## 📞 Soporte

Si algo falla en producción:
1. Revisa los logs: `firebase functions:log`
2. Verifica que Stripe keys sean correctas
3. Comprueba que CORS headers se envíen
4. Revisá que el dominio esté registrado en Stripe/PayPal
