# 📚 Documentación de EcoMarket

Marketplace de productos ecológicos y sostenibles, con auditoría de productos ingrediente por ingrediente.

Esta carpeta contiene la documentación técnica y funcional completa del proyecto.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [Visión general](01-vision-general.md) | Qué es EcoMarket, el problema que resuelve y su propuesta de valor |
| 2 | [Arquitectura](02-arquitectura.md) | Microservicios, diagrama y stack tecnológico |
| 3 | [Microservicios](03-servicios.md) | Detalle de cada servicio del backend |
| 4 | [API / Endpoints](04-api-endpoints.md) | Inventario completo de endpoints |
| 5 | [Base de datos](05-base-de-datos.md) | Modelos de datos (PostgreSQL y MongoDB) |
| 6 | [Seguridad](06-seguridad.md) | Autenticación, cifrado, control de acceso y buenas prácticas |
| 7 | [Frontend](07-frontend.md) | Aplicación web, PWA y APK móvil |
| 8 | [Despliegue](08-despliegue.md) | Cómo ejecutar y publicar (local, Vercel, Render, Docker) |
| 9 | [Roles y flujos](09-roles-y-flujos.md) | Tipos de usuario y flujo de compra |
| 10 | [Manual de uso](10-manual-de-uso.md) | Guía práctica para usuarios y administradores |

## Resumen rápido

- **Qué es:** una tienda online (marketplace) de productos ecológicos donde cada producto se **audita** antes de venderse y recibe un **Eco-Score**.
- **Cómo está hecho:** arquitectura de **microservicios** (Java, Node.js y Python) + frontend en **Next.js**.
- **Dónde corre:** frontend en **Vercel**, backend en **Render** (o local con Docker).
- **App móvil:** PWA instalable + APK de Android (Capacitor).

## Tecnologías principales

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Zustand |
| Autenticación y Productos | Java 17, Spring Boot, Spring Security |
| Pagos | Node.js, Express, Stripe |
| IA / Auditoría / Notificaciones | Python, FastAPI |
| Bases de datos | PostgreSQL, MongoDB |
| Gateway | API Gateway (Node.js / Kong) |
| Despliegue | Vercel, Render, Docker, Capacitor (APK) |

> Documentación del proyecto EcoMarket · Universidad — Ingeniería de Software.
