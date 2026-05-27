import { ProductGrid } from '@/components/ProductGrid';
import { AuditPanel } from '@/components/AuditPanel';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <>
      {/* Category Quick Filters */}
      <HeroSection />
      <Suspense fallback={<div className="text-center py-24 font-medium text-[var(--text-muted)]">Cargando catálogo...</div>}>
        <ProductGrid />
      </Suspense>
      <AuditPanel />
      <Footer />
    </>
  );
}
