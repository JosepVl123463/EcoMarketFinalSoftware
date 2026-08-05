# 6. Seguridad

La seguridad es uno de los pilares de EcoMarket. Se aplica en varias capas.

## 6.1 Autenticación (¿quién eres?)

- **Tokens JWT:** al iniciar sesión, el servidor entrega un *token* firmado que identifica al usuario en cada petición. El token tiene **fecha de expiración**.
- **Contraseñas cifradas:** nunca se guardan en texto plano. Se usan hashes **BCrypt con factor 12** (muy resistente a ataques de fuerza bruta).
- El secreto de firma del JWT se gestiona por **variables de entorno**, no en el código.

## 6.2 Autorización (¿qué puedes hacer?)

- **Control de acceso por rol (RBAC):** cada usuario tiene un rol (`customer`, `provider`, `admin`) y solo puede acceder a lo que su rol permite.
  - Crear/editar productos → proveedor o admin.
  - Aprobar/rechazar productos y ajustar stock → solo admin.
- **Protección de rutas en el servidor:** el frontend valida la sesión, pero la decisión final la toma **siempre el backend** (no se confía solo en el cliente).

## 6.3 Protección de datos y comunicaciones

- **HTTPS / TLS:** toda la comunicación viaja cifrada.
- **Cabeceras de seguridad:** CSP (Content-Security-Policy), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **CORS restringido:** solo los dominios autorizados pueden llamar a la API.

## 6.4 Protección contra abuso

- **Límite de intentos de login (rate limiting):** bloqueo temporal tras varios intentos fallidos, para frenar ataques de fuerza bruta.
- **Mensajes de error genéricos:** el login no revela si un correo existe o no (evita enumeración de usuarios).

## 6.5 Integridad de pagos y pedidos

- El **monto a cobrar se calcula en el servidor**, nunca se confía en el valor que envía el cliente.
- La **confirmación de pago** entre servicios se protege con un **secreto interno compartido**.
- Se **verifica la firma** de los webhooks de Stripe.
- Las cantidades de los pedidos se validan como **enteros positivos**.

## 6.6 Buenas prácticas aplicadas

- Sin credenciales embebidas en el código (se usan variables de entorno).
- Contenedores Docker que corren como **usuario no root**.
- Auditoría con trazabilidad (hash de cada auditoría).
- Sanitización de entradas del usuario para evitar inyección y XSS.

> Nota: el proyecto fue sometido a una **auditoría de seguridad** interna cuyos hallazgos fueron corregidos (ver `docs/CAMBIOS_SEGURIDAD.md`).
