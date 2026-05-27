# Reestructuración Profesional de Ecomarket — Plan de Implementación

Plan integral para profesionalizar los módulos de Autenticación, Auditoría de Productos y Pagos de la plataforma Ecomarket.

---

## Diagnóstico del Estado Actual

Tras analizar el codebase existente, identifico:

| Módulo | Estado Actual | Deficiencias |
|---|---|---|
| **Auth/Registro** | Funcional con flujo dual (customer/provider) y Google OAuth simulado | OAuth es mock (setTimeout), falta campo `phone` en tabla `users`, falta `confirmPassword` en cliente |
| **Auditoría** | Panel admin con auditorías IA mock en frontend; backend con `audit-service` en FastAPI + MongoDB + generación PDF con ReportLab | No hay flujo de "Pendiente de revisión" real, productor no sube evidencia (fotos/PDF), admin no puede aprobar/rechazar desde el panel, botón de certificado PDF no está conectado en frontend |
| **Pagos** | Checkout con tabs Card/Yape/Plin/TuPay, todo simulado con fallback demo | No usa logos oficiales, QR de Yape no carga de `IMG/qr.png`, Plin sin OTP, TuPay sin QR propio, UI funcional pero no premium |

---

## User Review Required

> [!IMPORTANT]
> **Google OAuth**: El código actual simula Google OAuth con un `setTimeout`. ¿Deseas que implemente la integración real con `next-auth` y credenciales de Google Cloud Console, o mantenemos la simulación visual mejorada para la presentación/demo?

> [!IMPORTANT]
> **Logos oficiales de Yape/Plin/Tupay**: Para usar logos reales necesitaríamos archivos SVG/PNG de cada marca en `public/IMG/`. ¿Ya tienes estos assets o los genero como aproximaciones estilizadas con CSS?

> [!WARNING]
> **Imagen QR de Yape**: El plan referencia `IMG/qr.png` como ruta corporativa del QR. Confirma que este archivo existe en `apps/web/public/IMG/qr.png`. Si no existe, lo sustituiré con un QR generado con la librería `qrcode.react`.

---

## Open Questions

1. **¿El QR de Tupay debe ser estático o dinámico?** El plan actual lo contempla como un QR estático similar a Yape. Si necesitas generación dinámica por pedido, requeriría integración adicional con la API de Tupay.
2. **Tamaño máximo de archivos PDF de certificación**: ¿Hay un límite de tamaño para el PDF que sube el productor? Sugiero 10 MB como límite razonable.
3. **Galería de fotos del producto**: ¿Cuántas fotos máximas por producto? Sugiero un máximo de 5 imágenes en alta calidad.

---

## Proposed Changes

Las modificaciones están organizadas por módulo. Cada sección incluye: arquitectura DB, componentes UI y lógica de negocio.

---

### Módulo 1: Sistema de Autenticación y Registro

---

#### 1A. Arquitectura de Base de Datos

##### [MODIFY] [init_schema.sql](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/infra/postgres/init_schema.sql)

Agregar campos faltantes a la tabla `users` y ajustar la tabla `providers`:

```sql
-- Añadir a la tabla users:
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN auth_method VARCHAR(20) DEFAULT 'email'; -- 'email', 'google'
ALTER TABLE users ADD COLUMN google_id VARCHAR(255); -- ID de Google OAuth
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

-- La tabla providers ya tiene los campos corporativos necesarios:
-- ruc, business_name, direccion_fiscal, telefono_corporativo, 
-- email_empresarial, representante_legal, status
-- Solo confirmar que status='PENDING' por defecto (ya existe)
```

