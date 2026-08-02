# Cambios de seguridad y mejoras aplicadas — EcoMarket

Este documento registra las correcciones implementadas sobre el código, con
referencia a los identificadores de la auditoría (Propuesta de Mejoras). El
enfoque fue **endurecer para producción**: se eliminaron los atajos de demo del
cliente y se movió la autorización al backend.

## Resumen

- ✅ 14 hallazgos críticos corregidos
- ✅ Mayoría de hallazgos altos y medios corregidos
- ✅ App convertida en **PWA instalable** + proyecto **Capacitor** para APK
- ✅ Responsive real (viewport) y CSP endurecida
- ✅ Build del frontend verificado (`next build` correcto)

---

## Frontend (`apps/web`)

| ID | Cambio | Archivos |
|----|--------|----------|
| C-01 | Eliminada la puerta trasera de login; un fallo de auth ya no concede sesión | `src/app/auth/login/page.tsx` |
| C-02 | Quitado el "Google" simulado (login y registro); ahora usa flujo real o se deshabilita | `login/page.tsx`, `register/page.tsx`, `services/index.ts` |
| C-03 | Añadido `middleware.ts`: gating de rutas en servidor (`/admin`, `/checkout`, `/orders`, `/profile`, `/producer`) | `src/middleware.ts`, `store/authStore.ts` |
| C-04 | XSS del certificado corregido: todos los campos se escapan con `escapeHtml` | `components/admin/ProductAuditTab.tsx` |
| C-05 | El checkout ya no simula pago exitoso ante fallos; muestra error real | `app/checkout/page.tsx` |
| A-02 | Token reflejado en cookie `SameSite=Lax` solo para gating; API sigue usando cabecera Bearer | `store/authStore.ts` |
| A-03 | Ya no se guardan contraseñas ni datos de empresa en `localStorage` | `register/page.tsx` |
| A-04 | CSP: eliminado `unsafe-eval`; `connect-src` sin localhost en producción | `next.config.ts` |
| C-12 | El checkout ya no envía el `amount`; lo calcula el backend | `checkout/page.tsx`, `services/index.ts` |
| B-03 | Eliminado `console.log` de datos de la transacción | `checkout/page.tsx` |

## Responsive + PWA

- **Viewport** añadido (`export const viewport`) — imprescindible en móvil.
- **`manifest.webmanifest`**, iconos (`public/icons/`), **service worker** (`public/sw.js`)
  que **nunca cachea `/api/*`**, y registro condicional en producción.
- **Capacitor**: `capacitor.config.ts` + guía `apps/web/BUILD_APK.md` (dos vías:
  PWABuilder sin instalar nada, o Android Studio).

## auth-service (Java)

| ID | Cambio | Archivo |
|----|--------|---------|
| C-08 | El registro público fuerza rol `customer`; se ignora el rol del body | `service/AuthService.java`, `dto/RegisterRequest.java` |
| M-03 | El admin ya no se resetea en cada arranque; contraseña por `ADMIN_PASSWORD` o aleatoria; no se loguea | `config/DataInitializer.java` |
| A-01 | `X-Forwarded-For` solo se respeta con `TRUST_PROXY=true` | `security/RateLimitFilter.java` |
| C-07/C-14 | Secreto JWT sin valor por defecto (fail-fast) | `resources/application.yml` |

## product-service (Java)

| ID | Cambio | Archivo |
|----|--------|---------|
| C-09 | RBAC real: crear/editar → PROVIDER/ADMIN; auditar y stock → ADMIN | `config/SecurityConfig.java`, `security/JwtAuthFilter.java` |
| C-09b | El detalle público solo devuelve productos APROBADOS | `service/ProductService.java`, `controller/ProductController.java` |
| C-10 | IDOR corregido: el historial solo lo ve su dueño (o admin) | `controller/OrderController.java` |
| C-11 | Cantidad de pedido validada como entero ≥ 1 | `dto/CreateOrderRequest.java` |
| C-08 | `providerId` se deriva del JWT, no del body | `controller/ProductController.java`, `dto/CreateProductRequest.java` |
| C-07 | Confirmación de pago autenticada con secreto interno + idempotente | `controller/OrderController.java`, `service/OrderService.java` |
| A-3(java) | El filtro JWT ya no lanza 500 con tokens inválidos | `security/JwtAuthFilter.java` |
| M-1/M-2 | `show-sql` desactivado; JWT sin default | `resources/application.yml`, `security/JwtUtil.java` |

