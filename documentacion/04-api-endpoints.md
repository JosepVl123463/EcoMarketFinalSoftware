# 4. API / Endpoints

Todas las peticiones pasan por el **API Gateway** y usan el prefijo `/api/...`. El sistema expone **26 endpoints**.

Convención de acceso:
- **Público:** no requiere iniciar sesión.
- **JWT:** requiere token de usuario autenticado.
- **JWT + rol:** requiere un rol específico (admin / proveedor).
- **Interno:** llamada entre servicios, protegida con secreto compartido.

## 4.1 auth-service — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Público | Registrar consumidor |
| POST | `/api/auth/register/producer` | Público | Registrar productor |
| POST | `/api/auth/login` | Público | Iniciar sesión |
| POST | `/api/auth/google` | Público | (Preparado) login con Google |
| GET | `/api/auth/me` | JWT | Datos del usuario autenticado |

## 4.2 product-service — `/api/products` y `/api/orders`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/products` | Público | Listar productos aprobados (con filtros) |
| GET | `/api/products/{id}` | Público | Detalle de un producto aprobado |
| POST | `/api/products` | JWT (proveedor/admin) | Crear producto |
| PUT | `/api/products/{id}` | JWT (proveedor/admin) | Editar producto |
| PATCH | `/api/products/{id}/stock` | JWT (admin) | Ajustar stock |
| POST | `/api/products/{id}/audit` | JWT (admin) | Aprobar / rechazar producto |
| POST | `/api/orders` | JWT | Crear pedido |
| GET | `/api/orders/{id}` | Interno | Consultar pedido (usado por pagos) |
| GET | `/api/orders/customer/{id}` | JWT (dueño/admin) | Historial de pedidos del cliente |
| POST | `/api/orders/{id}/confirm` | Interno | Confirmar pago del pedido |

## 4.3 payment-service — `/api/payments`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/payments/process-local` | JWT | Pago local (Yape, Plin, TuPay, tarjeta) |
| POST | `/api/payments/create-session` | JWT | Crear sesión de pago Stripe |
| POST | `/api/payments/webhook` | Firma Stripe | Recepción de eventos de Stripe |
| GET | `/api/payments/health` | Público | Estado del servicio |

## 4.4 audit-service — `/api/audit`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/audit/analyze` | (auth) | Analizar un producto |
| POST | `/api/audit/producer-analyze` | (auth) | Análisis para el productor |
| GET | `/api/audit/pending` | (auth) | Productos pendientes de auditoría |
| GET | `/api/audit/product/{id}` | (auth) | Auditoría de un producto |
| POST | `/api/audit/{id}/approve` | JWT (admin) | Aprobar producto |
| POST | `/api/audit/{id}/reject` | JWT (admin) | Rechazar producto |
| POST | `/api/audit/{id}/generate-certificate` | (auth) | Generar certificado PDF |
| GET | `/api/audit/health` | Público | Estado del servicio |

## 4.5 ai-engine — `/api/ai`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/ai/analyze` | Interno | Calcular Eco-Score de un producto |
| GET | `/health` | Público | Estado del servicio |

## 4.6 notification-service — `/api/notifications`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/notifications/push` | Interno | Enviar notificación al usuario |
| GET | `/health` | Público | Estado del servicio |