**Tabla `users` extendida (campos finales):**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | UUID | ✓ | PK auto-generada |
| `email` | VARCHAR(255) | ✓ | Único |
| `full_name` | VARCHAR(255) | ✓ | Nombre completo |
| `phone` | VARCHAR(20) | ✓ (customer) | Celular |
| `avatar_url` | TEXT | ✗ | Avatar (Google lo provee) |
| `provider` | VARCHAR(50) | ✓ | 'email', 'google' |
| `provider_id` | VARCHAR(255) | ✗ | Hash password o Google ID |
| `google_id` | VARCHAR(255) | ✗ | ID único de Google |
| `auth_method` | VARCHAR(20) | ✓ | 'email' o 'google' |
| `role` | VARCHAR(50) | ✓ | 'customer', 'provider', 'admin' |
| `eco_score` | INTEGER | ✓ | Puntos eco acumulados |
| `email_verified` | BOOLEAN | ✓ | Verificación de email |
| `phone_verified` | BOOLEAN | ✓ | Verificación de teléfono |
| `last_login_at` | TIMESTAMPTZ | ✗ | Último inicio de sesión |
| `created_at` | TIMESTAMPTZ | ✓ | Fecha de registro |

**Tabla `providers` (sin cambios, ya completa):**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ruc` | VARCHAR(11) | ✓ | RUC de 11 dígitos, único |
| `business_name` | VARCHAR(255) | ✓ | Razón Social |
| `direccion_fiscal` | TEXT | ✓ | Dirección fiscal completa |
| `telefono_corporativo` | VARCHAR(50) | ✓ | Teléfono del negocio |
| `email_empresarial` | VARCHAR(255) | ✓ | Email corporativo, único |
| `representante_legal` | VARCHAR(255) | ✓ | Nombre del rep. legal |
| `status` | VARCHAR(50) | ✓ | 'PENDING', 'APPROVED', 'REJECTED' |
| `verified` | BOOLEAN | ✓ | RUC validado en SUNAT |
| `eco_certified` | BOOLEAN | ✓ | Certificación ecológica aprobada |

---

#### 1B. Componentes UI — Flujo Consumidor

##### [MODIFY] [page.tsx (register)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/auth/register/page.tsx)

**Mejoras al formulario de consumidor:**
- Añadir validación de contraseña segura visual (barra de fortaleza con indicador de color)
- Mejorar el botón de Google OAuth con animación de carga y feedback visual premium
- Añadir validación en tiempo real de formato de email y teléfono
- Diseño del campo de teléfono con prefijo `+51` fijo

**Orden visual del formulario consumidor:**
```
┌────────────────────────────────────────┐
│         🍃 Logo EcoMarket             │
│      "Crear tu Cuenta EcoMarket"       │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [Consumidor ✓]  [Productor]     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  🔵 Registrarse con Google       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────── o con correo ────────────    │
│                                        │
│  👤 Nombre completo          [input]   │
│  📧 Correo electrónico      [input]   │
│  📱 +51 Celular              [input]   │
│  🔒 Contraseña               [input]   │
│     ▓▓▓▓▓░░░ Fortaleza: Media         │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │     Crear mi cuenta gratis  →    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ¿Ya tienes cuenta? Iniciar sesión     │
└────────────────────────────────────────┘
```

##### [MODIFY] [page.tsx (login)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/auth/login/page.tsx)

**Mejoras al login:**
- Mejorar animación del botón Google OAuth
- Nota visual indicando que Google es solo para consumidores
- Mejora de la UI de error con iconos animados

---

#### 1C. Componentes UI — Flujo Productor (Stepper Corporativo)

##### [MODIFY] [page.tsx (register)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/auth/register/page.tsx)

El formulario de productor multi-paso ya existe. Mejoras:

**Paso 1 — Datos Fiscales (ya implementado, mejorar):**
- Mejorar animación del botón "Validar RUC" con feedback de SUNAT
- Añadir ícono de verificación ✓ verde cuando el RUC es validado exitosamente
- Auto-completar razón social y dirección fiscal tras validación

**Paso 2 — Contacto Corporativo (ya implementado, mejorar):**
- Validación en tiempo real del email empresarial
- Formato de teléfono corporativo con máscara

**Paso 3 — Credenciales (ya implementado, mejorar):**
- Añadir barra de fortaleza de contraseña
- Añadir checkbox de Términos y Condiciones obligatorio
- Mostrar resumen de datos antes del envío final

**Pantalla de confirmación (ya implementada):**
- Mejorar el estado "Pendiente de Aprobación" con animación de progreso
- Añadir timeline visual del proceso de aprobación

---

#### 1D. Lógica de Negocio — Servicios Frontend

##### [MODIFY] [index.ts (services)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/services/index.ts)

Añadir nuevos endpoints al `authService`:

```typescript
// Nuevos métodos en authService
googleAuth: async (googleToken: string) => {
  const { data } = await api.post('/api/auth/google', { token: googleToken });
  return data; // { token, user }
},
```

##### [MODIFY] [authStore.ts](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/store/authStore.ts)

Extender la interfaz `User` para incluir `phone` y `authMethod`:

```typescript
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'provider' | 'admin';
  ecoScore: number;
  avatarUrl?: string;
  authMethod?: 'email' | 'google';
}
```

---

### Módulo 2: Auditoría de Productos y Trazabilidad Ecológica

---

#### 2A. Arquitectura de Base de Datos

La tabla `products` ya tiene los campos de trazabilidad necesarios:
- `fecha_produccion`, `origen_region`, `fecha_vencimiento`, `certificacion_pdf_url`, `status`, `motivo_rechazo`

La tabla `product_audits` ya existe con:
- `product_id`, `auditor_id`, `status`, `observaciones`, `certificate_pdf_url`, `fecha_analisis`

**No se requieren cambios en el esquema SQL**. La estructura actual es correcta para los requerimientos.

---

#### 2B. Panel del Productor — Carga de Evidencia

##### [NEW] `apps/web/src/app/producer/products/page.tsx`

Crear la página de gestión de productos del productor:

**Orden visual del formulario de producto:**
```
┌─────────────────────────────────────────────────────┐
│  📦 Registrar / Editar Producto                     │
│                                                      │
│  ── Información Básica ──                           │
│  Nombre del producto             [input]             │
│  Descripción                     [textarea]          │
│  Precio (S/.)     [input]   Stock [input]            │
│  Categoría                       [select]            │
│                                                      │
│  ── Trazabilidad Ecológica ──                       │
│  📅 Fecha de producción          [date picker]       │
│  📍 Lugar/Región de origen       [input + mapa]      │
│  📅 Fecha de vencimiento         [date picker]       │
│                                                      │
│  ── Multimedia ──                                   │
│  🖼️ Galería de fotos (max 5)    [drag & drop zone]  │
│     ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │
│     │ +  │ │ img│ │ img│ │    │ │    │              │
│     └────┘ └────┘ └────┘ └────┘ └────┘             │
│                                                      │
│  ── Certificación Ecológica ──                      │
│  📄 Documento PDF de certificación                  │
│  ┌──────────────────────────────────────────┐       │
│  │  Arrastra tu PDF aquí o haz clic         │       │
│  │  (Lista de ingredientes, certificados    │       │
│  │   orgánicos, procesos ecológicos)        │       │
│  │  Máximo: 10 MB • Solo PDF               │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │      Enviar a Revisión de Auditoría   →  │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ⚠️ Tu producto será visible en la tienda           │
│     solo después de ser aprobado por el Comité      │
└─────────────────────────────────────────────────────┘
```

---

#### 2C. Panel del Administrador — Gestión de Auditorías

##### [MODIFY] [page.tsx (admin)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/admin/page.tsx)

Añadir nueva pestaña **"Auditoría de Productos"** al panel de admin:

**Componentes de la sección de auditoría:**

```
┌─────────────────────────────────────────────────────┐
│  🛡️ Auditoría de Productos                          │
│  "Revisa y valida productos antes de publicarlos"    │
│                                                      │
│  [Filtro: Todos ▼]  [Buscar producto...]            │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ STATUS    PRODUCTO         PRODUCTOR   FECHA │    │
│  ├─────────────────────────────────────────────┤    │
│  │ 🟡 PEND  Shampoo Sólido   EcoShop    05/24 │    │
│  │ 🟢 APROB Proteína Arveja  BioGranos  05/22 │    │
│  │ 🔴 RECH  Crema Facial     SelvaViva  05/20 │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ── Al seleccionar un producto pendiente ──         │
│  ┌─────────────────────────────────────────────┐    │
│  │  Shampoo Sólido de Verbena                  │    │
│  │  Productor: EcoShop (RUC: 20123456789)      │    │
│  │                                              │    │
│  │  📍 Origen: Cusco, Perú                     │    │
│  │  📅 Producción: 2026-04-15                  │    │
│  │  📅 Vencimiento: 2027-04-15                 │    │
│  │                                              │    │
│  │  🖼️ Galería:  [img] [img] [img]             │    │
│  │                                              │    │
│  │  📄 Certificación PDF:                      │    │
│  │  ┌────────────────────────────────┐         │    │
│  │  │ 📋 ingredientes_shampoo.pdf   │         │    │
│  │  │ [Abrir PDF]  [Descargar]      │         │    │
│  │  └────────────────────────────────┘         │    │
│  │                                              │    │
│  │  ┌────────────┐  ┌────────────────┐         │    │
│  │  │ ✅ Aprobar │  │ ❌ Rechazar    │         │    │
│  │  └────────────┘  └────────────────┘         │    │
│  │                                              │    │
│  │  (Si rechaza → textarea de observaciones)    │    │
│  │                                              │    │
│  │  ┌──────────────────────────────────┐       │    │
│  │  │ 📜 Generar Certificado Auditoría │       │    │
│  │  └──────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

