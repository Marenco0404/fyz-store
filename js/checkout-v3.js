/**
 * checkout.js v3.0 - Refactorizado para PayPal Simple
 */

(function () {
  "use strict";

  const Checkout = {
    /**
     * Iniciar checkout
     */
    async init() {
      console.log("✅ [Checkout] Inicializando");

      // Validar carrito
      const items = this.getCart();
      if (!items.length) {
        setTimeout(() => {
          alert("Tu carrito está vacío");
          window.location.href = "carrito.html";
        }, 300);
        return;
      }

      // Renderizar UI
      this.renderSummary();
      this.bindSteps();
      this.bindPaymentMethods();

      // Iniciar PayPal
      if (window.PayPal) {
        const ok = await window.PayPal.init();
        console.log(ok ? "✅ PayPal listo" : "⚠️ PayPal no disponible");
      }

      console.log("✅ [Checkout] Listo");
    },

    /**
     * Obtener carrito
     */
    getCart() {
      try {
        return JSON.parse(localStorage.getItem("fyz_carrito") || "[]");
      } catch {
        return [];
      }
    },

    /**
     * Calcular totales
     */
    getTotal() {
      const items = this.getCart();
      return items.reduce((sum, item) => {
        const price = Number(item.precio || 0);
        const qty = Math.max(1, parseInt(item.cantidad || 1, 10));
        return sum + (price * qty);
      }, 0);
    },

    /**
     * Formatear monedas
     */
    formatCRC(n) {
      return "₡" + (Number(n || 0)).toLocaleString("es-CR", { minimumFractionDigits: 0 });
    },

    formatUSD(n) {
      return "$" + (Number(n || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 });
    },

    crcToUsd(crc) {
      const cfg = window.PAYMENTS_CONFIG || {};
      const rate = Number(cfg.paypalFxRate || 520);
      return Math.round((crc / rate) * 100) / 100;
    },

    /**
     * Renderizar resumen
     */
    renderSummary() {
      const items = this.getCart();
      const total = this.getTotal();
      const totalUSD = this.crcToUsd(total);

      // Items
      const itemsHtml = items.map(it => {
        const qty = Math.max(1, parseInt(it.cantidad || 1, 10));
        const subtotal = Number(it.precio || 0) * qty;
        return `
          <div style="display:flex; gap:12px; padding:12px; border-bottom:1px solid #eee;">
            <img src="${it.imagen}" alt="${it.nombre}" style="width:80px; height:80px; object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/80'">
            <div style="flex:1;">
              <h4 style="margin:0 0 4px 0;">${it.nombre}</h4>
              <p style="margin:0; color:#666; font-size:14px;">x${qty} @ ${this.formatCRC(it.precio)}</p>
            </div>
            <div style="text-align:right; font-weight:bold;">${this.formatCRC(subtotal)}</div>
          </div>
        `;
      }).join("");

      const summaryItems = document.getElementById("summary-items");
      if (summaryItems) summaryItems.innerHTML = itemsHtml;

      const summaryTotal = document.getElementById("summary-total");
      if (summaryTotal) summaryTotal.textContent = this.formatCRC(total);

      const summaryUSD = document.getElementById("summary-total-usd");
      if (summaryUSD) summaryUSD.textContent = `(${this.formatUSD(totalUSD)} aprox.)`;
    },

    /**
     * Vincular eventos de pasos
     */
    bindSteps() {
      const continueBtn = document.getElementById("continue-to-payment");
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          const form = document.getElementById("shipping-form");
          if (!form?.checkValidity?.()) {
            form?.reportValidity?.();
            alert("❌ Revisa los campos");
            return;
          }

          // Guardar shipping
          const shipping = {
            email: document.getElementById("shipping-email")?.value || "",
            phone: document.getElementById("shipping-phone")?.value || "",
            address: document.getElementById("shipping-address")?.value || "",
            city: document.getElementById("shipping-city")?.value || "",
            country: document.getElementById("shipping-country")?.value || "CR"
          };
          localStorage.setItem("fyz_checkout_shipping", JSON.stringify(shipping));

          // Ir a pago
          const shipping_section = document.getElementById("shipping-section");
          const payment_section = document.getElementById("payment-section");
          if (shipping_section) shipping_section.style.display = "none";
          if (payment_section) payment_section.style.display = "block";

          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      const backBtn = document.getElementById("back-to-cart");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          window.location.href = "carrito.html";
        });
      }
    },

    /**
     * Vincular métodos de pago
     */
    bindPaymentMethods() {
      const paymentSection = document.getElementById("payment-section");
      if (!paymentSection) return;

      const methodRadios = paymentSection.querySelectorAll('input[name="payment-method"]');
      methodRadios.forEach(radio => {
        radio.addEventListener("change", async (e) => {
          const method = e.target.value;
          console.log(`Método seleccionado: ${method}`);

          if (method === "paypal" && window.PayPal) {
            await window.PayPal.renderButtons("paypal-button-container");
          }
        });
      });

      // Si PayPal está preseleccionado
      const paypalRadio = paymentSection.querySelector('input[value="paypal"]');
      if (paypalRadio?.checked && window.PayPal) {
        setTimeout(() => {
          window.PayPal.renderButtons("paypal-button-container");
        }, 500);
      }
    }
  };

  // === INIT ===
  window.checkout = Checkout;

  document.addEventListener("DOMContentLoaded", () => {
    Checkout.init().catch(err => {
      console.error("❌ Error en checkout:", err);
    });
  });

  // === DEBUG ===
  window.CheckoutDebug = {
    carrito: () => Checkout.getCart(),
    total: () => Checkout.getTotal(),
    config: () => window.PAYMENTS_CONFIG,
    paypal: () => window.PayPal
  };
})();
