# Pagos (PayPal + Stripe) — F&Z Store

## Resumen
- La tienda trabaja **en colones (CRC)** en todo el flujo (carrito, UI, Firestore).
- Al pagar, el total se **convierte a USD** usando `PAYMENTS_CONFIG.paypalFxRate` y se cobra en USD.
- PayPal se ejecuta **client-side** con el SDK de PayPal.
- Stripe se ejecuta con **Stripe Elements + PaymentIntent** creado en **Firebase Cloud Functions** (no se expone la llave secreta en el navegador).

---

## 1) Configurar PayPal (Sandbox)
1. PayPal Developer Dashboard → **Apps & Credentials** → **Sandbox**
2. Copiá tu **Client ID** y ponelo en `js/firebase-config.js`:
   - `PAYMENTS_CONFIG.paypalClientId`
   - `PAYMENTS_CONFIG.paypalEnv = "sandbox"`
3. Para ver transacciones: Dashboard → **Sandbox → Accounts** → abrir cuenta **Business** → Activity.

> Si te sale `Missing or insufficient permissions`: en tu App Sandbox activá **Accept payments / Checkout / Payment capture**.

---

## 2) Configurar Stripe (TEST)
### A) Publishable Key (frontend)
En `js/firebase-config.js`:
- `PAYMENTS_CONFIG.stripePublishableKey = "pk_test_..."`

### B) Secret Key (backend — Firebase Functions)
1. Entrá a la carpeta `functions/` y ejecutá:
   - `npm install`
2. Guardá tu secret key en config:
   - `firebase functions:config:set stripe.secret="sk_test_..."`

3. Deploy:
   - `firebase deploy --only functions`

> Por defecto la Function se despliega en `us-central1`. Si usás otra región, cambiá `PAYMENTS_CONFIG.functionsRegion`.

### C) Probar tarjetas (Stripe test)
Usá una tarjeta de test típica:
- `4242 4242 4242 4242` (cualquier fecha futura, CVC cualquiera)

---

## 3) Emulador (opcional)
- `firebase emulators:start --only functions`

En ese caso, si querés apuntar a emulador, habría que ajustar `_functionsUrl` para localhost (no viene activado por defecto).
