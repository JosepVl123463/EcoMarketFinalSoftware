# 7. Frontend (aplicación web y móvil)

## 7.1 Tecnología

- **Next.js 16 + React 19** — framework moderno para aplicaciones web.
- **Tailwind CSS** — estilos y diseño responsive.
- **Zustand** — manejo del estado (sesión, carrito).
- **TanStack Query** — consultas a la API.
- **Axios** — cliente HTTP.

## 7.2 Características

- **Responsive:** se adapta a celular, tablet y escritorio.
- **Modo claro/oscuro.**
- **PWA instalable:** se puede instalar como app desde el navegador (Android, iPhone, PC), con ícono propio y funcionamiento tipo aplicación.
- **APK de Android:** empaquetada con **Capacitor** (proyecto en `apps/web/android`).
- **Barra de navegación inferior** en móvil (Inicio, Pedidos, Carrito, Cuenta), como una app real.
- **Seguridad en la interfaz:** validación de formularios, indicador de conexión segura, aviso de Bloq Mayús, bloqueo temporal tras varios intentos de login.

## 7.3 Pantallas principales

| Pantalla | Descripción |
|----------|-------------|
| **Inicio / Catálogo** | Hero + grid de productos con su Eco-Score, filtros por categoría y buscador |
| **Detalle de producto** | Información completa, trazabilidad y botón de compra |
| **Login** | Inicio de sesión con validación y seguridad reforzada |
| **Registro** | Alta de consumidor o productor; contraseña fuerte y aceptación de términos |
| **Carrito** | Panel lateral con los productos seleccionados |
| **Checkout** | Pago con Yape, Plin, TuPay o tarjeta |
| **Pedidos** | Historial de compras del usuario |
| **Perfil** | Datos de la cuenta |
| **Panel de administración** | Gestión de clientes, productores y auditoría de productos |

## 7.4 Estructura del proyecto (frontend)

```
apps/web/
├── src/
│   ├── app/            # Páginas (Next.js App Router)
│   │   ├── auth/       # Login y registro
│   │   ├── checkout/   # Pago
│   │   ├── orders/     # Pedidos
│   │   ├── admin/      # Panel de administración
│   │   └── privacidad/ # Política de privacidad
│   ├── components/     # Componentes reutilizables (Navbar, ProductCard, etc.)
│   ├── services/       # Llamadas a la API
│   ├── store/          # Estado (sesión, carrito)
│   └── lib/            # Utilidades (API, sanitización)
├── public/             # Recursos: manifest PWA, íconos, service worker
├── android/            # Proyecto Android (Capacitor) para el APK
└── capacitor.config.ts # Configuración del APK
```

## 7.5 App móvil (PWA y APK)

- **PWA:** el sitio incluye `manifest.webmanifest`, íconos y un *service worker*, por lo que es **instalable** directamente desde el navegador.
- **APK:** con Capacitor se genera una app nativa de Android que carga la web. Para compilarla se abre `apps/web/android` en **Android Studio** y se usa *Build → Generate APKs* (ver `apps/web/BUILD_APK.md`).
