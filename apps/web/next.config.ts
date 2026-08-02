import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// connect-src solo incluye localhost en desarrollo (fuera de producción).
const connectSrc = [
  "'self'",
  apiUrl,
  'https://api.stripe.com',
  ...(isProd ? [] : ['http://localhost:8000']),
].join(' ');

// Nota de seguridad: se elimina 'unsafe-eval' (ninguna dependencia lo requiere).
// 'unsafe-inline' se mantiene por ahora porque el runtime de Next.js (hidratación)
// y el script de tema inyectan scripts en línea; el siguiente paso de endurecimiento
// es migrar a CSP basada en nonce vía middleware. Aun así, esta CSP ya bloquea eval,
// orígenes externos no confiables y el embebido en iframes (frame-ancestors 'none').
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  output: isVercel ? undefined : 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProd
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
