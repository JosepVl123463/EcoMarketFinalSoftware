import Link from 'next/link';
import { Leaf } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 mb-16 mt-8">
      <div
        className="rounded-[2.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3C34 0%, #2D5A27 100%)' }}
      >
        {/* Left Content */}
        <div className="relative z-10 max-w-lg">
          <span className="text-green-300 font-bold uppercase text-xs tracking-widest">Edición {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-4 mb-6 leading-tight">
            Tu compra tiene un <span className="text-green-400 italic">propósito real.</span>
          </h1>
          <p className="text-green-100/80 mb-8 text-lg">
            Descubre productos validados ingrediente por ingrediente. Sin greenwashing, solo la verdad técnica.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="#products"
              id="hero-shop-btn"
              className="bg-[var(--surface)] text-[var(--primary)] px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-[var(--success-bg)] transition"
            >
              Comprar Ahora
            </Link>
            <Link
              href="/about"
              id="hero-method-btn"
              className="bg-transparent border border-white/30 px-8 py-3 rounded-xl font-bold hover:bg-[var(--surface)]/10 transition"
            >
              Nuestro Método
            </Link>
          </div>
        </div>

        {/* Right certification card */}
        <div className="hidden md:block relative z-10 w-1/3 mt-8 md:mt-0">
          <div className="bg-[var(--surface)]/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-black">
                <Leaf size={18} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Certificación Ecomarket</p>
            </div>
            <p className="text-sm italic text-green-100">
              &quot;Auditamos más de 12,000 ingredientes químicos para que tú no tengas que hacerlo.&quot;
            </p>
            <div className="mt-4 flex gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-green-300">98%</p>
                <p className="text-xs text-green-100/60">Satisfacción</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-green-300">5K+</p>
                <p className="text-xs text-green-100/60">Productos</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-green-300">12K</p>
                <p className="text-xs text-green-100/60">Ingredientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-300 rounded-full blur-[100px] opacity-10 pointer-events-none" />
      </div>
    </section>
  );
}
