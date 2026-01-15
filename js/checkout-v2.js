/**
 * checkout.js v2.0 · Sistema de Checkout Mejorado
 * =====================================================
 * - Integración con PayPal v2.0
 * - Soporte para Stripe
 * - Manejo robusto de errores
 * - Conversión de moneda (CRC -> USD)
 *
 * Requiere:
 * - js/firebase-config.js
 * - js/paypal-module.js
 * - PayPal SDK (cargado dinámicamente)
 */

(function () {
  "use strict";

  // =================== UTILIDADES ===================
  const $ = (sel) => document.querySelector(sel);

  const Utils = {
    log(type, msg, data) {
      const icon = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" }[type] || "▶️";
      console.log(`${icon} [Checkout] ${msg}`, data || "");
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

    getCarritoItems() {
      try {
        return JSON.parse(localStorage.getItem("fyz_carrito") || "[]");
      } catch {
        return [];
      }
    },

    calcularTotales() {
      const items = this.getCarritoItems();
      let total = 0;

      for (const it of items) {
        const precio = Number(it.precio || 0);
        const cantidad = Math.max(1, parseInt(it.cantidad, 10) || 1);
        total += precio * cantidad;
      }

      return { total, items };
    }
  };

  // =================== CHECKOUT SYSTEM ===================
  const CheckoutSystem = {
    currentStep: 1,

    /**
     * Inicializar sistema
     */
    async init() {
      Utils.log("info", "Inicializando checkout");

      // Validar carrito
      this._validateCart();

      // Renderizar UI
      this._renderResumen();
      this._bindSteps();
      this._bindPaymentMethods();
      this._prefillShipping();

      // Cargar módulo PayPal
      if (window.PayPalModule) {
        const ok = await PayPalModule.init();
        if (ok) {
          Utils.log("success", "PayPal módulo inicializado");
        } else {
          Utils.log("warning", "PayPal no disponible");
        }
      }

      Utils.log("success", "Checkout listo");
    },

    /**
     * Validar que el carrito no esté vacío
     */
    _validateCart() {
      const { items } = Utils.calcularTotales();
      if (!items || !items.length) {
        setTimeout(() => {
          alert("Tu carrito está vacío. Agregá productos antes de pagar.");
          window.location.href = "carrito.html";
        }, 300);
      }
    },

    /**
     * Renderizar resumen de compra
     */
    _renderResumen() {
      const { total, items } = Utils.calcularTotales();
      if (!items.length) return;

      // Items
      const itemsHtml = items.map(it => {
        const cantidad = Math.max(1, parseInt(it.cantidad, 10) || 1);
        const subtotal = Number(it.precio || 0) * cantidad;

        return `
          <div class="order-item">
            <div class="item-image">
              <img src="${it.imagen || 'https://via.placeholder.com/80'}" alt="${it.nombre}" onerror="this.src='https://via.placeholder.com/80'">
            </div>
            <div class="item-details">
              <h4 class="item-name">${it.nombre}</h4>
              <div class="item-meta">
                <span class="qty">x${cantidad}</span>
                <span>${Utils.formatCRC(it.precio || 0)}</span>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div class="item-price">${Utils.formatCRC(subtotal)}</div>
            </div>
          </div>
        `;
      }).join("");

      const summaryItems = document.getElementById("summary-items");
      if (summaryItems) {
        summaryItems.innerHTML = itemsHtml;
      }

      // Totales
      const subtotal = total;
      const ship = 0;
      const finalTotal = subtotal + ship;

      document.getElementById("summary-subtotal").textContent = Utils.formatCRC(subtotal);

      const shipEl = document.getElementById("summary-shipping");
      if (shipEl) {
        shipEl.textContent = "Gratis";
        shipEl.classList.add("free-shipping");
      }

      document.getElementById("summary-total").textContent = Utils.formatCRC(finalTotal);

      // Equivalente USD
      const usdEq = document.getElementById("summary-total-usd");
      if (usdEq) {
        usdEq.textContent = `(${Utils.formatUSD(Utils.crcToUsd(finalTotal))} aprox.)`;
      }
    },

    /**
     * Vincular eventos de pasos
     */
    _bindSteps() {
      // Botón volver al carrito
      const backBtn = $("#back-to-cart");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          window.location.href = "carrito.html";
        });
      }

      // Botón continuar a pago
      const continueBtn = $("#continue-to-payment");
      if (continueBtn) {
        continueBtn.addEventListener("click", async () => {
          const form = document.getElementById("shipping-form");
          if (!form) return;

          if (!form.checkValidity()) {
            form.reportValidity?.();
            alert("❌ Revisá los campos (faltan datos o están mal)");
            return;
          }

          // Validar email y teléfono
          const email = document.getElementById("shipping-email")?.value || "";
          const phone = document.getElementById("shipping-phone")?.value || "";

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("❌ Email inválido");
            return;
          }

          if (!/^\d{8,}$/.test(phone.replace(/\D/g, ""))) {
            alert("❌ Teléfono inválido (mínimo 8 dígitos)");
            return;
          }

          // Guardar datos de envío
          this._saveShipping();

          // Ir a pago
          this._goToPayment();
        });
      }
    },

    /**
     * Vincular métodos de pago
     */
    _bindPaymentMethods() {
      const paymentSection = document.getElementById("payment-section");
      if (!paymentSection) return;

      const methodRadios = paymentSection.querySelectorAll('input[name="payment-method"]');
      methodRadios.forEach(radio => {
        radio.addEventListener("change", async (e) => {
          const method = e.target.value;
          Utils.log("info", `Método de pago seleccionado: ${method}`);

          if (method === "paypal" && window.PayPalModule) {
            // Renderizar PayPal
            await PayPalModule.renderButtons("paypal-button-container");
          }
        });
      });

      // Si PayPal está pre-seleccionado, renderizar
      const paypalRadio = paymentSection.querySelector('input[value="paypal"]');
      if (paypalRadio && paypalRadio.checked && window.PayPalModule) {
        setTimeout(() => {
          PayPalModule.renderButtons("paypal-button-container");
        }, 500);
      }
    },

    /**
     * Pre-rellenar datos de envío si hay sesión
     */
    _prefillShipping() {
      const user = typeof auth !== "undefined" ? auth.currentUser : null;
      if (!user) return;

      const email = document.getElementById("shipping-email");
      if (email && !email.value) {
        email.value = user.email || "";
      }
    },

    /**
     * Guardar datos de envío
     */
    _saveShipping() {
      const form = document.getElementById("shipping-form");
      if (!form) return;

      const shipping = {
        email: document.getElementById("shipping-email")?.value || "",
        phone: document.getElementById("shipping-phone")?.value || "",
        address: document.getElementById("shipping-address")?.value || "",
        city: document.getElementById("shipping-city")?.value || "",
        postalCode: document.getElementById("shipping-postal")?.value || "",
        country: document.getElementById("shipping-country")?.value || "CR"
      };

      localStorage.setItem("fyz_checkout_shipping", JSON.stringify(shipping));
      Utils.log("info", "Datos de envío guardados");
    },

    /**
     * Ir al paso de pago
     */
    _goToPayment() {
      const shipping = document.getElementById("shipping-section");
      const payment = document.getElementById("payment-section");

      if (shipping) shipping.style.display = "none";
      if (payment) payment.style.display = "block";

      this.currentStep = 2;
      this._updateSteps();

      // Scroll top
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    /**
     * Actualizar indicadores de pasos
     */
    _updateSteps() {
      const steps = document.querySelectorAll(".checkout-steps .step");
      steps.forEach((step, index) => {
        if (index + 1 <= this.currentStep) {
          step.classList.add("active");
        } else {
          step.classList.remove("active");
        }
      });
    }
  };

  // =================== EXPORT Y INIT ===================
  window.checkout = CheckoutSystem;

  document.addEventListener("DOMContentLoaded", () => {
    try {
      CheckoutSystem.init();
    } catch (err) {
      Utils.log("error", "Checkout init error", err);
    }
  });

  // Export para debug
  window.CheckoutDebug = {
    carrito: () => Utils.getCarritoItems(),
    totales: () => Utils.calcularTotales(),
    config: () => Utils.getCfg(),
    paypal: () => window.PayPalModule
  };
})();