#### 2D. Lógica de Generación de PDF — Certificado de Auditoría

##### Backend existente: [main.py](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/services/audit-service/main.py)

El endpoint `POST /api/audit/{product_id}/generate-certificate` ya existe en el backend (líneas 164-253). Usa ReportLab para generar PDFs.

**Pseudocódigo del flujo completo (frontend → backend → PDF):**

```
FUNCIÓN generarCertificadoAuditoria(productId):
    
    1. FRONTEND:
       - Admin hace clic en "Generar Certificado de Auditoría"
       - Mostrar spinner de carga con mensaje "Generando certificado..."
       - Llamar al endpoint: POST /api/audit/{productId}/generate-certificate
    
    2. BACKEND (audit-service/main.py):
       a) Buscar registro de auditoría en MongoDB por product_id
          → SI no existe: HTTP 404 "Audit record not found"
       
       b) Buscar datos del producto en product-service
          → GET http://product-service:8082/api/products/{productId}
       
       c) Construir documento PDF con ReportLab:
          
          INICIO DOCUMENTO PDF (A4):
          
          ═══════════════════════════════════════════
          ║     [LOGO ECOMARKET]                    ║
          ║     ECOMARKET                           ║
          ║     Certificación de Productos          ║
          ║     Ecológicos                          ║
          ═══════════════════════════════════════════
          
          CERTIFICADO DE AUDITORÍA DE PRODUCTO
          ─────────────────────────────────────
          
          DETALLES DE LA AUDITORÍA:
          • ID de Auditoría: {audit_hash}
          • Fecha de Análisis: {timestamp formateado}
          • Auditor: {auditor_name}
          • Estado: APROBADO ✓ / RECHAZADO ✗
          
          DETALLES DEL PRODUCTO:
          • Nombre: {product_name}
          • Productor: {provider_name}
          • Descripción: {description}
          • Fecha de Producción: {fecha_produccion}
          • Región de Origen: {origen_region}
          • Fecha de Vencimiento: {fecha_vencimiento}
          
          RESULTADOS Y CONCLUSIONES:
          SI estado == "APPROVED":
            "El producto cumple con los estándares 
             ecológicos de EcoMarket."
            + Listar observaciones si las hay
          SI estado == "REJECTED":
            "El producto ha sido RECHAZADO por:"
            + Mostrar motivo_rechazo
          
          ─────────────────────────────────────
          _____________________________
          Firma del Auditor EcoMarket
          
          Generado el: {fecha_actual}
          ═══════════════════════════════════════════
          
          FIN DOCUMENTO PDF
       
       d) Retornar PDF como Response con Content-Type: application/pdf
    
    3. FRONTEND:
       - Recibir blob PDF
       - Crear URL temporal con URL.createObjectURL(blob)
       - Abrir en nueva pestaña o descargar automáticamente
       - Mostrar toast de éxito: "Certificado generado exitosamente"
```

