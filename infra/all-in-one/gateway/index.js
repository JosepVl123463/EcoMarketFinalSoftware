const http = require('http');
const PORT = process.env.PORT || 8080;
const SERVICES = [
  { prefix: '/api/auth',     port: 8081 },
  { prefix: '/api/products', port: 8082 },
  { prefix: '/api/payments', port: 8083 },
  { prefix: '/api/audit',    port: 8084 },
  { prefix: '/api/ai',       port: 8085 },
  { prefix: '/api/orders',   port: 8082 },
];
function corsHeaders(o) { return { 'Access-Control-Allow-Origin': o || '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Max-Age': '86400' }; }
const server = http.createServer((req, res) => {
  const h = corsHeaders(req.headers.origin);
  if (req.method === 'OPTIONS') { res.writeHead(204, h); return res.end(); }
  const m = SERVICES.find(s => req.url.startsWith(s.prefix));
  if (!m) { res.writeHead(404, h); return res.end('{}'); }
  const path = req.url.substring(m.prefix.length) || '/';
  const opt = { hostname: 'localhost', port: m.port, path, method: req.method, headers: { ...req.headers, host: 'localhost' } };
  delete opt.headers['origin'];
  const pr = http.request(opt, pr2 => { let b=''; pr2.on('data',c=>b+=c); pr2.on('end',()=>res.writeHead(pr2.statusCode,{...h,...pr2.headers}).end(b)); });
  pr.on('error',e=>{ res.writeHead(502,h); res.end(JSON.stringify({error:e.message})); });
  req.pipe(pr);
});
server.listen(PORT, () => console.log(`Gateway :${PORT}`));
