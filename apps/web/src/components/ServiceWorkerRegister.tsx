'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker que habilita la instalación de la PWA y el soporte
 * offline del app shell. Solo se activa en producción y sobre HTTPS/localhost
 * (requisito de los navegadores para service workers).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* El fallo del SW no debe romper la app; la web sigue funcionando sin PWA. */
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
