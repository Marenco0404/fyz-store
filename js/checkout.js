/**
 * checkout.js · Checkout + Pagos (PayPal + Stripe) · Firebase v9 COMPAT
 * -----------------------------------------------------------------------------
 * Reglas del juego:
 * - Toda la tienda maneja precios en COLONES (CRC) en UI, carrito y Firestore.
 * - SOLO al momento de cobrar, se convierte a DÓLARES (USD) para los plugins.
 *
 * Requiere:
 * - js/firebase-config.js (expone window.auth, window.db y window.PAYMENTS_CONFIG)
 * - Stripe.js en el HTML: https://js.stripe.com/v3/
 * - PayPal SDK se carga dinámicamente con tu clientId
 */

(function () {
  "use strict";

  // =================== utils ===================
  const $ = (sel) => document.querySelector(sel);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function formatCRC(n) {
    if (typeof window.formatCRC === "function") return window.formatCRC(n);
    const num = Number(n || 0);
    return "₡" + num.toLocaleString("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatUSD(n) {
    const num = Number(n || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getCfg() {
    return window.PAYMENTS_CONFIG || {};
  }

  function getFxRate() {
    const cfg = getCfg();
    // compat: paypalFxRate ya existe; si algún día querés separarlo, podés meter usdFxRate también
    const fx = Number(cfg.usdFxRate || cfg.paypalFxRate || 520);
    return fx > 0 ? fx : 520;
  }

  function crcToUsd(crc) {
    const fx = getFxRate();
    const usd = Number(crc || 0) / fx;
    // redondeo a 2 decimales para plugins
    return Math.round(usd * 100) / 100;
  }

  function usdToCents(usd) {
    return Math.max(0, Math.round(Number(usd || 0) * 100));
  }

  function uidLike() {
    return "TX-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // =================== CheckoutSystem ===================
  const CheckoutSystem = {
    paypalRendered: false,
    paypalSdkLoaded: false,

    init() {
      // 1) seguridad básica: si no hay carrito -> pa' fuera
      this._guardCarritoNoVacio();

      // 2) resumen
      this._renderResumen();

      // 3) flow de pasos (shipping -> pago)
      this._bindSteps();

      // 4) métodos de pago UI
      this._bindMetodosPago();

      // 6) autocompletar shipping si hay sesión
      this._prefillShippingFromUser();

      // 7) submit tarjeta
      // const form = document.getElementById("card-form");
      // if (form) {
      //   form.addEventListener("submit", async (e) => {
      //     e.preventDefault();
      //     await this._pagarConTarjeta();
      //   });
      // }

      // 8) si el user vuelve a esta página y ya había shipping guardado, lo ponemos
      this._hydrateShippingFromStorage();
    },

  // =================== seguridad ===================
  
  /**
   * Genera y verifica CSRF token
   * Nota: En una app real, esto vincularía con sesión del servidor
   */
  _getCsrfToken() {
    let token = sessionStorage.getItem("fyz_csrf_token");
    if (!token) {
      token = "csrf_" + Math.random().toString(36).substring(2, 15) + Date.now();
      sessionStorage.setItem("fyz_csrf_token", token);
    }
    return token;
  },

  /**
   * Sanitiza entradas de usuario para prevenir XSS
   */
  _sanitizeInput(input) {
    if (typeof input !== "string") return input;
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Valida email format
   */
  _isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email || "").toLowerCase());
  },

  /**
   * Valida teléfono (básico)
   */
  _isValidPhone(phone) {
    const re = /^[\d\s+()-]{8,20}$/;
    return re.test(String(phone || ""));
  },

  /**
   * Valida dirección (no vacía, no inyección)
   */
  _isValidAddress(addr) {
    return String(addr || "").trim().length >= 5 && String(addr).length <= 200;
  },

  // =================== carrito / totales ===================
    _leerCarrito() {
      try {
        return JSON.parse(localStorage.getItem("fyz_carrito") || "[]");
      } catch {
        return [];
      }
    },

    _calcularTotales() {
      const items = this._leerCarrito();
      const subtotal = items.reduce((acc, it) =>
        acc + (Number(it.precio) || 0) * (Number(it.cantidad) || 1), 0
      );
      const envio = 0; // gratis por ahora
      const total = Math.max(0, Math.round(subtotal + envio));
      return { items, subtotal: Math.round(subtotal), envio, total };
    },

    _renderResumen() {
      const { items, subtotal, total } = this._calcularTotales();

      const list = document.getElementById("summary-items") || document.getElementById("order-items");
      if (list) {
        if (!items.length) {
          list.innerHTML = `
            <div class="empty-summary">
              <i class="fas fa-shopping-cart"></i>
              <p>No hay productos en el carrito</p>
            </div>
          `;
        } else {
          list.innerHTML = items.map((it) => {
            const precio = Number(it.precio) || 0;
            const cantidad = Number(it.cantidad) || 1;
            const sub = precio * cantidad;
            const precioOriginal = (it.precioOriginal != null) ? Number(it.precioOriginal) : null;
            const tieneDescuento = (precioOriginal != null && precioOriginal > precio);
            const descuento = Number(it.descuento) || 0;
            
            let precioHTML = `<p class="item-price">${formatCRC(precio)}</p>`;
            if (tieneDescuento) {
              precioHTML = `
                <div class="item-price-section">
                  <span class="item-price-original">${formatCRC(precioOriginal)}</span>
                  <span class="item-price">${formatCRC(precio)}</span>
                  ${descuento > 0 ? `<span class="item-discount">-${descuento}%</span>` : ''}
                </div>
              `;
            }
            
            return `
              <div class="order-item">
                <div class="item-image">
                  <img src="${esc(it.imagen)}" alt="${esc(it.nombre)}" onerror="this.src='https://via.placeholder.com/80'">
                </div>
                <div class="item-details">
                  <h4 class="item-name">${esc(it.nombre)}</h4>
                  <div class="item-meta">
                    <span class="qty">x${cantidad}</span>
                    <span>${formatCRC(precio)}</span>
                  </div>
                  ${tieneDescuento ? `<div style="margin-top: 0.5rem;">${precioHTML}</div>` : ''}
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <div class="item-price">${formatCRC(sub)}</div>
                </div>
              </div>
            `;
          }).join("");
        }
      }

      setText("summary-subtotal", formatCRC(subtotal));
      const ship = document.getElementById("summary-shipping");
      if (ship) {
        ship.textContent = "Gratis";
        ship.classList.add("free-shipping");
      }
      setText("summary-total", formatCRC(total));

      // tipcito: mostrar también el equivalente en USD (solo informativo)
      const eq = document.getElementById("summary-total-usd");
      if (eq) {
        const usd = crcToUsd(total);
        eq.textContent = `(${formatUSD(usd)} aprox.)`;
      }
    },

    _guardCarritoNoVacio() {
      const { items } = this._calcularTotales();
      if (items && items.length) return;

      // pequeña espera para que cargue UI
      setTimeout(() => {
        alert("Tu carrito está vacío. Agregá productos antes de pagar.");
        window.location.href = "carrito.html";
      }, 300);
    },

    // =================== pasos checkout ===================
    _bindSteps() {
      const shippingSection = document.getElementById("shipping-section");
      const paymentSection = document.getElementById("payment-section");
      const backToCartBtn = document.getElementById("back-to-cart");
      const continueBtn = document.getElementById("continue-to-payment");

      if (backToCartBtn) {
        backToCartBtn.addEventListener("click", () => {
          window.location.href = "carrito.html";
        });
      }

      if (continueBtn) {
        continueBtn.addEventListener("click", async () => {
          const form = document.getElementById("shipping-form");
          if (!form) return;

          if (!form.checkValidity()) {
            form.reportValidity?.();
            alert("❌ Revisá los campos (faltan datos o están mal)");
            return;
          }

          // SECURITY: Validaciones adicionales
          const shipping = this._leerShippingFromForm();
          
          if (!this._isValidEmail(shipping.email)) {
            alert("❌ Email inválido");
            document.getElementById("shipping-email")?.focus();
            return;
          }

          if (!this._isValidPhone(shipping.phone)) {
            alert("❌ Teléfono inválido (mínimo 8 dígitos)");
            document.getElementById("shipping-phone")?.focus();
            return;
          }

          if (!this._isValidAddress(shipping.address)) {
            alert("❌ Dirección inválida (mínimo 5 caracteres)");
            document.getElementById("shipping-address")?.focus();
            return;
          }

          if (!shipping.firstName?.trim() || !shipping.lastName?.trim()) {
            alert("❌ Nombre y apellido requeridos");
            return;
          }

          if (shipping.firstName.length > 50 || shipping.lastName.length > 50) {
            alert("❌ Nombre/Apellido muy largo");
            return;
          }

          // guardar shipping para usarlo al registrar el pedido
          this._guardarShippingEnStorage();

          // mover a paso pago
          if (shippingSection) shippingSection.style.display = "none";
          if (paymentSection) paymentSection.style.display = "block";
          this._setStepActive(2); // 1=carrito,2=info,3=pago,4=confirmación (según HTML)

          // asegurar PayPal listo cuando se ve el paso pago
          await this._initPaypal(true);
          // marcar paso pago en storage (para refresh)
          localStorage.setItem("fyz_checkout_step","payment");

        });
      }

      
      // volver a editar envío desde el paso de pago
      const editShippingBtn = document.getElementById("edit-shipping-btn");
      if (editShippingBtn) {
        editShippingBtn.addEventListener("click", () => {
          if (paymentSection) paymentSection.style.display = "none";
          if (shippingSection) shippingSection.style.display = "block";
          // limpiar flag de paso pago
          localStorage.removeItem("fyz_checkout_step");
          this._setStepActive(1); // vuelve a info/envío
          // scroll suave al formulario
          shippingSection?.scrollIntoView?.({ behavior: "smooth", block: "start" });
        });
      }
// si el usuario recarga estando en el paso pago, mantenerlo (si existe flag)
      const goPay = localStorage.getItem("fyz_checkout_step") === "payment";
      if (goPay && shippingSection && paymentSection) {
        shippingSection.style.display = "none";
        paymentSection.style.display = "block";
        this._setStepActive(2);
        this._initPaypal(false);
      }
    },

    _setStepActive(stepIndexZeroBased) {
      const steps = document.querySelectorAll(".checkout-steps .step");
      steps.forEach((s, idx) => {
        if (idx <= stepIndexZeroBased) s.classList.add("active");
        else s.classList.remove("active");
      });
      // guardamos estado simple
      if (stepIndexZeroBased >= 2) localStorage.setItem("fyz_checkout_step", "payment");
      else localStorage.removeItem("fyz_checkout_step");
    },

    // =================== shipping (guardar / cargar) ===================
    _leerShippingFromForm() {
      const g = (id) => (document.getElementById(id) || {}).value || "";
      return {
        firstName: g("shipping-first-name").trim(),
        lastName: g("shipping-last-name").trim(),
        email: g("shipping-email").trim(),
        phone: g("shipping-phone").trim(),
        address: g("shipping-address").trim(),
        city: g("shipping-city").trim(),
        zip: g("shipping-zip").trim(),
        country: (document.getElementById("shipping-country") || {}).value || "Costa Rica"
      };
    },

    _guardarShippingEnStorage() {
      const shipping = this._leerShippingFromForm();
      localStorage.setItem("fyz_checkout_shipping", JSON.stringify(shipping));
    },

    _hydrateShippingFromStorage() {
      try {
        const raw = localStorage.getItem("fyz_checkout_shipping");
        if (!raw) return;
        const s = JSON.parse(raw);
        const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };

        set("shipping-first-name", s.firstName);
        set("shipping-last-name", s.lastName);
        set("shipping-email", s.email);
        set("shipping-phone", s.phone);
        set("shipping-address", s.address);
        set("shipping-city", s.city);
        set("shipping-zip", s.zip);
        set("shipping-country", s.country);
      } catch {}
    },

    _prefillShippingFromUser() {
      if (typeof auth === "undefined" || !auth) return;

      // esperar auth state (currentUser a veces tarda)
      auth.onAuthStateChanged(async (user) => {
        if (!user) return;

        // set email aunque no haya doc
        const emailEl = document.getElementById("shipping-email");
        if (emailEl && !emailEl.value) emailEl.value = user.email || "";

        if (typeof db === "undefined" || !db) return;

        try {
          const doc = await db.collection("usuarios").doc(user.uid).get();
          if (!doc.exists) return;

          const u = doc.data() || {};
          if (u.nombre) {
            const parts = String(u.nombre).trim().split(/\s+/);
            const first = parts[0] || "";
            const last = parts.slice(1).join(" ") || "";
            const fn = document.getElementById("shipping-first-name");
            const ln = document.getElementById("shipping-last-name");
            if (fn && !fn.value) fn.value = first;
            if (ln && !ln.value) ln.value = last;
          }
          const tel = document.getElementById("shipping-phone");
          if (tel && !tel.value && u.telefono) tel.value = u.telefono;

          const dir = document.getElementById("shipping-address");
          if (dir && !dir.value && u.direccion) dir.value = u.direccion;

        } catch (e) {
          console.warn("prefillShippingFromUser error:", e);
        }
      });
    },

    // =================== métodos de pago UI ===================
    _bindMetodosPago() {
      const methods = document.querySelectorAll(".payment-method");
      const contents = document.querySelectorAll(".method-content");

      methods.forEach((m) => {
        m.addEventListener("click", async () => {
          methods.forEach((x) => x.classList.remove("active"));
          m.classList.add("active");

          const method = m.dataset.method;
          contents.forEach((c) => c.classList.remove("active"));
          const target = document.getElementById(`${method}-content`);
          if (target) target.classList.add("active");

          // si vuelven a PayPal, re-render si hace falta
          if (method === "paypal") await this._initPaypal(false);
          
          // si seleccionan 2Checkout, inicializar
          if (method === "2checkout") await this._init2Checkout();
        });
      });
    },

    // =================== PAYPAL ===================
    async _loadPayPalSdk() {
      if (typeof paypal !== "undefined") {
        this.paypalSdkLoaded = true;
        console.log("✅ PayPal SDK ya estaba cargado");
        return true;
      }

      const cfg = getCfg();
      const clientId = cfg.paypalClientId;
      const paypalCurrency = String(cfg.paypalCurrency || "USD").toUpperCase();
      const env = String(cfg.paypalEnv || "sandbox").toLowerCase();

      if (!clientId || clientId.includes("PON_AQUI")) {
        console.error("❌ FALTA: PAYPAL clientId en window.PAYMENTS_CONFIG");
        return false;
      }

      return new Promise((resolve) => {
        console.log("📥 Cargando PayPal SDK...");
        const s = document.createElement("script");
        const base = "https://www.paypal.com/sdk/js";
        const params = new URLSearchParams({
          "client-id": clientId,
          currency: paypalCurrency,
          intent: "capture",
          components: "buttons",
          locale: "es_ES",
          "disable-funding": "paylater"
        });
        if (env === "sandbox") {
          params.set("debug", "true");
        }
        s.src = `${base}?${params.toString()}`;
        s.async = true;
        s.onload = () => {
          this.paypalSdkLoaded = true;
          console.log("✅ PayPal SDK cargado correctamente");
          resolve(true);
        };
        s.onerror = (err) => {
          console.error("❌ Error cargando PayPal SDK:", err);
          resolve(false);
        };
        document.head.appendChild(s);
      });
    },

    _showCheckoutError(msg) {
      const box = document.getElementById("checkout-error");
      if (box) {
        box.textContent = msg;
        box.style.display = "block";
      } else {
        alert(msg);
      }
    },

    _clearCheckoutError() {
      const box = document.getElementById("checkout-error");
      if (box) box.style.display = "none";
    },

    async _init2Checkout() {
      const container = document.getElementById("2checkout-button-container");
      const form = document.getElementById("payment-method-form");
      
      if (!container || !form) {
        console.log("❌ 2Checkout container or form not found");
        return;
      }

      const cfg = window.PAYMENTS_CONFIG || {};
      const merchantCode = cfg.twoCheckoutMerchantCode;
      const publicKey = cfg.twoCheckoutPublicKey;

      if (!merchantCode || !publicKey) {
        console.warn("⚠️ 2Checkout keys missing in PAYMENTS_CONFIG");
        container.innerHTML = `<div style="color:red; padding:10px;">❌ 2Checkout no configurado</div>`;
        return;
      }

      const { total } = this._calcularTotales();
      if (total <= 0) {
        container.innerHTML = `<div style="padding:10px;">Agregá productos al carrito</div>`;
        return;
      }

      // Cargar SDK si no existe
      if (typeof TwoCheckout === "undefined") {
        console.log("📥 Cargando 2Checkout SDK...");
        await this._load2CheckoutSdk();
        
        if (typeof TwoCheckout === "undefined") {
          container.innerHTML = `<div style="color:red; padding:10px;">❌ 2Checkout SDK no disponible</div>`;
          return;
        }
      }

      try {
        TwoCheckout.setPublishableKey(publicKey);

        // Mostrar el formulario
        form.style.display = "block";

        // Crear botón de pago
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-pay btn-2checkout";
        btn.innerHTML = `<i class="fas fa-credit-card"></i> Pagar ${formatCRC(total)}`;
        btn.onclick = (e) => this._handle2CheckoutPayment(e);
        
        // Limpiar contenedor y agregar botón
        container.innerHTML = "";
        container.appendChild(btn);
        
        console.log("✅ 2Checkout iniciado correctamente");
      } catch (error) {
        console.error("Error iniciando 2Checkout:", error);
        container.innerHTML = `<div style="color:red; padding:10px;">❌ Error: ${error.message}</div>`;
      }
    },

    async _load2CheckoutSdk() {
      return new Promise((resolve) => {
        // Si ya existe, resolver inmediatamente
        if (typeof TwoCheckout !== "undefined") {
          resolve(true);
          return;
        }

        // Crear script
        const script = document.createElement("script");
        script.src = "https://www.2checkout.com/static/v1/2checkout.js";
        script.async = true;

        script.onload = () => {
          console.log("✅ 2Checkout SDK cargado");
          resolve(true);
        };

        script.onerror = (err) => {
          console.error("❌ Error cargando 2Checkout SDK:", err);
          resolve(false);
        };

        document.head.appendChild(script);
      });
    },

    async _handle2CheckoutPayment(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const { total, items } = this._calcularTotales();

      if (!this._validateFormData()) {
        this._showCheckoutError("❌ Por favor completa la información de envío");
        return;
      }

      const form = document.getElementById("payment-method-form");
      if (!form) {
        this._showCheckoutError("❌ Formulario de pago no encontrado");
        return;
      }

      const cardNumber = form.cardNumber?.value?.replace(/\s/g, "") || "";
      const expMonth = form.expMonth?.value || "";
      const expYear = form.expYear?.value || "";
      const cvv = form.cvv?.value || "";

      // Validar campos
      if (!cardNumber || cardNumber.length < 13) {
        this._showCheckoutError("❌ Número de tarjeta inválido");
        return;
      }
      
      if (!expMonth || !expYear) {
        this._showCheckoutError("❌ Fecha de expiración incompleta");
        return;
      }
      
      if (!cvv || cvv.length < 3) {
        this._showCheckoutError("❌ CVV inválido");
        return;
      }

      try {
        this._showCheckoutError("Procesando pago...");
        const token = await this._get2CheckoutToken(cardNumber, expMonth, expYear, cvv);
        this._clearCheckoutError();
        await this._process2CheckoutPayment(token, total, items);
      } catch (error) {
        console.error("2Checkout error:", error);
        this._showCheckoutError("❌ Error: " + (error.message || "Unknown error"));
      }
    },

    async _get2CheckoutToken(cardNumber, expMonth, expYear, cvv) {
      return new Promise((resolve, reject) => {
        TwoCheckout.tokenize({
          sellerId: window.PAYMENTS_CONFIG.twoCheckoutMerchantCode,
          publishableKey: window.PAYMENTS_CONFIG.twoCheckoutPublicKey,
          ccNo: cardNumber,
          expMonth: expMonth,
          expYear: expYear,
          cvv: cvv
        }, (response) => {
          if (response.success) {
            resolve(response.token);
          } else {
            reject(new Error(response.errorMsg || "Token generation failed"));
          }
        });
      });
    },

    async _process2CheckoutPayment(token, total, items) {
      const shipping = this._leerShippingFromForm();
      const payload = {
        amount: Math.round(total),
        currency: "CRC",
        token: token,
        items: items.map(item => ({
          id: this._sanitizeInput(item.id),
          name: this._sanitizeInput(item.name),
          price: item.price,
          qty: item.qty
        })),
        shipping: {
          name: this._sanitizeInput(shipping.name),
          email: this._sanitizeInput(shipping.email),
          phone: this._sanitizeInput(shipping.phone),
          address: this._sanitizeInput(shipping.address)
        }
      };

      try {
        const response = await fetch("/api/create2CheckoutIntent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Payment failed");
        }

        const data = await response.json();
        window.location.href = `confirmacion.html?orderId=${data.orderId}`;
      } catch (error) {
        console.error("Error:", error);
        alert("❌ Error: " + error.message);
      }
    },

    async _initPaypal(forceRerender) {
      const container = document.getElementById("paypal-button-container");
      if (!container) return;

      const ok = await this._loadPayPalSdk();
      if (!ok || typeof paypal === "undefined") {
        container.innerHTML = `<div style="color:red; padding:10px;">❌ PayPal SDK no cargó. Probá sin AdBlock.</div>`;
        return;
      }

      if (this.paypalRendered && forceRerender) {
        container.innerHTML = "";
        this.paypalRendered = false;
      }
      if (this.paypalRendered) return;

      const { total, items } = this._calcularTotales();
      if (!items.length || total <= 0) {
        container.innerHTML = `<div class="empty-summary" style="margin-top:12px;"><p>Agregá productos al carrito para pagar.</p></div>`;
        return;
      }

      const usdTotal = crcToUsd(total);

      try {
        paypal.Buttons({
          locale: "es_ES",
          style: { layout: "vertical" },

          createOrder: async (data, actions) => {
            this._clearCheckoutError();
            // shipping debe estar OK antes de cobrar
            this._asegurarShippingListo();

            // validar stock antes de crear orden
            await this._validarStockDisponible();

            // Recalcular total en caso de que el carrito cambie (seguridad)
            const again = this._calcularTotales();
            const usd = crcToUsd(again.total);
            if (!usd || !isFinite(usd) || usd <= 0) {
              throw new Error("Total USD inválido");
            }

            console.log("📦 PayPal creating order for USD:", usd);
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [{
                amount: { 
                  currency_code: "USD", 
                  value: String(usd.toFixed(2))
                },
                description: "Compra en F&Z Store"
              }]
            });
          },

          onApprove: async (data, actions) => {
            try {
              console.log("✅ PayPal approved, capturing order...");
              const details = await actions.order.capture();
              
              // Captura real suele venir en purchase_units[0].payments.captures[0].id
              const captureId =
                details?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                details?.purchase_units?.[0]?.payments?.captures?.[0]?.status ||
                details?.id ||
                data?.orderID ||
                uidLike();

              const status = String(details?.status || "").toUpperCase();
              console.log("📋 PayPal order status:", status);
              
              if (status && status !== "COMPLETED") {
                throw new Error("PayPal status: " + status);
              }

              const pedidoId = await this._postPago({
                metodo: "paypal",
                idTransaccion: captureId,
                totalCRC: total,
                totalUSD: usdTotal,
                fxRate: getFxRate()
              });

              console.log("✅ Pedido registrado:", pedidoId);
              window.location.href = pedidoId
                ? ("confirmacion.html?id=" + encodeURIComponent(pedidoId))
                : "confirmacion.html";
            } catch (err) {
              console.error("❌ PayPal capture error:", err);
              const msg = (err && (err.message || err.toString())) ? String(err.message || err.toString()) : "";
              this._showCheckoutError(
                "❌ No se pudo completar el pago con PayPal." + (msg ? " Error: " + msg : "") +
                "\n\nSoluciones:\n- Probá sin AdBlock\n- Abrí en modo incógnito\n- Revisá que tengas saldo en PayPal\n- Recargá la página si falla el botón"
              );
            }
          },

          onError: (err) => {
            console.error("❌ PayPal error:", err);
            this._showCheckoutError(
              "❌ Error de PayPal.\n\nProbá:\n- Desactivar AdBlock\n- Modo incógnito\n- Otra tarjeta o método de pago\n\nSi persiste, revisá la consola (F12)."
            );
          },

          onCancel: () => {
            console.log("⚠️ PayPal cancelled by user");
            this._showCheckoutError("Cancelaste el pago en PayPal. Podés intentar de nuevo.");
          }
        }).render("#paypal-button-container").catch((err) => {
          console.error("❌ PayPal Buttons render error:", err);
          container.innerHTML = `<div style="color:red; padding:10px;">❌ Error renderizando botón PayPal. Probá sin AdBlock.</div>`;
        });

        this.paypalRendered = true;
      } catch (err) {
        console.error("❌ PayPal init error:", err);
        this._showCheckoutError("Error inicializando PayPal: " + String(err.message || err));
      }
    },

    inicializarPayPal() {
      // compat con scripts viejos
      return this._initPaypal(true);
    },

    _asegurarShippingListo() {
      const form = document.getElementById("shipping-form");
      if (!form) return true;
      if (!form.checkValidity()) {
        form.reportValidity?.();
        throw new Error("Shipping inválido");
      }
      this._guardarShippingEnStorage();
      return true;
    },

    _functionsUrl(path) {
      // En Vercel, los endpoints están en /api/...
      // En desarrollo local (localhost), también funcionan
      if (typeof window !== "undefined" && window.location) {
        const origin = window.location.origin; // ej: https://fyz-store.vercel.app o http://localhost:5500
        return `${origin}/api/${path}`;
      }
      return null;
    },

    async _crearPaymentIntent({ amountCents, currency, totalCRC, fxRate, items }) {
      const url = this._functionsUrl("createPaymentIntent");
      if (!url) throw new Error("No se pudo armar URL del endpoint.");

      // SECURITY: Validaciones locales antes de enviar
      const safeAmount = Math.floor(Number(amountCents) || 0);
      const safeCurrency = String(currency || "usd").toLowerCase();
      
      if (safeAmount < 50 || safeAmount > 9999999) {
        throw new Error("Monto inválido");
      }

      if (!["usd", "eur", "gbp"].includes(safeCurrency)) {
        throw new Error("Moneda no soportada");
      }

      console.log("🔗 URL del endpoint:", url);
      console.log("📦 Payload:", { amountCents: safeAmount, currency: safeCurrency, itemsCount: items?.length });

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest" // Protección adicional contra CSRF
        },
        body: JSON.stringify({
          amountCents: safeAmount,
          currency: safeCurrency,
          totalCRC: Number(totalCRC) || 0,
          fxRate: Number(fxRate) || getFxRate(),
          items: (items || []).map(it => ({
            id: String(it.id).substring(0, 50),
            nombre: String(it.nombre || "").substring(0, 100),
            cantidad: Math.max(1, Math.floor(Number(it.cantidad) || 1)),
            precioCRC: Math.max(0, Math.floor(Number(it.precio) || 0))
          }))
        })
      });

      console.log("📡 Response status:", res.status, res.statusText);
      const data = await res.json().catch((e) => {
        console.error("❌ JSON parse error:", e);
        return {};
      });
      console.log("📋 Response data:", data);

      if (!res.ok) {
        const errMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(`Endpoint error: ${errMsg}`);
      }
      return data;
    },

    // =================== post-pago ===================
    async _postPago({ metodo, idTransaccion, totalCRC, totalUSD, fxRate }) {
      // descontar stock
      await this._descontarStockEnCompra();

      // registrar pedido
      const pedidoId = await this._registrarPedido({ metodo, idTransaccion, totalCRC, totalUSD, fxRate });

      // guardar confirmación local (para confirmacion.html)
      // guardar confirmación local (para confirmacion.html) + snapshot (items/envío)
      const items = this._leerCarrito();
      let shipping = null;
      try { shipping = JSON.parse(localStorage.getItem("fyz_checkout_shipping") || "null"); } catch {}
      this._guardarConfirmacion({ pedidoId, metodo, idTransaccion, totalCRC, totalUSD, fxRate, items, shipping });

      // limpiar carrito + step
      this._limpiarCarrito();
      localStorage.removeItem("fyz_checkout_step");

      return pedidoId;
    },

    // =================== stock ===================
    async _validarStockDisponible() {
      const items = this._leerCarrito();
      if (!items.length) throw new Error("Carrito vacío");

      if (typeof db === "undefined" || !db) {
        console.warn("⚠️ Firestore no disponible; no se pudo validar stock.");
        return true;
      }

      for (const it of items) {
        const id = String(it.id);
        const qty = Math.max(1, parseInt(it.cantidad, 10) || 1);

        const snap = await db.collection("productos").doc(id).get();
        if (!snap.exists) throw new Error(`Producto no existe: ${id}`);

        const stock = Number((snap.data() || {}).stock ?? 0);
        if (stock < qty) throw new Error(`Stock insuficiente para "${it.nombre}".`);
      }

      return true;
    },

    async _descontarStockEnCompra() {
      const items = this._leerCarrito();
      if (!items.length) throw new Error("Carrito vacío");

      if (typeof db === "undefined" || !db) {
        console.warn("⚠️ Firestore no disponible; no se puede descontar stock.");
        return true;
      }

      await db.runTransaction(async (tx) => {
        const refs = items.map(it => db.collection("productos").doc(String(it.id)));
        const snaps = await Promise.all(refs.map(r => tx.get(r)));

        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const qty = Math.max(1, parseInt(it.cantidad, 10) || 1);
          const snap = snaps[i];

          if (!snap.exists) throw new Error(`Producto no existe: ${String(it.id)}`);

          const stock = Number((snap.data() || {}).stock ?? 0);
          if (stock < qty) throw new Error(`Stock insuficiente para "${it.nombre}".`);
        }

        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const qty = Math.max(1, parseInt(it.cantidad, 10) || 1);

          const ref = refs[i];
          const snap = snaps[i];
          const stock = Number((snap.data() || {}).stock ?? 0);

          tx.update(ref, { stock: stock - qty });
        }
      });

      return true;
    },

    // =================== pedidos ===================
    async _registrarPedido({ metodo, idTransaccion, totalCRC, totalUSD, fxRate }) {
      try {
        if (typeof db === "undefined" || !db) return;

        const user = (typeof auth !== "undefined" && auth) ? auth.currentUser : null;
        const items = this._leerCarrito();
        if (!items.length) return;

        let shipping = null;
        try {
          shipping = JSON.parse(localStorage.getItem("fyz_checkout_shipping") || "null");
        } catch {}

        const ref = await db.collection("pedidos").add({
          usuarioId: user ? user.uid : null,
          email: user ? user.email : (shipping?.email || null),
          shipping: shipping || null,

          items,
          totalCRC: Number(totalCRC) || 0,
          totalUSD: Number(totalUSD) || 0,
          fxRate: Number(fxRate) || getFxRate(),

          metodoPago: metodo,
          idTransaccion,

          estado: "pago_completado",
          historialEstados: [{ estado: "pago_completado", fecha: new Date().toISOString() }],

          fecha: new Date().toISOString()
        });

        console.log("✅ Pedido guardado");
        return ref.id;
      } catch (err) {
        console.error("❌ Error pedido:", err);
      }
    },

    _limpiarCarrito() {
      localStorage.removeItem("fyz_carrito");
    },

    _guardarConfirmacion({ pedidoId, metodo, idTransaccion, totalCRC, totalUSD, fxRate, items, shipping }) {
      localStorage.setItem("fyz_confirmacion_pago", JSON.stringify({
        pedidoId: pedidoId || null,
        metodoPago: metodo,
        idTransaccion,
        totalCRC,
        totalUSD,
        fxRate,
        items: Array.isArray(items) ? items : [],
        shipping: shipping || null,
        fecha: new Date().toISOString()
      }));
    }
  };

  // Export
  window.checkout = CheckoutSystem;

  document.addEventListener("DOMContentLoaded", () => {
    try {
      CheckoutSystem.init();
    } catch (e) {
      console.error("❌ Checkout init error:", e);
    }
  });
})();
