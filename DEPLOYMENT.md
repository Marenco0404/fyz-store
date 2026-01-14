# F&Z Store - Checkout Integrado

## 🚀 Despliegue a Producción

### Requisitos previos

- [Node.js 18+](https://nodejs.org)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Cuenta en Firebase Console
- Credenciales de Stripe y PayPal

### Configuración local

#### 1. Instalar dependencias de Functions
```bash
cd functions
npm install
cd ..
```

#### 2. Configurar Stripe en Cloud Functions

**IMPORTANTE**: La clave secreta de Stripe se configura de forma segura usando Firebase config:

```bash
firebase functions:config:set stripe.secret="sk_test_YOUR_SECRET_KEY"
```

Reemplaza `sk_test_YOUR_SECRET_KEY` con tu clave secreta real.

#### 3. Verificar configuración de Stripe en cliente

Abre `js/firebase-config.js` y verifica:
```javascript
window.PAYMENTS_CONFIG = {
  stripePublishableKey: "pk_test_51SpWYYEKWY4tPfQc6X4TLo0gy98PI6OTjhp9E3wQyRZ0bUy49CoVxg7mch7MaD8G3Sy0ZVjs9aHSV81VVz9AmYKD00JcLe1oRp",
  // ... resto de la config
};
```

### Despliegue a Firebase Hosting

#### Opción 1: Desplegar todo (Functions + Hosting)
```bash
firebase deploy
```

#### Opción 2: Solo Cloud Functions (si ya tienes hosting)
```bash
firebase deploy --only functions
```

#### Opción 3: Solo Hosting (si ya tienes functions)
```bash
firebase deploy --only hosting
```

### Verificar despliegue

Después del despliegue, Firebase te dará una URL:
```
Hosting URL: https://fyzperfumeria.web.app
```

Accede a esa URL y verifica que:
- ✅ Los estilos carguen correctamente
- ✅ Firebase se conecte
- ✅ PayPal y Stripe se inicialicen
- ✅ El checkout funcione

### Checklist de producción

- [ ] Configurar Stripe secret key en Functions: `firebase functions:config:set stripe.secret="..."`
- [ ] Verificar que las URLs de Stripe y PayPal sean HTTPS
- [ ] Activar Firestore Rules (las reglas de seguridad)
- [ ] Configurar dominio personalizado (opcional)
- [ ] Activar authentication providers (Google, etc)
- [ ] Probar pago con tarjeta de prueba de Stripe

### Tarjetas de prueba Stripe

Para probar en sandbox:
- **Éxito**: `4242 4242 4242 4242`
- **Rechazado**: `4000 0000 0000 0002`
- Cualquier fecha futura y CVC (ej: 123)

### URLs en producción

Una vez desplegado:
- **Web**: `https://fyzperfumeria.web.app`
- **Functions**: `https://us-central1-fyzperfumeria.cloudfunctions.net/createPaymentIntent`

El CORS ya está configurado, pero en producción asegúrate de que:
1. Las Cloud Functions acepten requests desde tu dominio
2. Stripe esté configurado con tu dominio
3. PayPal esté configurado con tu dominio

### Problemas comunes

**Error CORS en producción:**
- Verifica que la Cloud Function tenga headers CORS correcto
- Asegúrate que el dominio esté en la whitelist de Stripe/PayPal

**Error de SSL/HTTPS:**
- Firebase Hosting proporciona HTTPS automáticamente
- Stripe y PayPal requieren HTTPS en producción

**Functions no encontradas:**
- Verifica que `firebase deploy --only functions` se haya ejecutado
- Confirma que el ProjectID en `.firebaserc` sea correcto

### Scripts útiles

```bash
# Ver logs de functions
firebase functions:log

# Borrar todas las functions desplegadas
firebase functions:delete createPaymentIntent

# Ver configuración actual
firebase functions:config:get
```

---

**¿Necesitás ayuda?** Contactá al equipo de desarrollo.
