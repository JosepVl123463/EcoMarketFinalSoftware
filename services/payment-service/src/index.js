/**
 * EcoMarket Payment Service
 *
 * Handles payment processing via Stripe Checkout Sessions,
 * webhook verification, and order confirmation callbacks.
 *
 * Endpoints:
 *   POST /api/payments/create-session   — Create Stripe checkout
 *   POST /api/payments/webhook          — Stripe webhook receiver
 *   GET  /api/payments/health           — Health check
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ── Configuración crítica con fail-fast ─────────────────────────────────────
// Si falta cualquier secreto imprescindible, el servicio NO arranca. Antes se
// degradaba silenciosamente a secretos/valores conocidos ("fail-open"), lo que
// permitía firmar tokens o simular pagos exitosos.
const JWT_SECRET = process.env.JWT_SECRET;
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// El modo demo (pagos simulados) solo se activa con una bandera EXPLÍCITA y
// nunca en producción. Jamás se infiere de la ausencia de la clave de Stripe.
const DEMO_MODE = process.env.PAYMENTS_DEMO_MODE === 'true';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no está configurado.');
  process.exit(1);
}
if (!INTERNAL_SERVICE_SECRET) {
  console.error('FATAL: INTERNAL_SERVICE_SECRET no está configurado.');
  process.exit(1);
}
if (!STRIPE_SECRET_KEY && !DEMO_MODE) {
  console.error('FATAL: STRIPE_SECRET_KEY no está configurado (y PAYMENTS_DEMO_MODE no está activo).');
  process.exit(1);
}

const stripe = require('stripe')(STRIPE_SECRET_KEY || 'sk_test_placeholder_demo_mode');

const app = express();
const PORT = process.env.PORT || 8083;
const PRODUCT_SERVICE_HOST = process.env.PRODUCT_SERVICE_HOST || 'localhost';
const PRODUCT_SERVICE_PORT = process.env.PRODUCT_SERVICE_PORT || '8082';
const PRODUCT_SERVICE_URL = `http://${PRODUCT_SERVICE_HOST}:${PRODUCT_SERVICE_PORT}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `http://${process.env.NOTIFICATION_SERVICE_HOST || 'notification-service'}:${process.env.NOTIFICATION_SERVICE_PORT || '8086'}`;

// Cabeceras para llamadas internas autenticadas hacia product-service.
const INTERNAL_HEADERS = { 'X-Internal-Secret': INTERNAL_SERVICE_SECRET };

// Obtiene el pedido autoritativo desde product-service (total real, dueño).
async function fetchOrder(orderId) {
  const { data } = await axios.get(`${PRODUCT_SERVICE_URL}/api/orders/${orderId}`, { headers: INTERNAL_HEADERS });
  return data;
}

// CORS for frontend
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,https://ecomarket.pe').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Stripe webhook needs raw body — must be BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // La firma del webhook SIEMPRE se verifica. Si falta el secreto configurado o
  // la cabecera de firma, se rechaza la petición. Antes existía una rama de
  // "desarrollo" que se activaba con solo omitir la cabecera stripe-signature,
  // permitiendo falsificar eventos de pago (confirmar pedidos sin pagar).
  if (!endpointSecret || !sig) {
    return res.status(400).json({ error: 'Webhook no verificable' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      console.log(`✅ Payment succeeded for order: ${orderId}`);

      // Confirm order in product-service (decrement stock, update status)
      try {
        await axios.post(`${PRODUCT_SERVICE_URL}/api/orders/${orderId}/confirm`, {}, { headers: INTERNAL_HEADERS });
        console.log(`✅ Order ${orderId} confirmed in product-service.`);

        // Notify user via notification-service
        try {
          await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/push`, {
            user_id: session.metadata?.userId || 'unknown',
            title: '¡Pago Exitoso! 🌿',
            body: `Tu orden #${orderId.substring(0, 8)} ha sido procesada y el stock reservado.`,
            data: { orderId }
          }, { headers: INTERNAL_HEADERS });
          console.log(`🔔 Notification sent for order ${orderId}`);
        } catch (notifyErr) {
          console.warn(`⚠️ Failed to send notification: ${notifyErr.message}`);
        }

      } catch (err) {
        console.error(`❌ Failed to confirm order ${orderId}:`, err.message);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      console.warn(`❌ Payment failed: ${intent.last_payment_error?.message}`);
      break;
    }
    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Security headers (equivalente a helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// JSON parser for all other routes
app.use(express.json({ limit: '100kb' }));

// Rate limiting simple en memoria para pagos
const paymentAttempts = new Map();
const PAYMENT_RATE_LIMIT = 15;
const PAYMENT_WINDOW_MS = 60_000;

const paymentRateLimit = (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const bucket = paymentAttempts.get(key) || [];
  const recent = bucket.filter((t) => now - t < PAYMENT_WINDOW_MS);
  if (recent.length >= PAYMENT_RATE_LIMIT) {
    return res.status(429).json({ error: 'Demasiadas peticiones de pago. Intenta más tarde.' });
  }
  recent.push(now);
  paymentAttempts.set(key, recent);
  next();
};

// Middleware to verify JWT and extract userId
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado - Token faltante' });
  }

  const token = authHeader.substring(7);
  try {
    const jwt = require('jsonwebtoken');
    // Sin fallback de secreto: JWT_SECRET es obligatorio (validado al arrancar).
    const decoded = jwt.verify(token, Buffer.from(JWT_SECRET, 'base64'));
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * POST /api/payments/process-local
 * Processes a local simulated payment (Yape, Plin, TuPay, Card)
 * and confirms the order in product-service.
 */
