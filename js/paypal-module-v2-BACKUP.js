/**
 * paypal-module.js · Módulo PayPal Mejorado v2.0
 * =====================================================
 * Sistema completo y robusto para PayPal en F&Z Store
 * 
 * Características:
 * - Carga dinámica del SDK de PayPal
 * - Manejo robusto de errores
 * - Validaciones de seguridad
 * - Conversión de moneda (CRC -> USD)
 * - Integración con Firestore para pedidos
 * - Soporte para múltiples métodos de pago
 */

(function () {
  "use strict";

  // =================== CONFIGURACIÓN ===================
  const CONFIG = {
    SDK_URL: "https://www.paypal.com/sdk/js",
    TIMEOUT_MS: 20000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000
  };

  // =================== UTILIDADES ===================
  const Utils = {
    log(type, msg, data = null) {
      const prefix = {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌"
      }[type] || "▶️";
      console.log(`${prefix} [PayPal] ${msg}`, data || "");
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    getCfg() {
      return window.PAYMENTS_CONFIG || {};
    },

    getFxRate() {
      const cfg = this.getCfg();
      const fx = Number(cfg.usdFxRate || cfg.paypalFxRate || 520);
      return fx > 0 ? fx : 520;
    },

    crcToUsd(crc) {
      const fx = this.getFxRate();
      const usd = Number(crc || 0) / fx;
      return Math.round(usd * 100) / 100;
    },

    formatCRC(n) {
      if (typeof window.formatCRC === "function") return window.formatCRC(n);
      const num = Number(n || 0);
      return "₡" + num.toLocaleString("es-CR", { minimumFractionDigits: 0 });
    },

    formatUSD(n) {
      const num = Number(n || 0);
      return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
    },

    escapeHtml(str) {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return String(str || "").replace(/[&<>"']/g, c => map[c]);
    },

    generateTransactionId() {
      return "TXN-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }
  };

  // =================== PAYPAL MODULE ===================
  const PayPalModule = {
    // Estado
    sdkLoaded: false,
    renderAttempts: 0,
    isProcessing: false,
    errorContainer: null,

    /**
     * Inicializar el módulo
     */
    async init() {
      Utils.log("info", "Inicializando módulo PayPal");
      this.errorContainer = document.getElementById("checkout-error");
      
      // Intentar cargar SDK
      const sdkLoaded = await this._loadSdkWithRetry();
      if (!sdkLoaded) {
        this.showError("No se pudo cargar PayPal SDK. Intenta desactivar AdBlock.");
        return false;
      }

      Utils.log("success", "Módulo PayPal listo");
      return true;
    },

    /**
     * Cargar SDK con reintentos
     */
    async _loadSdkWithRetry() {
      for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
          Utils.log("info", `Intento ${attempt}/${CONFIG.RETRY_ATTEMPTS} de cargar PayPal SDK`);
          
          // Si ya está cargado, retornar
          if (typeof paypal !== "undefined") {
            Utils.log("success", "PayPal SDK ya estaba cargado");
            this.sdkLoaded = true;
            return true;
          }

          // Cargar SDK
          const loaded = await this._loadSdk();
          if (loaded) {
            this.sdkLoaded = true;
            return true;
          }

          // Si no es el último intento, esperar antes de reintentar
          if (attempt < CONFIG.RETRY_ATTEMPTS) {
            await Utils.sleep(CONFIG.RETRY_DELAY_MS * attempt);
          }
        } catch (err) {
          Utils.log("warning", `Intento ${attempt} falló:`, err.message);
        }
      }

      Utils.log("error", "No se pudo cargar PayPal SDK después de varios intentos");
      return false;
    },

    /**
     * Cargar el SDK de PayPal
     */
    _loadSdk() {
      return new Promise((resolve) => {
        try {
          // Verificar que PAYMENTS_CONFIG esté disponible
          const cfg = Utils.getCfg();
          if (!cfg || !cfg.paypalClientId) {
            Utils.log("error", "⚠️ PAYMENTS_CONFIG no está disponible o no tiene paypalClientId");
            Utils.log("error", "Verifica que firebase-config.js se cargó ANTES que paypal-module.js");
            resolve(false);
            return;
          }

          if (typeof paypal !== "undefined") {
            Utils.log("success", "PayPal SDK ya estaba cargado globalmente");
            resolve(true);
            return;
          }

          const clientId = cfg.paypalClientId;

          if (!clientId || clientId.includes("PON_AQUI")) {
            Utils.log("error", "PayPal clientId no configurado en PAYMENTS_CONFIG");
            resolve(false);
            return;
          }

          Utils.log("info", `Cargando PayPal SDK con clientId: ${clientId.substring(0, 20)}...`);

          // Parámetros del SDK
          const params = new URLSearchParams({
            "client-id": clientId,
            currency: cfg.paypalCurrency || "USD",
            intent: "capture",
            components: "buttons",
            locale: "es_ES",
            "disable-funding": "paylater",
            "merchant-id": cfg.paypalMerchantId || ""
          });

          if ((cfg.paypalEnv || "sandbox") === "sandbox") {
            params.set("debug", "true");
          }

          const scriptUrl = `${CONFIG.SDK_URL}?${params.toString()}`;
          Utils.log("info", `URL del SDK: ${scriptUrl.substring(0, 80)}...`);

          // Verificar si el script ya está en el DOM
          const existingScript = document.querySelector(`script[src*="client-id=${clientId}"]`);
          if (existingScript) {
            Utils.log("info", "Script PayPal ya está en el DOM");
            resolve(true);
            return;
          }

          const script = document.createElement("script");
          script.src = scriptUrl;
          script.async = true;
          script.defer = true;

          // Timeout de carga
          const timeoutId = setTimeout(() => {
            Utils.log("warning", "⏱️ Timeout cargando PayPal SDK (20s) - Probablemente AdBlock o sin conexión");
            // No removemos el script, lo dejamos intentar cargar
            resolve(false);
          }, CONFIG.TIMEOUT_MS);

          script.onload = () => {
            clearTimeout(timeoutId);
            // Verificar que el objeto paypal esté disponible
            if (typeof paypal !== "undefined") {
              Utils.log("success", "✅ PayPal SDK cargado correctamente");
              resolve(true);
            } else {
              Utils.log("warning", "Script cargado pero 'paypal' objeto no disponible");
              resolve(false);
            }
          };

          script.onerror = (err) => {
            clearTimeout(timeoutId);
            Utils.log("error", "❌ Error cargando PayPal SDK:", err);
            resolve(false);
          };

          Utils.log("info", "Insertando script en document.head");
          document.head.appendChild(script);
        } catch (err) {
          Utils.log("error", "Exception en _loadSdk:", err);
          resolve(false);
        }
      });
    },

    /**
     * Renderizar botones de PayPal
     */
    async renderButtons(containerId = "paypal-button-container") {
      try {
        if (this.isProcessing) {
          Utils.log("warning", "Ya hay un proceso en curso");
          return false;
        }

        const container = document.getElementById(containerId);
        if (!container) {
          Utils.log("error", `Contenedor #${containerId} no encontrado`);
          return false;
        }

        // Validar que el carrito no esté vacío
        if (!this._validateCart()) {
          container.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border-left: 4px solid #e74c3c; color: #e74c3c;">
              <strong>⚠️ Carrito vacío</strong>
              <p style="margin-top: 0.5rem; font-size: 0.9rem;">Agregá productos antes de pagar.</p>
            </div>
          `;
          return false;
        }

        // Mostrar estado de carga
        if (this.renderAttempts === 0) {
          container.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: #3498db; background: rgba(52, 152, 219, 0.05); border-radius: 8px; border: 1px solid rgba(52, 152, 219, 0.2);">
              <i class="fas fa-spinner fa-spin"></i> Cargando PayPal...
            </div>
          `;
        }

        this.renderAttempts++;

        // Cargar SDK si es necesario
        if (!this.sdkLoaded) {
          const loaded = await this._loadSdkWithRetry();
          if (!loaded) {
            this.showError("No se pudo cargar PayPal. Intenta desactivar AdBlock.");
            return false;
          }
        }

        if (typeof paypal === "undefined") {
          this.showError("PayPal SDK no disponible. Intenta recargar la página.");
          return false;
        }

        // Limpiar y renderizar
        container.innerHTML = "";

        const { total, items } = this._calculateTotals();
        const usdTotal = Utils.crcToUsd(total);

        this._createButtons(container, total, usdTotal, items);
        Utils.log("success", "Botones PayPal renderizados");

        return true;
      } catch (err) {
        Utils.log("error", "Error en renderButtons", err);
        this.showError("Error renderizando PayPal: " + (err.message || err));
        return false;
      }
    },

    /**
     * Crear botones de PayPal
     */
    _createButtons(container, totalCRC, totalUSD, items) {
      try {
        paypal.Buttons({
          locale: "es_ES",
          style: {
            layout: "vertical",
            color: "blue",
            shape: "pill",
            height: 48,
            label: "pay"
          },

          onInit: (data, actions) => {
            Utils.log("info", "PayPal Buttons inicializado");
          },

          createOrder: async (data, actions) => {
            try {
              Utils.log("info", "Creando orden PayPal...");
              this.isProcessing = true;
              this._clearError();

              // Validaciones
              this._validateShipping();
              await this._validateStock();

              // Recalcular total (seguridad)
              const totals = this._calculateTotals();
              const usd = Utils.crcToUsd(totals.total);

              if (!usd || !isFinite(usd) || usd <= 0) {
                throw new Error("Monto total inválido");
              }

              Utils.log("info", `Orden por ${Utils.formatUSD(usd)}`);
              this.showInfo("⏳ Preparando tu orden en PayPal...");

              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [{
                  amount: {
                    currency_code: "USD",
                    value: usd.toFixed(2)
                  },
                  description: "Compra en F&Z Store"
                }]
              });
            } catch (err) {
              Utils.log("error", "Error en createOrder", err);
              this.showError(`Error: ${err.message}`);
              throw err;
            }
          },

          onApprove: async (data, actions) => {
            try {
              Utils.log("info", "Capturando orden PayPal...");
              this.showInfo("⏳ Completando tu pago...");

              const details = await actions.order.capture();
              Utils.log("info", "Orden capturada", details);

              // Extraer ID de captura
              const captureId =
                details?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                details?.id ||
                data?.orderID ||
                Utils.generateTransactionId();

              const status = (details?.status || "").toUpperCase();
              if (status !== "COMPLETED") {
                throw new Error(`Estado inválido: ${status}`);
              }

              // Procesar pago
              const totals = this._calculateTotales();
              const pedidoId = await this._postPayment({
                method: "paypal",
                transactionId: captureId,
                totalCRC: totals.total,
                totalUSD: Utils.crcToUsd(totals.total),
                fxRate: Utils.getFxRate()
              });

              Utils.log("success", "Pago procesado. Pedido:", pedidoId);
              this.showSuccess("✅ ¡Pago confirmado! Redirigiendo...");

              // Redirigir
              setTimeout(() => {
                const url = pedidoId
                  ? `confirmacion.html?id=${encodeURIComponent(pedidoId)}`
                  : "confirmacion.html";
                window.location.href = url;
              }, 1500);
            } catch (err) {
              Utils.log("error", "Error en onApprove", err);
              this.showError(
                `<strong>⚠️ No se pudo procesar el pago</strong><br>` +
                `<small style="display:block; margin-top:0.5rem;">Error: ${Utils.escapeHtml(err.message)}</small>`
              );
              this.isProcessing = false;
            }
          },

          onError: (err) => {
            Utils.log("error", "PayPal error", err);
            this.showError(
              `<strong>⚠️ Error con PayPal</strong><br>` +
              `<small style="display:block; margin-top:0.5rem;">Soluciones:<br>` +
              `• Desactiva AdBlock<br>` +
              `• Abre en modo incógnito<br>` +
              `• Prueba con otra tarjeta</small>`
            );
            this.isProcessing = false;
          },

          onCancel: () => {
            Utils.log("warning", "Usuario canceló PayPal");
            this.showWarning("Cancelaste el pago. Podés intentar nuevamente cuando quieras.");
            this.isProcessing = false;
          }
        }).render(container)
          .then(() => {
            Utils.log("success", "Botones renderizados exitosamente");
          })
          .catch(err => {
            Utils.log("error", "Error renderizando buttons", err);
            this.showError("❌ Error renderizando PayPal. Intenta sin AdBlock.");
          });
      } catch (err) {
        Utils.log("error", "Exception en _createButtons", err);
        this.showError("Error crítico con PayPal. Recarga la página.");
      }
    },

    /**
     * Validar carrito
     */
    _validateCart() {
      try {
        const items = this._getCartItems();
        return items && items.length > 0;
      } catch {
        return false;
      }
    },

    /**
     * Validar envío
     */
    _validateShipping() {
      const form = document.getElementById("shipping-form");
      if (!form) return true;

      if (!form.checkValidity()) {
        form.reportValidity?.();
        throw new Error("Datos de envío incompletos");
      }

      return true;
    },

    /**
     * Validar stock
     */
    async _validateStock() {
      try {
        if (typeof db === "undefined" || !db) {
          Utils.log("warning", "Firestore no disponible");
          return true;
        }

        const items = this._getCartItems();
        for (const item of items) {
          const doc = await db.collection("productos").doc(String(item.id)).get();
          if (!doc.exists) throw new Error(`Producto no existe: ${item.id}`);

          const stock = Number(doc.data()?.stock ?? 0);
          const qty = Math.max(1, parseInt(item.cantidad, 10) || 1);
          if (stock < qty) throw new Error(`Stock insuficiente para ${item.nombre}`);
        }

        return true;
      } catch (err) {
        Utils.log("error", "Stock validation failed", err);
        throw err;
      }
    },

    /**
     * Procesar pago
     */
    async _postPayment({ method, transactionId, totalCRC, totalUSD, fxRate }) {
      try {
        // Descontar stock
        await this._deductStock();

        // Registrar pedido
        const pedidoId = await this._savePedido({
          method,
          transactionId,
          totalCRC,
          totalUSD,
          fxRate
        });

        // Guardar confirmación local
        const items = this._getCartItems();
        let shipping = null;
        try {
          shipping = JSON.parse(localStorage.getItem("fyz_checkout_shipping") || "null");
        } catch {}

        this._saveConfirmation({ pedidoId, method, transactionId, totalCRC, totalUSD, fxRate, items, shipping });

        // Limpiar carrito
        localStorage.removeItem("fyz_carrito");
        localStorage.removeItem("fyz_checkout_step");

        return pedidoId;
      } catch (err) {
        Utils.log("error", "Payment post failed", err);
        throw err;
      }
    },

    /**
     * Descontar stock
     */
    async _deductStock() {
      if (typeof db === "undefined" || !db) {
        Utils.log("warning", "Firestore no disponible para descontar stock");
        return true;
      }

      const items = this._getCartItems();
      if (!items.length) throw new Error("Carrito vacío");

      await db.runTransaction(async tx => {
        const refs = items.map(it => db.collection("productos").doc(String(it.id)));
        const docs = await Promise.all(refs.map(r => tx.get(r)));

        for (let i = 0; i < items.length; i++) {
          if (!docs[i].exists) throw new Error(`Producto no existe: ${items[i].id}`);

          const stock = Number(docs[i].data()?.stock ?? 0);
          const qty = Math.max(1, parseInt(items[i].cantidad, 10) || 1);
          if (stock < qty) throw new Error(`Stock insuficiente: ${items[i].nombre}`);

          tx.update(refs[i], { stock: stock - qty });
        }
      });

      return true;
    },

    /**
     * Guardar pedido en Firestore
     */
    async _savePedido({ method, transactionId, totalCRC, totalUSD, fxRate }) {
      if (typeof db === "undefined" || !db) return null;

      const user = typeof auth !== "undefined" ? auth.currentUser : null;
      const items = this._getCartItems();
      let shipping = null;

      try {
        shipping = JSON.parse(localStorage.getItem("fyz_checkout_shipping") || "null");
      } catch {}

      const ref = await db.collection("pedidos").add({
        usuarioId: user?.uid || null,
        email: user?.email || shipping?.email || null,
        shipping: shipping || null,
        items,
        totalCRC: Number(totalCRC) || 0,
        totalUSD: Number(totalUSD) || 0,
        fxRate: Number(fxRate) || Utils.getFxRate(),
        metodoPago: method,
        idTransaccion: transactionId,
        estado: "pago_completado",
        historialEstados: [{ estado: "pago_completado", fecha: new Date().toISOString() }],
        fecha: new Date().toISOString()
      });

      Utils.log("success", "Pedido guardado:", ref.id);
      return ref.id;
    },

    /**
     * Guardar confirmación local
     */
    _saveConfirmation({ pedidoId, method, transactionId, totalCRC, totalUSD, fxRate, items, shipping }) {
      localStorage.setItem("fyz_confirmacion_pago", JSON.stringify({
        pedidoId: pedidoId || null,
        metodoPago: method,
        idTransaccion: transactionId,
        totalCRC,
        totalUSD,
        fxRate,
        items: Array.isArray(items) ? items : [],
        shipping: shipping || null,
        fecha: new Date().toISOString()
      }));
    },

    /**
     * Obtener items del carrito
     */
    _getCartItems() {
      try {
        return JSON.parse(localStorage.getItem("fyz_carrito") || "[]");
      } catch {
        return [];
      }
    },

    /**
     * Calcular totales
     */
    _calculateTotals() {
      const items = this._getCartItems();
      let total = 0;

      for (const it of items) {
        const precio = Number(it.precio || 0);
        const cantidad = Math.max(1, parseInt(it.cantidad, 10) || 1);
        total += precio * cantidad;
      }

      return { total, items };
    },

    /**
     * Alias para compatibilidad
     */
    _calcularTotales() {
      return this._calculateTotals();
    },

    // =================== UI MESSAGES ===================
    showError(msg) {
      this._showMessage(msg, "error");
    },

    showSuccess(msg) {
      this._showMessage(msg, "success");
    },

    showWarning(msg) {
      this._showMessage(msg, "warning");
    },

    showInfo(msg) {
      this._showMessage(msg, "info");
    },

    _showMessage(msg, type = "error") {
      if (!this.errorContainer) return;

      const styles = {
        error: "border-left: 4px solid #e74c3c; background: rgba(231, 76, 60, 0.1); color: #e74c3c;",
        success: "border-left: 4px solid #27ae60; background: rgba(39, 174, 96, 0.1); color: #27ae60;",
        warning: "border-left: 4px solid #f39c12; background: rgba(243, 156, 18, 0.1); color: #f39c12;",
        info: "border-left: 4px solid #3498db; background: rgba(52, 152, 219, 0.1); color: #3498db;"
      };

      this.errorContainer.innerHTML = msg;
      this.errorContainer.style.cssText = `
        padding: 1rem;
        border-radius: 6px;
        font-size: 0.95rem;
        ${styles[type] || styles.error}
      `;
      this.errorContainer.style.display = "block";
    },

    _clearError() {
      if (this.errorContainer) {
        this.errorContainer.style.display = "none";
      }
    }
  };

  // =================== EXPORT ===================
  window.PayPalModule = PayPalModule;
  Utils.log("info", "Módulo PayPal v2.0 cargado");
})();