##### [MODIFY] [index.ts (services)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/services/index.ts)

Añadir nuevos endpoints al `auditService`:

```typescript
export const auditService = {
  // Existente
  getProductAudit: async (productId: string) => { ... },
  
  // Nuevos
  getPendingProducts: async () => {
    const { data } = await api.get('/api/audit/pending');
    return data;
  },
  
  approveProduct: async (productId: string, auditorId: string) => {
    const { data } = await api.post(`/api/audit/${productId}/approve`, { auditorId });
    return data;
  },
  
  rejectProduct: async (productId: string, auditorId: string, observaciones: string) => {
    const { data } = await api.post(`/api/audit/${productId}/reject`, { 
      auditorId, observaciones 
    });
    return data;
  },
  
  generateCertificate: async (productId: string) => {
    const response = await api.post(
      `/api/audit/${productId}/generate-certificate`,
      {},
      { responseType: 'blob' }
    );
    return response.data; // Blob PDF
  },
};
```

---

### Módulo 3: Rediseño del Módulo de Pagos

---

#### 3A. No hay cambios de base de datos

La tabla `payments` ya soporta los métodos `yape`, `plin`, `tupay` y `card`.

---

#### 3B. Componentes UI — Rediseño Premium de Checkout

##### [MODIFY] [page.tsx (checkout)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/checkout/page.tsx)

