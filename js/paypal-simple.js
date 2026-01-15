/**
 * paypal-simple.js - Módulo PayPal v3.0 (Reescrito)
 * ====================================================
 * - Más simple
 * - Más directo
 * - Mejor manejo de errores
 * - Sin complejidades innecesarias
 */

(function () {
  "use strict";

  // === CONFIG ===
  const SDK_URL = "https://www.paypal.com/sdk/js";
  
  // === LOGGER ===
  const log = (type, msg, data) => {
    const icon = { info: "ℹ️", success: "✅", error: "❌", warning: "⚠️" }[type] || "▶️";
    console.log(`${icon} [PayPal] ${msg}`, data || "");
  };

  // === UTILITIES ===
  const util = {
    getConfig() {
      return window.PAYMENTS_CONFIG || {};
    },
    
    getCRC(n) {
      return "₡" + (Number(n || 0)).toLocaleString("es-CR", { minimumFractionDigits: 0 });
    },
    
    getUSD(n) {
      return "$" + (Number(n || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 });
    },
    
    crcToUsd(crc) {
      const cfg = this.getConfig();
      const rate = Number(cfg.paypalFxRate || 520);
      return Math.round((crc / rate) * 100) / 100;
    },

    getCart() {
      try {
        return JSON.parse(localStorage.getItem("fyz_carrito") || "[]");
      } catch {
        return [];
      }
    },

    getTotal() {
      const items = this.getCart();
      return items.reduce((sum, item) => {
        const price = Number(item.precio || 0);
        const qty = Math.max(1, parseInt(item.cantidad || 1, 10));
        return sum + (price * qty);
      }, 0);
    }
  };

  // === MAIN MODULE ===
  const PayPal = {
    sdkReady: false,
    rendering: false,
    errorEl: null,

    /**
     * Iniciar módulo
     */
    async init() {
      log("info", "Iniciando PayPal v3.0");
      this.errorEl = document.getElementById("checkout-error");

      // Cargar SDK
      const ready = await this.loadSDK();
      if (!ready) {
        this.showError("❌ PayPal no disponible. Intenta desactivar AdBlock.");
        return false;
      }

      log("success", "PayPal listo");
      return true;
    },

    /**
     * Cargar SDK de PayPal
     */
    async loadSDK() {
      return new Promise((resolve) => {
        // Si ya está cargado
        if (typeof window.paypal !== "undefined") {
          log("info", "SDK PayPal ya está en memoria");
          this.sdkReady = true;
          return resolve(true);
        }

        // Validar config
        const cfg = util.getConfig();
        if (!cfg.paypalClientId) {
          log("error", "❌ paypalClientId no configurado");
          return resolve(false);
        }

        log("info", `Cargando SDK con Client ID: ${cfg.paypalClientId.substring(0, 20)}...`);

        // Construir URL
        const params = new URLSearchParams({
          "client-id": cfg.paypalClientId,
          currency: "USD",
          intent: "capture",
          components: "buttons",
          locale: "es_ES",
          "disable-funding": "paylater"
        });

        if ((cfg.paypalEnv || "sandbox") === "sandbox") {
          params.append("debug", "true");
        }

        const scriptUrl = `${SDK_URL}?${params.toString()}`;

        // Crear script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;

        // Timeout
        const timeoutId = setTimeout(() => {
          log("error", "⏱️ Timeout (20s) cargando SDK - probablemente AdBlock");
          resolve(false);
        }, 20000);

        script.onload = () => {
          clearTimeout(timeoutId);
          if (typeof window.paypal !== "undefined") {
            log("success", "✅ SDK cargado correctamente");
            this.sdkReady = true;
            resolve(true);
          } else {
            log("error", "Script cargó pero paypal no disponible");
            resolve(false);
          }
        };

        script.onerror = (err) => {
          clearTimeout(timeoutId);
          log("error", "Error cargando script", err);
          resolve(false);
        };

        document.head.appendChild(script);
      });
    },

    /**
     * Renderizar botones PayPal
     */
    async renderButtons(containerId = "paypal-button-container") {
      if (this.rendering) {
        log("warning", "Ya hay un render en progreso");
        return false;
      }

      this.rendering = true;
      const container = document.getElementById(containerId);

      if (!container) {
        log("error", `Contenedor #${containerId} no encontrado`);
        this.rendering = false;
        return false;
      }

      // Validar carrito
      const items = util.getCart();
      if (!items.length) {
        container.innerHTML = `<div style="padding:1rem; background:#fff3cd; border-radius:4px; color:#856404;">⚠️ Carrito vacío</div>`;
        this.rendering = false;
        return false;
      }

      // Validar SDK
      if (typeof window.paypal === "undefined") {
        log("error", "window.paypal no disponible");
        this.showError("PayPal SDK no cargó. Intenta sin AdBlock.");
        this.rendering = false;
        return false;
      }

      try {
        log("info", "Renderizando botones PayPal");
        container.innerHTML = `<div style="text-align:center;padding:1rem;color:#3498db;">⏳ Cargando PayPal...</div>`;

        const totalCRC = util.getTotal();
        const totalUSD = util.crcToUsd(totalCRC);

        if (!totalUSD || totalUSD <= 0) {
          throw new Error("Monto inválido");
        }

        log("info", `Monto: ${util.getCRC(totalCRC)} (${util.getUSD(totalUSD)})`);

        window.paypal.Buttons({
          locale: "es_ES",
          style: {
            layout: "vertical",
            color: "blue",
            shape: "pill",
            height: 48,
            label: "pay"
          },

          createOrder: async (data, actions) => {
            log("info", "Creando orden PayPal");
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [{
                amount: {
                  currency_code: "USD",
                  value: totalUSD.toFixed(2)
                },
                description: "Compra en F&Z Store"
              }]
            });
          },

          onApprove: async (data, actions) => {
            log("info", "Aprobado, capturando orden...");
            try {
              const order = await actions.order.capture();
              log("success", "Orden capturada:", order.id);
              
              // Guardar en Firestore
              await this.savePedido({
                orderId: order.id,
                totalCRC,
                totalUSD,
                items
              });

              this.showSuccess("✅ ¡Pago completado! Redirigiendo...");
              setTimeout(() => {
                window.location.href = `confirmacion.html?id=${order.id}`;
              }, 1500);
            } catch (err) {
              log("error", "Error capturando orden", err);
              this.showError(`Error: ${err.message}`);
            }
          },

          onError: (err) => {
            log("error", "Error PayPal", err);
            this.showError(`<strong>⚠️ Error con PayPal</strong><br><small>Intenta desactivar AdBlock o usa otro navegador</small>`);
          },

          onCancel: () => {
            log("warning", "Usuario canceló");
            this.showWarning("Cancelaste el pago. Puedes intentar nuevamente.");
          }
        }).render(container)
          .then(() => {
            log("success", "Botones renderizados");
            this.rendering = false;
          })
          .catch((err) => {
            log("error", "Error renderizando botones", err);
            this.showError("❌ Error renderizando PayPal. Intenta recargando la página.");
            this.rendering = false;
          });

      } catch (err) {
        log("error", "Exception en renderButtons", err);
        this.showError(`Error: ${err.message}`);
        this.rendering = false;
        return false;
      }

      return true;
    },

    /**
     * Guardar pedido en Firestore
     */
    async savePedido({ orderId, totalCRC, totalUSD, items }) {
      if (typeof window.db === "undefined" || !window.db) {
        log("warning", "Firestore no disponible");
        return orderId;
      }

      try {
        // Descontar stock
        await window.db.runTransaction(async (tx) => {
          const refs = items.map(it => window.db.collection("productos").doc(String(it.id)));
          const docs = await Promise.all(refs.map(r => tx.get(r)));

          for (let i = 0; i < items.length; i++) {
            if (!docs[i].exists) throw new Error(`Producto no existe: ${items[i].id}`);
            const stock = Number(docs[i].data()?.stock ?? 0);
            const qty = Math.max(1, parseInt(items[i].cantidad || 1, 10));
            if (stock < qty) throw new Error(`Stock insuficiente: ${items[i].nombre}`);
            tx.update(refs[i], { stock: stock - qty });
          }
        });

        // Guardar pedido
        const pedido = {
          id: orderId,
          usuario: window.auth?.currentUser?.uid || "anonimo",
          email: window.auth?.currentUser?.email || "desconocido",
          items,
          totalCRC,
          totalUSD,
          metodo: "paypal",
          estado: "completado",
          fecha: new Date().toISOString(),
          shipping: JSON.parse(localStorage.getItem("fyz_checkout_shipping") || "{}")
        };

        const docRef = await window.db.collection("pedidos").add(pedido);
        log("success", "Pedido guardado:", docRef.id);

        // Limpiar carrito
        localStorage.removeItem("fyz_carrito");
        localStorage.removeItem("fyz_checkout_step");

        return orderId;
      } catch (err) {
        log("error", "Error guardando pedido", err);
        throw err;
      }
    },

    // === MENSAJES ===
    showError(msg) {
      this._showMsg(msg, "error");
    },
    showSuccess(msg) {
      this._showMsg(msg, "success");
    },
    showWarning(msg) {
      this._showMsg(msg, "warning");
    },
    _showMsg(msg, type) {
      if (!this.errorEl) return;
      const styles = {
        error: "background:#f8d7da; color:#721c24; border-left:4px solid #f5c6cb;",
        success: "background:#d4edda; color:#155724; border-left:4px solid #c3e6cb;",
        warning: "background:#fff3cd; color:#856404; border-left:4px solid #ffeaa7;"
      };
      this.errorEl.innerHTML = msg;
      this.errorEl.style.cssText = `padding:1rem; border-radius:4px; ${styles[type] || styles.error}`;
      this.errorEl.style.display = "block";
    }
  };

  // === EXPORT ===
  window.PayPal = PayPal;
  window.PayPalUtil = util;
  log("info", "Módulo PayPal v3.0 cargado");
})();
