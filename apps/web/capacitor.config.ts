import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración de Capacitor para empaquetar EcoMarket como aplicación Android (APK).
 *
 * Como la app es Next.js con renderizado en servidor, el APK actúa como un
 * contenedor nativo que carga la versión desplegada (enfoque server-based, no
 * requiere exportación estática). Cambia `server.url` por la URL de producción
 * de tu despliegue (Vercel) cuando generes el build definitivo.
 *
 * Requisito de seguridad: `androidScheme: 'https'` y `cleartext: false` fuerzan
 * que la app solo cargue contenido sobre HTTPS.
 */
const config: CapacitorConfig = {
  appId: 'pe.ecomarket.app',
  appName: 'EcoMarket',
  webDir: 'public',
  server: {
    url: 'https://eco-market-final-software-s2w6.vercel.app',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#FAF9F6',
  },
};

export default config;
