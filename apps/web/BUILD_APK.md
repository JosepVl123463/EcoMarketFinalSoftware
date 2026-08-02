# Generar el APK de EcoMarket

La app web ya es una **PWA instalable** y, además, está preparada para empaquetarse
como **APK de Android** con Capacitor. Tienes dos caminos según lo que tengas instalado.

---

## Opción A — Sin instalar nada (la más rápida): PWABuilder

Como la web ya expone `manifest.webmanifest`, iconos y un service worker, puedes
generar un APK firmado desde el navegador:

1. Entra a **https://www.pwabuilder.com**
2. Pega la URL de tu despliegue: `https://eco-market-final-software-s2w6.vercel.app`
3. Pulsa **Start** → pestaña **Android** → **Generate Package**.
4. Descarga el `.apk` / `.aab` y (opcional) las claves de firma que te entrega.

También, en Android Chrome, los usuarios pueden pulsar **⋮ → Instalar aplicación**
y tendrán EcoMarket como app sin pasar por la Play Store.

---

## Opción B — APK nativo con Capacitor (requiere Android Studio)

Este equipo **no tiene el SDK de Android** (`ANDROID_HOME` está vacío), por eso el
`.apk` no se pudo compilar aquí. Con Android Studio instalado, el proceso es:

```bash
cd apps/web

# 1. Instalar Capacitor (una sola vez)
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicializar (si package.json aún no tiene la config; ya existe capacitor.config.ts)
npx cap init EcoMarket pe.ecomarket.app --web-dir=public

# 3. Añadir la plataforma Android (genera la carpeta android/)
npx cap add android

# 4. Sincronizar la configuración
npx cap sync android

# 5. Abrir en Android Studio
npx cap open android
```

En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Para un APK de **release firmado**:
`Build → Generate Signed Bundle / APK`, crea un keystore y sigue el asistente.

### Notas
- `capacitor.config.ts` apunta a la URL de Vercel (`server.url`). El APK es un
  contenedor que carga la web desplegada sobre HTTPS. Si prefieres una app 100%
  offline, habría que migrar el frontend a exportación estática (`output: 'export'`),
  lo cual exige quitar las rutas dinámicas de servidor.
- Los iconos de la app viven en `public/icons/`. Para regenerar los iconos nativos
  de Android tras cambiarlos: `npx @capacitor/assets generate --android`.
