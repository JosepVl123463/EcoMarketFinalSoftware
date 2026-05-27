'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ShoppingBasket, Leaf, X } from 'lucide-react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleCheckout = useCallback(() => {
    onClose();
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  }, [isAuthenticated, onClose, router]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--surface)] dark:bg-[#141a18] z-50 shadow-2xl transform translate-x-0 transition-transform duration-200"
        aria-label="Carrito de compras"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-6 border-b border-[var(--border)] dark:border-gray-800">
            <h2 className="text-xl font-bold text-[var(--text)] dark:text-gray-100">Mi Carrito ({items.length})</h2>
            <button id="close-cart-btn" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-muted)] transition" aria-label="Cerrar carrito">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBasket size={48} className="mx-auto text-[var(--border)] mb-4" />
                <p className="text-[var(--text-muted)] font-medium">Tu carrito está vacío</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-[var(--input-bg)] dark:bg-gray-900/50 rounded-2xl">
                  <div className="w-16 h-16 bg-[var(--success-bg)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Leaf size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--text)] dark:text-gray-100 truncate">{item.name}</p>
                    <p className="text-[var(--primary)] dark:text-[#a8d5c4] font-bold">S/. {item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        id={`decrease-qty-${item.id}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold"
                      >-</button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        id={`increase-qty-${item.id}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold"
                      >+</button>
                    </div>
                  </div>
                  <button id={`remove-item-${item.id}`} onClick={() => removeItem(item.id)} className="text-[var(--text-muted)] hover:text-red-400 self-start" aria-label="Eliminar">
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-6 border-t border-[var(--border)] dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Subtotal</span>
                <span className="text-2xl font-extrabold text-[var(--text)]">S/. {totalPrice().toFixed(2)}</span>
              </div>
              <button id="checkout-btn" onClick={handleCheckout} className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition">
                Ir al Checkout →
              </button>
              <button id="clear-cart-btn" onClick={clearCart} className="w-full text-[var(--text-muted)] text-sm hover:text-red-500">
                Vaciar carrito
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
