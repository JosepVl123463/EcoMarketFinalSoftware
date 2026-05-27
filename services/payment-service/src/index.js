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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8083;
const PRODUCT_SERVICE_HOST = process.env.PRODUCT_SERVICE_HOST || 'localhost';
const PRODUCT_SERVICE_PORT = process.env.PRODUCT_SERVICE_PORT || '8082';
const PRODUCT_SERVICE_URL = `http://${PRODUCT_SERVICE_HOST}:${PRODUCT_SERVICE_PORT}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `http://${process.env.NOTIFICATION_SERVICE_HOST || 'notification-service'}:${process.env.NOTIFICATION_SERVICE_PORT || '8086'}`;

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

  let event;
  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Development fallback: parse raw body
      event = JSON.parse(req.body.toString());
    }
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
        await axios.post(`${PRODUCT_SERVICE_URL}/api/orders/${orderId}/confirm`);
        console.log(`✅ Order ${orderId} confirmed in product-service.`);

        // Notify user via notification-service
        try {
          await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/push`, {
            user_id: session.metadata?.userId || 'unknown',
            title: '¡Pago Exitoso! 🌿',
            body: `Tu orden #${orderId.substring(0, 8)} ha sido procesada y el stock reservado.`,
            data: { orderId }
          });
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
    // Simple verification (in production, use jsonwebtoken library with the same secret)
    // For this audit, we'll implement a basic check or use the 'jsonwebtoken' library if available
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
    const decoded = jwt.verify(token, Buffer.from(secret, 'base64'));
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
    const { orderId, method, paymentDetails, amount } = req.body;
    const userId = req.userId;

    if (!orderId || !method) {
      return res.status(400).json({ error: 'orderId y method son requeridos' });
    }

    console.log(`💳 Local payment processing [${method}] for order ${orderId}, amount: S/. ${amount}`);

    // Simulate database/API delay (1.2 seconds) to make it highly realistic
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Confirm order in product-service (this will decrement stock & update status in PG)
    try {
      await axios.post(`${PRODUCT_SERVICE_URL}/api/orders/${orderId}/confirm`);
      console.log(`✅ Order ${orderId} confirmed in product-service.`);
    } catch (err) {
      console.error(`❌ Failed to confirm order ${orderId} in product-service:`, err.message);
      return res.status(500).json({ error: 'Error al confirmar la orden en la base de datos', details: err.message });
    }

    // Trigger notification in notification-service
    try {
      let methodLabel = method === 'card' ? 'Tarjeta' : method.toUpperCase();
      let bodyText = `Tu pago de S/. ${(amount || 0).toFixed(2)} con ${methodLabel} ha sido procesado. ¡Gracias por tu compra eco-amigable!`;
      
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/push`, {
        user_id: userId,
        title: '¡Pago Exitoso! 🌿',
        body: bodyText,
        data: { orderId, method }
      });
      console.log(`🔔 Notification sent for local payment on order ${orderId}`);
    } catch (notifyErr) {
      console.warn(`⚠️ Failed to send notification: ${notifyErr.message}`);
    }

    // Return successful payment response
    const transactionRef = `TXN-${method.toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    res.json({
      success: true,
      orderId,
      method,
      transactionRef,
      message: 'Pago procesado exitosamente'
    });

  } catch (err) {
    console.error('❌ Error processing local payment:', err.message);
    res.status(500).json({ error: 'Error interno al procesar el pago', details: err.message });
  }
});

/**
 * POST /api/payments/create-session
 * Creates a Stripe Checkout Session for a given order.
 */
app.post('/api/payments/create-session', paymentRateLimit, verifyJWT, async (req, res) => {
  try {
    const { orderId, items, totalAmount } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }
    
    console.log(`💳 Creating session for user ${userId} and order ${orderId}`);

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('REPLACE') || stripeKey === 'sk_test_demo') {
      // Demo mode: return a mock checkout URL
      console.log(`🧪 Demo mode: creating mock session for order ${orderId}`);
      return res.json({
        checkoutUrl: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/checkout'}?status=success&orderId=${orderId}`,
        sessionId: `demo_session_${uuidv4()}`,
        mode: 'demo',
      });
    }

    // Real Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pen',
            product_data: {
              name: `Orden EcoMarket #${orderId.substring(0, 8)}`,
              description: 'Productos auditados con certificación Ecomarket',
            },
            unit_amount: Math.round((totalAmount || 0) * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: { orderId, userId },
      success_url: `${process.env.STRIPE_SUCCESS_URL}?orderId=${orderId}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}?orderId=${orderId}`,
    });

    console.log(`✅ Stripe session created: ${session.id} for order ${orderId}`);
    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: 'live',
    });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err.message);
    res.status(500).json({ error: 'Error al crear sesión de pago', details: err.message });
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
