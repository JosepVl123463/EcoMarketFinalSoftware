# 8. Despliegue y ejecución

Hay tres formas de ejecutar EcoMarket: **local con Docker**, **local sin Docker** y **en la nube** (producción).

## 8.1 Ejecución local con Docker (recomendada)

Requisitos: **Docker Desktop** instalado.

```bash
# En la raíz del proyecto:
docker compose up --build
```

Esto levanta **todo**: bases de datos, los 6 microservicios, el gateway y el frontend.

- Frontend: **http://localhost:3000**
- API Gateway: **http://localhost:8000**

Para detener:
```bash
docker compose down
```

> La primera vez tarda varios minutos porque compila los servicios Java.

## 8.2 Ejecución en la nube (producción)

| Componente | Plataforma |
|-----------|-----------|
| Frontend | **Vercel** |
| Backend (microservicios) | **Render** |
| Base de datos PostgreSQL | **Neon** |
| Base de datos MongoDB | **MongoDB Atlas** |

El backend puede desplegarse de dos maneras:
- **Todo-en-uno:** un contenedor con supervisord que corre todos los servicios (config en `infra/all-in-one/`).
- **Servicios separados:** cada microservicio como un servicio independiente (config en `render.yaml`).

> ⚠️ El stack completo (2 servicios Java + Node + Python) requiere **más de 512 MB de RAM** para funcionar de forma estable. El plan gratuito de Render (512 MB) es muy justo; para producción se recomienda un plan con **2 GB** o separar los servicios.

## 8.3 Variables de entorno (producción)

Se configuran en el gestor de secretos de cada plataforma (nunca en el código):

| Variable | Usada por | Descripción |
|----------|-----------|-------------|
| `JWT_SECRET` | auth, product, payment, audit | Secreto de firma de tokens (Base64) |
| `INTERNAL_SERVICE_SECRET` | product, payment, notification | Secreto para llamadas internas |
| `SPRING_DATASOURCE_URL` / `DB_*` | auth, product | Conexión a PostgreSQL |
| `MONGO_URI` | audit | Conexión a MongoDB |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | payment | Claves de Stripe |
| `NEXT_PUBLIC_API_URL` | frontend | URL del backend / gateway |
| `CORS_ALLOWED_ORIGINS` | servicios | Dominios permitidos |

## 8.4 Generar el APK de Android

1. Instalar **Android Studio**.
2. Abrir la carpeta `apps/web/android`.
3. Esperar el *Gradle Sync*.
4. Menú **Build → Generate App Bundles or APKs → Generate APKs**.
5. El archivo queda en `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`.

(Detalle completo en `apps/web/BUILD_APK.md`.)

## 8.5 Credenciales de administrador (por defecto)

```
Correo:      admin@ecomarket.pe
Contraseña:  123456789   (cambiar en producción vía ADMIN_PASSWORD)
```
