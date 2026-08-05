# 10. Manual de uso

## 10.1 Acceso a la aplicación

- **Web:** abrir la URL del despliegue (por ejemplo, la de Vercel) o `http://localhost:3000` si se corre local.
- **Móvil:** instalar la PWA desde el navegador ("Instalar app") o el APK de Android.

> Nota: si el backend está en el plan gratuito de Render, la **primera carga puede tardar ~50 segundos** mientras el servidor "despierta". Es normal.

## 10.2 Como consumidor

1. **Crear cuenta:** ir a *Regístrate gratis* → completar nombre, correo, celular y una contraseña segura (mayúscula, minúscula y número) → aceptar términos.
2. **Iniciar sesión:** con tu correo y contraseña.
3. **Explorar:** navegar el catálogo, filtrar por categoría o buscar.
4. **Comprar:** entrar a un producto → *Agregar al carrito* → abrir el carrito → *Proceder al pago*.
5. **Pagar:** elegir método (Yape, Plin, TuPay o tarjeta) y confirmar.
6. **Ver pedidos:** en la sección *Pedidos*.

## 10.3 Como administrador

**Credenciales por defecto:**
```
Correo:      admin@ecomarket.pe
Contraseña:  123456789
```

1. Iniciar sesión con la cuenta admin.
2. Se accede al **Panel de Administración** (o ir a `/admin`).
3. Desde ahí se pueden:
   - Ver **clientes** y **productores**.
   - Revisar productos **pendientes de auditoría**.
   - **Aprobar** o **rechazar** productos.
   - **Generar certificados** de auditoría.

## 10.4 Como productor

1. Registrarse eligiendo el perfil **Productor** (requiere datos fiscales / RUC).
2. Publicar productos → quedan **pendientes** hasta que el admin los apruebe.
3. Una vez aprobados, aparecen en el catálogo público.

## 10.5 Preguntas frecuentes

**¿Por qué no aparece nada al pagar / cargar?**
Probablemente el backend estaba "dormido" (plan gratuito). Espera ~50 segundos y reintenta.

**¿Por qué mi producto no aparece en el catálogo?**
Porque está **pendiente de auditoría**. Solo se muestran los productos **aprobados**.

**¿El pago cobra dinero real?**
En modo demostración, **no**: simula el pago pero registra el pedido correctamente. En producción se integra con Stripe real.

**¿Es seguro?**
Sí: contraseñas cifradas, tokens JWT, control de acceso por rol y conexión HTTPS. (Ver [06-seguridad.md](06-seguridad.md).)
