'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition, memo, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { sanitizeSearchQuery } from '@/lib/sanitize';
import { Logo, LogoWordmark } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShoppingBasket, User, Search, X, Menu } from 'lucide-react';

const CartSidebar = dynamic(() => import('@/components/CartSidebar').then((m) => ({ default: m.CartSidebar })), {
  ssr: false,
  loading: () => null,
});

const NAV_LINKS = [
  { href: '/?category=Cuidado%20Personal', label: 'Cuidado Personal', accent: false },
  { href: '/?category=Alimentaci%C3%B3n', label: 'Alimentación', accent: false },
  { href: '/?category=Hogar%20Eco', label: 'Hogar Eco', accent: false },
  { href: '/?badge=new_audit', label: 'Nuevas Auditorías', accent: true },
] as const;

function NavbarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, logout } = useAuthStore();
  const count = useCartStore((s) => s.totalItems());
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = sanitizeSearchQuery(search);
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set('q', q);
        else params.delete('q');
        router.push(`/?${params.toString()}`);
      });
    },
    [search, searchParams, router]
  );

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  const handleDropdownEnter = useCallback(() => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setDropdownOpen(true);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimer.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="bg-[var(--primary)] text-[var(--text-inverse)] text-[11px] py-2 px-6 flex justify-between items-center font-bold tracking-widest uppercase">
        <span>Envíos Carbono Neutral en todo el país</span>
        <span className="hidden md:block">Garantía Ecomarket: 100% Auditado</span>
      </div>

      <nav className="sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" prefetch className="flex items-center gap-2.5">
              <Logo size={36} />
              <LogoWordmark />
            </Link>
            <div className="hidden lg:flex gap-6 text-sm font-semibold text-[var(--text-muted)]">
              {NAV_LINKS.map(({ href, label, accent }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  className={`hover:text-[var(--primary)] transition-colors ${accent ? 'text-orange-600 dark:text-orange-400' : ''}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <form onSubmit={handleSearchSubmit} className="hidden md:flex bg-[var(--input-bg)] rounded-full px-4 py-2 items-center gap-2">
              <Search size={14} className="text-[var(--text-muted)]" aria-hidden />
              <input
                type="search"
                placeholder="Buscar productos auditados..."
                className="bg-transparent border-none focus:outline-none text-sm w-48 text-[var(--text)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar productos"
              />
            </form>

            <div className="flex gap-4 text-[var(--text-muted)] items-center">
              <ThemeToggle />

              <button
                id="cart-toggle-btn"
                type="button"
                className="relative"
                onClick={openCart}
                aria-label="Abrir carrito"
              >
                <ShoppingBasket size={22} />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-[var(--text-inverse)] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </button>

              {isAuthenticated ? (
                <div
                  ref={dropdownRef}
                  className="relative hidden sm:block"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    id="user-menu-btn"
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
                  >
                    <User size={20} />
                    <span>{user?.fullName?.split(' ')[0]}</span>
                  </button>
                  <div
                    className={`absolute right-0 top-8 w-48 bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-2 transition-all duration-200 z-[100] ${
                      dropdownOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible translate-y-1 pointer-events-none'
                    }`}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {user?.role === 'admin' && (
                      <Link href="/admin" id="admin-panel-link" prefetch className="block px-3 py-2 text-sm text-[var(--success)] font-extrabold bg-[var(--success-bg)]/50 hover:bg-[var(--success-bg)] rounded-lg mb-1 dark:text-green-300 dark:bg-green-900/30">
                        Panel Admin
                      </Link>
                    )}
                    <Link href="/profile" prefetch className="block px-3 py-2 text-sm hover:bg-[var(--input-bg)] rounded-lg">Mi Perfil</Link>
                    {user?.role === 'provider' && (
                      <Link href="/producer/products" prefetch className="block px-3 py-2 text-sm hover:bg-[var(--input-bg)] rounded-lg font-semibold">
                        Mis Productos
                      </Link>
                    )}
                    <Link href="/orders" prefetch className="block px-3 py-2 text-sm hover:bg-[var(--input-bg)] rounded-lg">Mis Pedidos</Link>
                    <button id="logout-btn" type="button" onClick={logout} className="w-full text-left px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)] dark:hover:bg-red-900/20 rounded-lg mt-1 border-t border-[var(--border)] pt-2">
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" id="login-btn" prefetch className="hidden sm:flex items-center gap-2 bg-[var(--primary)] text-[var(--text-inverse)] px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                  <User size={16} /> Ingresar
                </Link>
              )}

              <button type="button" className="lg:hidden" id="mobile-menu-btn" onClick={toggleMobile} aria-label="Menú">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-[var(--border)] pt-4 flex flex-col gap-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} prefetch className="text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/auth/login" prefetch className="text-sm font-bold text-[var(--primary)]">
                Ingresar / Registrarse
              </Link>
            )}
          </div>
        )}
      </nav>

      <CartSidebar isOpen={cartOpen} onClose={closeCart} />
    </>
  );
}

export const Navbar = memo(function Navbar() {
  return <NavbarInner />;
});
