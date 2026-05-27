# 🌿 EcoMarket Monorepo

Este repositorio centraliza todo el código fuente del ecosistema de Ecomarket.
El proyecto está estructurado como un monorepositorio que divide claramente el frontend, los microservicios backend, y la infraestructura de despliegue.

## Estructura de Directorios

- `apps/`: Contiene las aplicaciones cliente.
  - `web/`: Next.js 14 PWA (Sitio Principal).
  - `mobile/`: Aplicación en Kotlin Multiplatform.
  - `admin/`: Dashboard para backoffice.
- `services/`: Microservicios separados por dominio.
  - `auth-service/`: Spring Boot (Gestión de Identidad, SSO).
  - `payment-service/`: Node.js (Stripe Checkout & Webhooks).
  - `product-service/`: Spring Boot (Catálogo híbrido SQL/NoSQL).
  - `audit-service/`: FastAPI (Amazon QLDB Ledger Inmutable).
  - `ai-engine/`: FastAPI (Visión Artificial e NLP de ingredientes).
  - `notification-service/`: FastAPI (Firebase Push).
- `infra/`: Código de infraestructura y configuración.
  - `postgres/`: Scripts de inicialización de la base de datos local.
  - `k8s/`: Manifiestos de Kubernetes.
  - `terraform/`: Código de Infraestructura como Código (IaC).
  - `kong/`: Configuración del API Gateway.
- `docs/`: Documentación técnica.
  - `architecture/`: Diagramas de diseño (Mermaid, C4).
  - `openapi/`: Contratos de API Swagger.

## Entorno Local

Puedes iniciar toda la base de datos, caché y pasarelas de la aplicación usando Docker Compose:

```bash
cd ecomarket
docker compose up -d
```

*Consorcio de Ingeniería de Software - 2026*
