'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    _turnstileLoading?: boolean;
  }
}

// Clave de test de Cloudflare (siempre pasa automáticamente, sin interacción del usuario).
// En producción reemplaza con NEXT_PUBLIC_TURNSTILE_SITE_KEY en .env
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function TurnstileWidget({ onSuccess, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token: unknown) => onSuccess(token as string),
      'error-callback': () => onError?.(),
      'expired-callback': () => {
        // El token expiró — limpia para que el usuario vuelva a verificar
        widgetIdRef.current = null;
        onError?.();
      },
      theme: 'light',
    });
  }, [onSuccess, onError]);

  useEffect(() => {
    // Si turnstile ya está cargado en window, renderiza directamente
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Evita agregar el script duplicado si ya está en el documento o cargando
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      // Script ya existe pero turnstile aún no está listo — espera el evento load
      existing.addEventListener('load', renderWidget);
      return () => existing.removeEventListener('load', renderWidget);
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return <div ref={containerRef} className="flex justify-center mt-1" />;
}
