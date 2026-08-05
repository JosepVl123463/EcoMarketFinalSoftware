# 3. Microservicios (detalle)

## 3.1 🔐 auth-service — Autenticación
**Tecnología:** Java 17 · Spring Boot · Spring Security · JWT · PostgreSQL

Responsable de la **identidad y seguridad** de los usuarios.

**Funciones:**
- Registro de consumidores y de productores.
- Inicio de sesión (login).
- Emisión de **tokens JWT** que identifican al usuario en cada petición.
- Cifrado de contraseñas con **BCrypt (factor 12)**.
- Límite de intentos de login (protección contra fuerza bruta).
- Creación de la cuenta de administrador inicial.

## 3.2 📦 product-service — Productos y pedidos
**Tecnología:** Java 17 · Spring Boot · JPA/Hibernate · PostgreSQL

El corazón del catálogo y las ventas.

**Funciones:**
- Gestión del **catálogo** (crear, editar, listar productos).
- Control de **inventario / stock**.
- Creación y gestión de **pedidos**.
- **Auditoría** de productos (aprobar / rechazar) — solo administradores.
- Solo muestra públicamente los productos con estado **APROBADO**.

## 3.3 💳 payment-service — Pagos
**Tecnología:** Node.js · Express · Stripe

Procesa los pagos y confirma los pedidos.

**Funciones:**
- Pago con **tarjeta** (vía Stripe) y métodos locales: **Yape, Plin, TuPay**.
- Verificación del pago y **confirmación del pedido** en product-service.
- Cálculo del monto en el servidor (no se confía en el cliente).
- Verificación de la firma de los webhooks de Stripe.

## 3.4 📋 audit-service — Auditoría
**Tecnología:** Python · FastAPI · MongoDB (Motor) · ReportLab

Encargado de la certificación y trazabilidad.

**Funciones:**
- Registro del historial de auditoría de cada producto.
- Generación de **certificados PDF** de auditoría.
- Análisis de ingredientes contra una base de sustancias prohibidas.

## 3.5 🤖 ai-engine — Motor de IA
**Tecnología:** Python · FastAPI

Calcula el **Eco-Score** de los productos analizando su información e ingredientes, para determinar qué tan ecológico es cada uno.

## 3.6 📣 notification-service — Notificaciones
**Tecnología:** Python · FastAPI

Envía **avisos** al usuario, por ejemplo, la confirmación de un pago exitoso. Las llamadas a este servicio se autentican con un secreto interno.

## 3.7 🚪 API Gateway
**Tecnología:** Node.js (gateway propio) / Kong (en Docker Compose)

Es la **puerta de entrada** única del sistema. Recibe todas las peticiones del frontend y las **reenvía** al microservicio correcto según la ruta. También aplica **CORS** y, en algunas rutas, **límite de peticiones**.

---

## Resumen de puertos

| Servicio | Puerto |
|---|---|
| Frontend web | 3000 |
| API Gateway | 8000 |
| auth-service | 8081 |
| product-service | 8082 |
| payment-service | 8083 |
| audit-service | 8084 |
| ai-engine | 8085 |
| notification-service | 8086 |
| PostgreSQL | 5432 |
| MongoDB | 27017 |