app.post('/api/payments/process-local', paymentRateLimit, verifyJWT, async (req, res) => {
  try {
    // El monto NUNCA se toma del cliente: se obtiene del pedido en el servidor.
    const { orderId, method } = req.body;
    const userId = req.userId;

    if (!orderId || !method) {
      return res.status(400).json({ error: 'orderId y method son requeridos' });
    }

    // Recuperar el pedido autoritativo y verificar que pertenezca al usuario
    // autenticado (evita confirmar/pagar pedidos de terceros — IDOR).
    let order;
    try {
      order = await fetchOrder(orderId);
    } catch (err) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (String(order.customerId) !== String(userId)) {
      return res.status(403).json({ error: 'El pedido no pertenece al usuario' });
    }
    if (String(order.status).toLowerCase() === 'paid') {
      return res.status(409).json({ error: 'El pedido ya fue pagado' });
    }

    const amount = Number(order.totalAmount) || 0;

    // Confirmar el pedido en product-service (descuenta stock y marca pagado).
    // Se autentica con el secreto interno compartido.
    try {
      await axios.post(`${PRODUCT_SERVICE_URL}/api/orders/${orderId}/confirm`, {}, { headers: INTERNAL_HEADERS });
    } catch (err) {
      console.error(`❌ Failed to confirm order ${orderId}:`, err.message);
      return res.status(502).json({ error: 'No se pudo confirmar el pedido. No se realizó ningún cargo.' });
    }

    // Notificación (best-effort; su fallo no afecta al resultado del pago).
    try {
      const methodLabel = method === 'card' ? 'Tarjeta' : String(method).toUpperCase();
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/push`, {
        user_id: userId,
        title: '¡Pago Exitoso! 🌿',
        body: `Tu pago de S/. ${amount.toFixed(2)} con ${methodLabel} ha sido procesado. ¡Gracias por tu compra eco-amigable!`,
        data: { orderId, method },
      }, { headers: INTERNAL_HEADERS });
    } catch (notifyErr) {
      console.warn(`⚠️ Failed to send notification: ${notifyErr.message}`);
    }

    const transactionRef = `TXN-${String(method).toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    res.json({ success: true, orderId, method, transactionRef, message: 'Pago procesado exitosamente' });

  } catch (err) {
    // No se filtran detalles internos al cliente (se registran en el servidor).
    console.error('❌ Error processing local payment:', err.message);
    res.status(500).json({ error: 'Error interno al procesar el pago' });
  }
});

/**
 * POST /api/payments/create-session
 * Creates a Stripe Checkout Session for a given order.
 */
app.post('/api/payments/create-session', paymentRateLimit, verifyJWT, async (req, res) => {
  try {
    // Solo se acepta el orderId del cliente; el importe se calcula en servidor.
    const { orderId } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    // Recuperar el pedido autoritativo y verificar propiedad.
    let order;
    try {
      order = await fetchOrder(orderId);
    } catch (err) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (String(order.customerId) !== String(userId)) {
      return res.status(403).json({ error: 'El pedido no pertenece al usuario' });
    }
    const amountCents = Math.round((Number(order.totalAmount) || 0) * 100);
    if (amountCents <= 0) {
      return res.status(400).json({ error: 'El importe del pedido no es válido' });
    }

    // Modo demo: SOLO si PAYMENTS_DEMO_MODE=true (nunca inferido de la clave).
    if (DEMO_MODE) {
      return res.json({
        checkoutUrl: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/checkout'}?status=success&orderId=${orderId}`,
        sessionId: `demo_session_${uuidv4()}`,
        mode: 'demo',
      });
    }

    // Real Stripe Checkout Session. Clave de idempotencia derivada del pedido
    // para evitar sesiones/cobros duplicados ante reintentos.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pen',
            product_data: {
              name: `Orden EcoMarket #${String(orderId).substring(0, 8)}`,
              description: 'Productos auditados con certificación Ecomarket',
            },
            unit_amount: amountCents, // importe autoritativo del servidor (céntimos)
          },
          quantity: 1,
        },
      ],
      metadata: { orderId, userId },
      success_url: `${process.env.STRIPE_SUCCESS_URL}?orderId=${orderId}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}?orderId=${orderId}`,
    }, { idempotencyKey: `checkout_${orderId}` });

    res.json({ checkoutUrl: session.url, sessionId: session.id, mode: 'live' });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

/**
 * GET /api/payments/health — Health check endpoint.
 */
app.get('/api/payments/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('REPLACE')),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
  console.log(`   Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Demo Mode'}`);
  console.log(`   Product Service: ${PRODUCT_SERVICE_URL}`);
});
