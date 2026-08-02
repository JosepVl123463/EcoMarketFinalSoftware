import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Política de Privacidad | EcoMarket',
  description: 'Cómo EcoMarket recopila, usa y protege tus datos personales.',
};

const UPDATED = '2 de agosto de 2026';
const CONTACT = 'soporte@ecomarket.pe';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-[var(--text)]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <Logo size={48} className="mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Política de Privacidad</h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm">Última actualización: {UPDATED}</p>
        </div>

        <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-sm p-8 sm:p-10 space-y-8">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            En <strong>EcoMarket</strong> respetamos tu privacidad. Esta política explica qué datos personales
            recopilamos, con qué finalidad, cómo los protegemos y qué derechos tienes sobre ellos. Al usar
            nuestra aplicación web y móvil aceptas las prácticas aquí descritas.
          </p>

          <Section title="1. Responsable del tratamiento">
            <p>
              EcoMarket es responsable del tratamiento de tus datos personales. Para cualquier consulta sobre
              privacidad puedes escribirnos a <strong>{CONTACT}</strong>.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Datos de cuenta:</strong> nombre completo, correo electrónico y número de celular al registrarte.</li>
              <li><strong>Datos de proveedor</strong> (si te registras como productor): RUC, razón social, dirección fiscal y datos del representante legal.</li>
              <li><strong>Datos de pedidos:</strong> productos comprados, montos y estado de tus pedidos.</li>
              <li><strong>Datos técnicos:</strong> información básica del dispositivo y registros de acceso para seguridad y funcionamiento.</li>
            </ul>
            <p>
              No almacenamos los datos completos de tu tarjeta. Los pagos con tarjeta se procesan a través de
              proveedores de pago especializados (por ejemplo, Stripe), que cumplen los estándares de seguridad
              del sector.
            </p>
          </Section>

          <Section title="3. Cómo usamos tus datos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Crear y gestionar tu cuenta e iniciar sesión de forma segura.</li>
              <li>Procesar tus pedidos y pagos, y darles seguimiento.</li>
              <li>Comunicarnos contigo sobre el estado de tus compras y tu cuenta.</li>
              <li>Prevenir fraudes y proteger la seguridad de la plataforma.</li>
              <li>Cumplir obligaciones legales aplicables.</li>
            </ul>
          </Section>

          <Section title="4. Cómo protegemos tus datos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Tus contraseñas se almacenan <strong>cifradas</strong> (hash con BCrypt); nunca en texto plano.</li>
              <li>Toda la comunicación viaja sobre conexiones <strong>cifradas (HTTPS/TLS)</strong>.</li>
              <li>El acceso a las funciones está protegido mediante autenticación por tokens y control de permisos por rol.</li>
              <li>Aplicamos límites de intentos de inicio de sesión para mitigar ataques de fuerza bruta.</li>
            </ul>
          </Section>

          <Section title="5. Con quién compartimos datos">
            <p>
              No vendemos tus datos personales. Solo los compartimos con proveedores que nos ayudan a operar la
              plataforma (procesadores de pago y servicios de infraestructura), y únicamente en la medida
              necesaria para prestarte el servicio, o cuando la ley lo exija.
            </p>
          </Section>

          <Section title="6. Conservación de datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario para cumplir
              las finalidades descritas y las obligaciones legales. Puedes solicitar la eliminación de tu cuenta
              en cualquier momento.
            </p>
          </Section>

          <Section title="7. Tus derechos">
            <p>
              Tienes derecho a acceder, rectificar, actualizar o eliminar tus datos personales, así como a
              oponerte a determinados tratamientos. Para ejercerlos, escríbenos a <strong>{CONTACT}</strong> y
              atenderemos tu solicitud conforme a la normativa de protección de datos aplicable (incluida la Ley
              N.° 29733 de Protección de Datos Personales del Perú).
            </p>
          </Section>

          <Section title="8. Menores de edad">
            <p>
              EcoMarket no está dirigida a menores de edad. Si eres menor, utiliza la plataforma con la
              supervisión de un adulto responsable.
            </p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>
              Podemos actualizar esta política ocasionalmente. Publicaremos la versión vigente en esta misma
              página, indicando la fecha de última actualización.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos,
              escríbenos a <strong>{CONTACT}</strong>.
            </p>
          </Section>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-[var(--primary)] font-bold hover:underline">
            ← Volver a EcoMarket
          </Link>
        </div>
      </div>
    </div>
  );
}