**Rediseño completo de las pestañas de pago:**

**Tab Yape — Diseño Premium:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────┐       │
│  │ [LOGO YAPE oficial]  Paga con Yape      │       │
│  │ Rápido, simple y libre de plásticos.     │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ┌────────────────────┐   ┌──────────────────┐      │
│  │                    │   │                  │      │
│  │   ┌────────────┐   │   │ Pasos:           │      │
│  │   │            │   │   │ 1. Abre Yape     │      │
│  │   │  QR CODE   │   │   │ 2. Escanea el QR │      │
│  │   │  (real     │   │   │ 3. Confirma pago │      │
│  │   │  IMG/qr.   │   │   │ 4. Adjunta       │      │
│  │   │  png)      │   │   │    captura       │      │
│  │   │            │   │   │                  │      │
│  │   └────────────┘   │   │ Monto a pagar:   │      │
│  │   EcoMarket S.A.C. │   │ S/. 47.50        │      │
│  └────────────────────┘   └──────────────────┘      │
│                                                      │
│  📱 Celular Yape        [input con máscara 9 dig]   │
│  🔑 Código aprobación   [input 6 dig, tracking]     │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │   💜 Confirmar y Yapear (S/. 47.50)      │       │
│  └──────────────────────────────────────────┘       │
│  color: #8A3386 (púrpura Yape oficial)              │
└─────────────────────────────────────────────────────┘
```

**Tab Plin — Diseño Premium:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────┐       │
│  │ [LOGO PLIN oficial]  Paga con Plin      │       │
│  │ Interoperabilidad bancaria inmediata.    │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  📱 Número celular Plin                              │
│  ┌──────────────────────────────────────────┐       │
│  │  +51  │  999 999 999                     │       │
│  └──────────────────────────────────────────┘       │
│  ✓ Validación en tiempo real (9 dígitos)            │
│                                                      │
│  🔑 Código de verificación (OTP)                     │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                    │
│  │  │ │  │ │  │ │  │ │  │ │  │  (6 inputs)         │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                    │
│  "Te enviaremos un código a tu app Plin"            │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │   💎 Pagar con Plin (S/. 47.50)          │       │
│  └──────────────────────────────────────────┘       │
│  color: #00BCD4 (cyan Plin oficial)                 │
└─────────────────────────────────────────────────────┘
```

