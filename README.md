# 🛍️ FYZ STORE - E-Commerce Seguro y Funcional

> Tienda online con pagos Stripe y PayPal, diseño moderno y completamente segura para transacciones reales.

## 📋 Estado Actual

✅ **LISTO PARA PRODUCCIÓN**

- Hosting: Vercel (gratuito, escalable)
- Pagos: Stripe (test keys, cambia a live cuando quieras)
- Base de datos: Firebase Firestore
- Autenticación: Firebase Auth

---

## 🚀 Características

### Checkout
- ✅ Proceso de pago en 3 pasos (carrito → info → pago)
- ✅ Validación de dirección, email, teléfono
- ✅ Soporte para Stripe y PayPal
- ✅ Resumen de orden detallado
- ✅ Detección de cambios en carrito

### Seguridad
- ✅ Rate limiting (15 req/min por IP)
- ✅ Input sanitization contra XSS
- ✅ CSRF protection
- ✅ Validación en cliente y servidor
- ✅ PCI compliance (Stripe maneja tarjetas)
- ✅ HTTPS forzado
- ✅ Content Security Policy

### Productos
- ✅ Catálogo dinámico (Perfumería + Sex Shop)
- ✅ Búsqueda y filtros
- ✅ Sistema de stock
- ✅ Descuentos y promociones

### Usuario
- ✅ Autenticación con email/contraseña
- ✅ Panel de mis pedidos
- ✅ Historial de órdenes
- ✅ Guardado de datos de envío

---

## 🛠️ Instalación Local

### 1. Clonar repositorio
```bash
git clone https://github.com/Marenco0404/fyz-store.git
cd fyz-store
```

### 2. Instalar dependencias
```bash
npm install
cd functions && npm install && cd ..
```

### 3. Configurar variables de entorno
Crear `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_51Sp...
```

### 4. Ejecutar en desarrollo
```bash
# Terminal 1: Live Server (Puerto 5500)
# Terminal 2: Firebase emulator (opcional)
firebase emulators:start --import=./emulator-data
```

### 5. Abrir en navegador
```
http://localhost:5500
```

---

## 📦 Deployment en Vercel

### Opción 1: Automático (Recomendado)
1. Push a GitHub (ya está hecho)
2. Ir a https://vercel.com
3. Conectar repositorio `fyz-store`
4. Agregar variable: `STRIPE_SECRET_KEY=sk_test_...`
5. Deploy automático en cada push

### Opción 2: Manual
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 💳 Configurar Stripe

### Obtener Keys de Test
1. Ir a https://dashboard.stripe.com
2. Mode: Test (arriba derecha)
3. Developers → API keys
4. Copiar Publishable y Secret key

### Configurar en tu tienda
1. **Frontend** (`js/firebase-config.js`):
   ```javascript
   stripePublishableKey: "pk_test_51Sp..."
   ```

2. **Backend** (Vercel):
   - Ir a Dashboard → Settings → Environment Variables
   - Agregar: `STRIPE_SECRET_KEY=sk_test_...`

### Cambiar a Live (Cuando estés listo)
1. Activar Live mode en Stripe
2. Cambiar `pk_test_` a `pk_live_`
3. Cambiar `sk_test_` a `sk_live_`
4. Esperar activación de Live keys (puede tomar 24h)

---

## 🧪 Testear Pagos

### Tarjetas de Prueba
- **Éxito**: `4242 4242 4242 4242`
- **Rechazar**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- Cualquier fecha futura, cualquier CVC

### PayPal Sandbox
- Usuario: `sb-xxx@personal.example.com`
- Contraseña: password igual
- (Ve a https://sandbox.paypal.com)

---

## 📁 Estructura

```
.
├── index.html              # Página principal
├── finalizarcompra.html    # Checkout (3 pasos)
├── carrito.html            # Carrito de compras
├── login.html              # Iniciar sesión
├── registro.html           # Crear cuenta
├── mis_pedidos.html        # Historial de órdenes
├── perfumeria.html         # Catálogo perfumes
├── sexshop.html            # Catálogo sex shop
│
├── css/
│   ├── main.css            # Estilos globales
│   ├── checkout.css        # Checkout específico
│   ├── carrito.css         # Carrito
│   └── ...
│
├── js/
│   ├── firebase-config.js  # Config de Firebase + Stripe/PayPal
│   ├── checkout.js         # Lógica de checkout
│   ├── carrito.js          # Lógica de carrito
│   ├── auth.js             # Autenticación
│   ├── productos.js        # Catálogo dinámico
│   └── helpers.js          # Utilidades
│
├── api/
│   └── createPaymentIntent.js  # Serverless function Vercel
│
├── functions/              # Firebase Cloud Functions (legacy)
│   ├── index.js
│   └── package.json
│
└── SECURITY_AUDIT.md       # Auditoría de seguridad
```

---

## 🔒 Seguridad

### Protecciones Implementadas
- Input validation (email, teléfono, dirección)
- XSS prevention (sanitización)
- CSRF protection (tokens)
- Rate limiting (15 req/min)
- PCI compliance (via Stripe)
- HTTPS obligatorio
- Content Security Policy

Ver [SECURITY_AUDIT.md](SECURITY_AUDIT.md) para detalles completos.

---

## 🐛 Troubleshooting

### "CORS error" al pagar
- Verifica que Vercel se desplegó (puede tomar 1-2 min)
- Recarga la página (Cmd+Shift+R)
- Revisa la consola (F12 → Console)

### "Stripe no configurado"
- Verifica que `STRIPE_SECRET_KEY` esté en Vercel
- Revisa que `stripePublishableKey` esté en `firebase-config.js`
- Recarga el sitio

### "PayPal SDK no cargó"
- Probá en incógnito (sin extensiones)
- Desactiva AdBlock
- Revisa que el Client ID sea correcto en config

### "El pago se fue pero no veo la orden"
- Revisa Firebase Console → Firestore → colección "pedidos"
- Verifica que email se guarde correctamente
- Revisa logs de Vercel

---

## 📞 Soporte

Para preguntas sobre:
- **Stripe**: https://stripe.com/docs
- **PayPal**: https://developer.paypal.com/docs
- **Firebase**: https://firebase.google.com/docs
- **Vercel**: https://vercel.com/docs

---

## 📄 Licencia

© 2026 FYZ Store. Todos los derechos reservados.

---

## 🎯 Próximos Pasos

1. ✅ Dominio custom (compra en GoDaddy, Route53, etc)
2. ✅ Email de confirmación (SendGrid, Mailgun)
3. ✅ Admin panel mejorado
4. ✅ Reportes de ventas
5. ✅ Integración con Shopify (opcional)
6. ✅ App móvil
7. ✅ Analytics (Google Analytics, Mixpanel)

---

**Última actualización**: Enero 14, 2026
**Deploy**: https://fyz-store.vercel.app
