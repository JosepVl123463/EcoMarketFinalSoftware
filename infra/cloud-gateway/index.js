/**
 * API Gateway de EcoMarket (punto de entrada único del backend).
 *
 * Enruta cada petición al microservicio correspondiente según el prefijo de la
 * ruta y aplica CORS de forma centralizada.
 *
 * Diseño para Render (servicios separados):
 *  - Cada servicio destino es un servicio web público de Render (HTTPS, 443).
 *  - Se reenvía la RUTA COMPLETA (/api/...): los servicios Spring/FastAPI mapean
 *    sus endpoints bajo /api/..., así que NO se recorta el prefijo.
 *  - Los hosts destino llegan por variables de entorno (AUTH_HOST, etc.),
 *    resueltas por Render con `fromService ... property: host`.
 */
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;

// host destino por prefijo. En Render son URLs públicas (HTTPS/443).
const SERVICES = [
  { prefix: '/api/auth',     host: process.env.AUTH_HOST },
  { prefix: '/api/products', host: process.env.PRODUCT_HOST },
  { prefix: '/api/orders',   host: process.env.PRODUCT_HOST },
  { prefix: '/api/payments', host: process.env.PAYMENT_HOST },
  { prefix: '/api/audit',    host: process.env.AUDIT_HOST },
  { prefix: '/api/ai',       host: process.env.AI_HOST },
];

// Si el host trae protocolo lo respetamos; si no, se asume HTTPS (Render 443).
// Para desarrollo local puede definirse, por ejemplo, http://localhost:8081.
function resolveTarget(host) {
  if (!host) return null;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    const u = new URL(host);
    return { protocol: u.protocol, hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80) };
  }
  // Render entrega el nombre "pelado" del servicio (p.ej. "ecomarket-auth-service").
  // El host público es <nombre>.onrender.com sobre HTTPS/443.
  const hostname = host.includes('.') ? host : `${host}.onrender.com`;
  return { protocol: 'https:', hostname, port: 443 };
}

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, X-Internal-Secret',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

const server = http.createServer((req, res) => {
  const origin = req.headers['origin'];
  const headers = corsHeaders(origin);

  // Health check propio del gateway (no depende de los demás servicios).
  if (req.url === '/healthz' || req.url === '/') {
    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'gateway' }));
  }

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  const matched = SERVICES.find((s) => req.url.startsWith(s.prefix));
  if (!matched) {
    res.writeHead(404, { ...headers, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'route not found' }));
  }

  const target = resolveTarget(matched.host);
  if (!target) {
    res.writeHead(502, { ...headers, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'upstream not configured', prefix: matched.prefix }));
  }

  // Se reenvía la ruta COMPLETA (sin recortar el prefijo).
  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['origin'];
  forwardHeaders['host'] = target.hostname; // SNI + enrutamiento correcto en Render

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    path: req.url,
    method: req.method,
    headers: forwardHeaders,
  };

  const client = target.protocol === 'https:' ? https : http;
  const proxyReq = client.request(options, (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers };
    // El CORS lo controla el gateway (sobrescribe cualquier CORS del backend).
    Object.keys(headers).forEach((k) => { responseHeaders[k] = headers[k]; });
    delete responseHeaders['transfer-encoding'];
    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${req.url}:`, err.message);
    res.writeHead(502, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'upstream error' }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  SERVICES.forEach((s) => console.log(`  ${s.prefix} -> ${s.host || '(sin configurar)'}`));
});
