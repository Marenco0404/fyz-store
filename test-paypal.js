/**
 * test-paypal.js · Script de Verificación de PayPal
 * ====================================================
 * Copia y pega en la consola (F12) de cualquier página para verificar
 * que PayPal está configurado correctamente.
 */

console.log("🔍 Verificando configuración de PayPal...\n");

// 1. Verificar PAYMENTS_CONFIG
console.log("1️⃣ PAYMENTS_CONFIG:");
if (window.PAYMENTS_CONFIG) {
  const cfg = window.PAYMENTS_CONFIG;
  console.log(`   ✅ Cliente ID: ${cfg.paypalClientId?.substring(0, 20)}...`);
  console.log(`   ✅ Entorno: ${cfg.paypalEnv}`);
  console.log(`   ✅ Moneda: ${cfg.paypalCurrency}`);
  console.log(`   ✅ Tipo de cambio: ${cfg.paypalFxRate} CRC/USD`);
} else {
  console.log("   ❌ PAYMENTS_CONFIG no encontrado");
}

// 2. Verificar PayPalModule
console.log("\n2️⃣ PayPalModule:");
if (window.PayPalModule) {
  console.log(`   ✅ Módulo cargado`);
  console.log(`   ✅ SDK cargado: ${PayPalModule.sdkLoaded}`);
  console.log(`   ✅ Métodos disponibles:`);
  console.log(`      - PayPalModule.init()`);
  console.log(`      - PayPalModule.renderButtons()`);
} else {
  console.log("   ❌ PayPalModule no encontrado (verifica que paypal-module.js esté en HTML)");
}

// 3. Verificar PayPal SDK
console.log("\n3️⃣ PayPal SDK:");
if (typeof paypal !== "undefined") {
  console.log(`   ✅ SDK disponible en window.paypal`);
  console.log(`   ✅ Métodos: ${Object.keys(paypal).join(", ")}`);
} else {
  console.log("   ⏳ SDK no cargado aún (se carga dinámicamente)");
}

// 4. Verificar Carrito
console.log("\n4️⃣ Carrito:");
if (window.CheckoutDebug) {
  const carrito = CheckoutDebug.carrito();
  const totales = CheckoutDebug.totales();
  console.log(`   ✅ Items en carrito: ${carrito.length}`);
  console.log(`   ✅ Total CRC: ₡${totales.total}`);
  console.log(`   ✅ Total USD: $${(totales.total / (window.PAYMENTS_CONFIG?.paypalFxRate || 520)).toFixed(2)}`);
} else {
  console.log("   ❌ CheckoutDebug no disponible");
}

// 5. Verificar Firestore
console.log("\n5️⃣ Firestore:");
if (typeof db !== "undefined") {
  console.log(`   ✅ Firestore conectado: ${db ? "sí" : "no"}`);
} else {
  console.log("   ❌ Firestore no disponible");
}

// 6. Verificar Auth
console.log("\n6️⃣ Auth:");
if (typeof auth !== "undefined" && auth.currentUser) {
  console.log(`   ✅ Usuario: ${auth.currentUser.email}`);
} else {
  console.log(`   ℹ️ No hay usuario conectado (es opcional)`);
}

// 7. Resumen
console.log("\n" + "=".repeat(50));
console.log("📋 PRÓXIMOS PASOS:\n");
console.log("1. Si algo está ❌, revisa firebase-config.js");
console.log("2. Si todo está ✅, puedes:");
console.log("   - PayPalModule.init()          // Iniciar módulo");
console.log("   - PayPalModule.renderButtons() // Renderizar botón");
console.log("3. Si quieres ver logs detallados:");
console.log("   - Abre consola (F12)");
console.log("   - Mira los [PayPal] logs");
console.log("\n" + "=".repeat(50));

// Comandos útiles
window.paypalTest = {
  config: () => window.PAYMENTS_CONFIG,
  carrito: () => CheckoutDebug?.carrito() || [],
  totales: () => CheckoutDebug?.totales() || {},
  init: async () => await PayPalModule?.init(),
  render: async () => await PayPalModule?.renderButtons(),
  help: () => {
    console.log("Comandos disponibles:");
    console.log("- paypalTest.config()   → Ver configuración");
    console.log("- paypalTest.carrito()  → Ver carrito");
    console.log("- paypalTest.totales()  → Ver totales");
    console.log("- paypalTest.init()     → Inicializar PayPal");
    console.log("- paypalTest.render()   → Renderizar botones");
  }
};

console.log("\n💡 Comandos rápidos disponibles:");
console.log("   paypalTest.help()     // Ver todos los comandos");
console.log("   paypalTest.config()   // Ver config de PayPal");
console.log("   paypalTest.carrito()  // Ver carrito");
console.log("   paypalTest.totales()  // Ver totales");