**Tab Tupay — Diseño Premium:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────┐       │
│  │ [LOGO TUPAY oficial]  Paga con TuPay    │       │
│  │ Pago en efectivo o banca por internet.   │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ┌────────────────────────────────┐                 │
│  │                                │                 │
│  │   ┌──────────────────────┐     │                 │
│  │   │                      │     │                 │
│  │   │   QR CODE TUPAY      │     │                 │
│  │   │   (estático/dinámico)│     │                 │
│  │   │                      │     │                 │
│  │   └──────────────────────┘     │                 │
│  │   EcoMarket S.A.C.            │                 │
│  └────────────────────────────────┘                 │
│                                                      │
│  Código CIP:                                        │
│  ┌──────────────────────────────────────────┐       │
│  │  CIP-1234567    📋 Copiar                │       │
│  └──────────────────────────────────────────┘       │
│  ⏰ Este código expira en 24 horas                  │
│                                                      │
│  🏦 Banco de origen:   [BCP ▼]                      │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │   🏛️ Confirmar Pago TuPay (S/. 47.50)   │       │
│  └──────────────────────────────────────────┘       │
│  color: #1A3C34 (verde EcoMarket)                   │
└─────────────────────────────────────────────────────┘
```

**Elementos de diseño premium transversales:**
- Glassmorphism en los contenedores de QR (`backdrop-filter: blur + bg opacity`)
- Animación de pulso suave en los QR para llamar la atención
- Validación en tiempo real con indicadores de color verde/rojo
- Micro-animaciones en los botones al hover (scale 1.02, shadow elevada)
- Iconos SVG de logos oficiales en alta resolución
- Indicadores de seguridad SSL visibles (`🔒 Conexión Segura`)

---

## Resumen de Archivos a Modificar

| Archivo | Acción | Módulo |
|---|---|---|
| [init_schema.sql](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/infra/postgres/init_schema.sql) | MODIFY | Auth |
| [authStore.ts](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/store/authStore.ts) | MODIFY | Auth |
| [index.ts](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/services/index.ts) | MODIFY | Auth + Audit |
| [page.tsx (login)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/auth/login/page.tsx) | MODIFY | Auth |
| [page.tsx (register)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/auth/register/page.tsx) | MODIFY | Auth |
| [page.tsx (admin)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/admin/page.tsx) | MODIFY | Audit |
| [page.tsx (checkout)](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/apps/web/src/app/checkout/page.tsx) | MODIFY | Pagos |
| `apps/web/src/app/producer/products/page.tsx` | NEW | Audit |
| [main.py](file:///d:/universidad/octavo%20semestre/software/Ecomarket-Final-main/services/audit-service/main.py) | MODIFY | Audit (fix duplicado, nuevos endpoints) |

---

## Verification Plan

### Automated Tests
```bash
# 1. Verificar que Next.js compila sin errores
cd apps/web && npm run build

# 2. Verificar que el schema SQL es válido
# (Ejecutar init_schema.sql en un PostgreSQL de prueba)
```

### Manual Verification
1. **Auth**: Navegar a `/auth/register`, verificar ambos flujos (consumidor y productor), confirmar que Google OAuth ejecuta el flujo simulado
2. **Audit**: Navegar a `/admin` → pestaña "Auditoría de Productos", aprobar/rechazar un producto, generar certificado PDF
3. **Pagos**: Navegar a `/checkout`, verificar las 3 pestañas (Yape, Plin, Tupay) con los logos y QR correctos
4. **Productor**: Navegar a `/producer/products`, verificar el formulario de carga de evidencia