## payment-service (Node)

| ID | Cambio |
|----|--------|
| C-06 | La firma del webhook **siempre** se verifica; sin firma → 400 |
| C-12 | El monto se obtiene del pedido en el servidor (no del cliente) |
| C-07 | Verifica propiedad del pedido; confirma con secreto interno; idempotencia por estado |
| A-07 | Sin fallback de secreto JWT (fail-fast al arrancar) |
| A-08 | Modo demo solo con `PAYMENTS_DEMO_MODE=true` (nunca inferido) |
| M-06 | Los errores ya no exponen `details`/`err.message` al cliente |
| M-07 | `idempotencyKey` en las sesiones de Stripe |
| B-01 | `stripe` actualizado a `^17.5.0` |

## Servicios Python

| ID | Cambio | Archivo |
|----|--------|---------|
| C-13 | `aprobar`/`rechazar` exigen JWT con rol admin (PyJWT) | `audit-service/main.py` |
| C-13 | `notifications/push` exige secreto interno | `notification-service/main.py` |
| C-2 | `MONGO_URI` sin credenciales por defecto (fail-fast) | `audit-service/main.py` |
| M-2 | Errores internos no se reenvían al cliente | `audit-service/main.py` |
| M-1 | Saneo de saltos de línea en logs (anti log-injection) | `notification-service/main.py` |
| M-4 | CORS: si el origen es `*` se desactivan credenciales | `audit-service/main.py` |

## Gateway e infraestructura

| ID | Cambio | Archivo |
|----|--------|---------|
| A-05 | Gateway: CORS por lista blanca (no refleja cualquier origen) | `infra/cloud-gateway/index.js` |
| C-3 | Kong Admin API enlazada a loopback y sin publicar el puerto 8001 | `docker-compose.yml` |
| C-14 | `JWT_SECRET` de producción movido a `sync: false` (no versionado) | `render.yaml` |
| M-09 | Todos los contenedores corren como usuario **no root** | `*/Dockerfile` |

---

## Variables de entorno nuevas (producción)

Configúralas en el panel de Render / secret manager (nunca en el repo):

| Variable | Servicios | Descripción |
|----------|-----------|-------------|
| `JWT_SECRET` | auth, product, payment, audit | Secreto de firma JWT (Base64). **Rotar el anterior.** |
| `INTERNAL_SERVICE_SECRET` | product, payment, notification | Secreto para llamadas internas |
| `PAYMENTS_DEMO_MODE` | payment | `true` solo en entornos NO productivos |
| `ADMIN_PASSWORD` | auth | Contraseña inicial del admin (opcional) |
| `TRUST_PROXY` | auth, product | `true` si están detrás del gateway |
| `MONGO_URI` | audit | Cadena de conexión con credenciales fuertes |

> ⚠️ **Acción pendiente crítica:** rotar el `JWT_SECRET` anterior
> (`ecomarket-jwt-production-secret-2026`) y purgarlo del historial de git, ya
> que estuvo versionado y debe considerarse comprometido.

## Seguimiento recomendado (no bloqueante)

- CSP basada en `nonce` para eliminar también `unsafe-inline` de `script-src`.
- Migrar el token a cookie `httpOnly` emitida por el backend (elimina el
  almacenamiento del token en el cliente).
- Tokenización de tarjetas con Stripe Elements (sacar PAN/CVV del backend propio, PCI).
- Rate limiting con Redis (compartido entre réplicas).
- Renombrar `middleware.ts` → `proxy.ts` (convención nueva de Next 16).
