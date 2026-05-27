'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/services';
import { Star, Leaf, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

function ProductCardInner({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        ecoScore: product.ecoScore,
        badges: product.badges,
      });
      toast.success(`${product.name} añadido al carrito`, {
        style: { background: 'var(--primary)', color: '#fff', fontWeight: 'bold', borderRadius: '16px' },
      });
    },
    [addItem, product]
  );

  const scoreColor =
    product.ecoScore >= 90 ? 'text-green-700 dark:text-green-400' : product.ecoScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--error)]';

  const imageSrc = product.images?.[0];

  return (
    <Link
      href={`/products/${product.id}`}
      prefetch
      id={`product-card-${product.id}`}
      className="group bg-[var(--surface)] rounded-[2rem] p-5 border border-[var(--border)] flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl will-change-transform"
    >
      <div className="relative bg-[#F3F5F2] dark:bg-[#1c2421] rounded-2xl aspect-square flex items-center justify-center overflow-hidden mb-5">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <Leaf size={56} className="text-green-300" aria-hidden />
        )}
        <div className="absolute top-3 right-3 bg-[var(--surface)]/90 dark:bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
          <span className={`text-sm font-bold ${scoreColor}`}>{(product.ecoScore / 10).toFixed(1)}</span>
          <Star size={10} className="text-yellow-500 fill-yellow-500" />
        </div>
      </div>

      <div className="flex-grow">
        <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-1">{product.category}</p>
        <h4 className="font-bold mb-3 leading-snug">{product.name}</h4>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.badges?.slice(0, 2).map((badge) => (
            <span key={badge} className="bg-[var(--success-bg)] dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <span className="text-xl font-extrabold text-[var(--text)]">S/. {product.price.toFixed(2)}</span>
        <button
          id={`add-to-cart-${product.id}`}
          type="button"
          onClick={handleAddToCart}
          className="w-10 h-10 bg-gray-900 dark:bg-[var(--primary)] text-white rounded-full flex items-center justify-center hover:opacity-90 transition active:scale-95"
          aria-label={`Agregar ${product.name} al carrito`}
        >
          <Plus size={18} />
        </button>
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardInner);
