'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Home, ShoppingBasket, User, Package } from 'lucide-react';

/**
 * Barra de navegación inferior (solo móvil), estilo app de marketplace.
 * Siempre visible: Inicio, Pedidos, Carrito y Cuenta (login/registro o perfil).
 */
export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const count = useCartStore((s) => s.totalItems());

  const openCart = () => window.dispatchEvent(new Event('ecomarket:open-cart'));
  const isActive = (p: string) => (p === '/' ? pathname === '/' : pathname.startsWith(p));

  const itemCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-semibold transition-colors ${
      active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
    }`;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] flex items-stretch px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Navegación principal"
    >
      <Link href="/" prefetch className={itemCls(isActive('/'))}>
        <Home size={22} strokeWidth={isActive('/') ? 2.6 : 2} />
        <span>Inicio</span>
      </Link>

      <Link href="/orders" prefetch className={itemCls(isActive('/orders'))}>
        <Package size={22} strokeWidth={isActive('/orders') ? 2.6 : 2} />
        <span>Pedidos</span>
      </Link>

      <button type="button" onClick={openCart} className={itemCls(false)} aria-label="Abrir carrito">
        <span className="relative">
          <ShoppingBasket size={22} />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[var(--primary)] text-[var(--text-inverse)] text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </span>
        <span>Carrito</span>
      </button>

      <Link
        href={isAuthenticated ? '/profile' : '/auth/login'}
        prefetch
        className={itemCls(isActive('/profile') || isActive('/auth'))}
      >
        <User size={22} strokeWidth={(isActive('/profile') || isActive('/auth')) ? 2.6 : 2} />
        <span>{isAuthenticated ? 'Cuenta' : 'Ingresar'}</span>
      </Link>
    </nav>
  );
}
