// api/createPaymentIntent.js · Vercel Serverless Function
// Reemplaza la Cloud Function de Firebase
// Crea un Stripe PaymentIntent de forma segura en el servidor

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Forwarded-Host, X-URL-PATH, X-Requested-With, Content-Type, Authorization"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amountCents, currency, totalCRC, fxRate, items } = req.body;

    // Validaciones básicas
    if (!amountCents || amountCents < 50) {
      return res
        .status(400)
        .json({ error: "Monto inválido (mínimo USD 0.50 = 50 centavos)" });
    }

    if (!currency) {
      return res.status(400).json({ error: "Currency requerida" });
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amountCents) || 0),
      currency: String(currency || "usd").toLowerCase(),
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        totalCRC: Number(totalCRC) || 0,
        fxRate: Number(fxRate) || 520,
        itemCount: Array.isArray(items) ? items.length : 0
      }
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    return res.status(500).json({
      error: error.message || "Error creando PaymentIntent"
    });
  }
}
