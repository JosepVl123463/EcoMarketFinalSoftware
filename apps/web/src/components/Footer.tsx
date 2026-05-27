import Link from 'next/link';
import { Globe, Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[var(--input-bg)] border-t border-[var(--border)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#1A3C34] rounded-lg flex items-center justify-center text-white">
                <Leaf size={16} />
              </div>
              <span className="text-xl font-bold tracking-tighter text-[var(--primary)]">ecomarket</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
              Redefiniendo el e-commerce a través de la ciencia y la transparencia. Únete a la revolución del consumo consciente.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Web" className="w-10 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-green-600 transition">
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h6 className="font-bold text-[var(--text)] mb-6">Explorar</h6>
            <ul className="text-sm text-[var(--text-muted)] space-y-4">
              <li><Link href="/products" className="hover:text-green-700 transition">Todos los Productos</Link></li>
              <li><Link href="/?badge=vegan" className="hover:text-green-700 transition">Categorías Veganas</Link></li>
              <li><Link href="/brands" className="hover:text-green-700 transition">Marcas Auditadas</Link></li>
              <li><Link href="/?sale=true" className="hover:text-green-700 transition">Ofertas Eco</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className="font-bold text-[var(--text)] mb-6">Compañía</h6>
            <ul className="text-sm text-[var(--text-muted)] space-y-4">
              <li><Link href="/about" className="hover:text-green-700 transition">Cómo Auditamos</Link></li>
              <li><Link href="/transparency" className="hover:text-green-700 transition">Transparencia</Link></li>
              <li><Link href="/mission" className="hover:text-green-700 transition">Misión Social</Link></li>
              <li><Link href="/contact" className="hover:text-green-700 transition">Contacto</Link></li>
            </ul>
          </div>

          {/* CTA for vendors */}
          <div className="bg-[#1A3C34] rounded-[2rem] p-8 text-white">
            <h6 className="font-bold mb-4">¿Eres productor?</h6>
            <p className="text-xs text-green-100/70 mb-6">Sube tus certificados y empieza a vender con nuestro sello de confianza.</p>
            <Link
              href="/auth/register?role=provider"
              id="become-vendor-btn"
              className="block w-full bg-[var(--success-bg)] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-green-600 transition"
            >
              Vender en Ecomarket
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Ecomarket Software Inc. Todos los derechos reservados.</p>
          <div className="flex gap-8">
            <Link href="/privacy">Privacidad</Link>
            <Link href="/audit-terms">Términos de Auditoría</Link>
            <Link href="/sustainability">Sostenibilidad Reporte</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
