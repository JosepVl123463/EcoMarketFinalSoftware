const http = require('http');

const PORT = process.env.PORT || 8080;

const SERVICES = [
  { prefix: '/api/auth',     host: process.env.AUTH_URL     || 'localhost', port: process.env.AUTH_PORT     || '8081' },
  { prefix: '/api/products', host: process.env.PRODUCT_URL  || 'localhost', port: process.env.PRODUCT_PORT  || '8082' },
  { prefix: '/api/payments', host: process.env.PAYMENT_URL  || 'localhost', port: process.env.PAYMENT_PORT  || '8083' },
  { prefix: '/api/audit',    host: process.env.AUDIT_URL    || 'localhost', port: process.env.AUDIT_PORT    || '8084' },
  { prefix: '/api/ai',       host: process.env.AI_URL       || 'localhost', port: process.env.AI_PORT       || '8085' },
  { prefix: '/api/orders',   host: process.env.PRODUCT_URL  || 'localhost', port: process.env.PRODUCT_PORT  || '8082' },
];

// Lista blanca de orígenes permitidos (CORS_ALLOWED_ORIGINS separada por comas).
// Antes se reflejaba cualquier Origin recibido junto con credenciales, lo que
// permitía a cualquier sitio hacer peticiones autenticadas contra la API.
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,https://ecomarket.pe')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  // Solo se refleja el Origin si está en la lista blanca.
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

const server = http.createServer((req, res) => {
  const origin = req.headers['origin'];
  const headers = corsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  const matched = SERVICES.find(s => req.url.startsWith(s.prefix));
  if (!matched) {
    res.writeHead(404, { ...headers, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'route not found' }));
  }

  const path = req.url.substring(matched.prefix.length) || '/';

  // Strip origin header so backend services don't do their own CORS validation
  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['origin'];

  const options = {
    hostname: matched.host,
    port: parseInt(matched.port, 10) || 80,
    path: path,
    method: req.method,
    headers: { ...forwardHeaders, host: matched.host },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const responseHeaders = {
      ...headers,
      ...proxyRes.headers,
    };
    // Gateway CORS headers override any backend CORS
    Object.keys(headers).forEach(key => { responseHeaders[key] = headers[key]; });
    delete responseHeaders['transfer-encoding'];

    let body = '';
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode, responseHeaders);
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${req.url}:`, err.message);
    res.writeHead(502, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'upstream error', detail: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  SERVICES.forEach(s => console.log(`  ${s.prefix} -> http://${s.host}:${s.port}`));
});
