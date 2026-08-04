'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/services';
import { Leaf, Plus, ShieldCheck } from 'lucide-react';
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

  const score = (product.ecoScore / 10).toFixed(1);
  const imageSrc = product.images?.[0];

  return (
    <Link
      href={`/products/${product.id}`}
      prefetch
      id={`product-card-${product.id}`}
      className="group relative bg-[var(--surface)] rounded-3xl border border-[var(--border)] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[var(--primary)]/20 will-change-transform"
    >
      {/* Imagen */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef4ee] to-[#f7faf6] dark:from-[#1a2320] dark:to-[#131a17]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <Leaf size={48} className="text-green-300" aria-hidden />
        )}

        {/* Eco-score */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[var(--primary)] text-white pl-1.5 pr-2 py-0.5 rounded-full shadow-md">
          <Leaf size={10} className="text-green-300" />
          <span className="text-[11px] font-extrabold tabular-nums">{score}</span>
        </div>

        {/* Sello verificado */}
        <div className="absolute top-2.5 right-2.5 bg-[var(--surface)]/95 dark:bg-black/60 backdrop-blur w-7 h-7 rounded-full flex items-center justify-center shadow-sm" title="Producto auditado">
          <ShieldCheck size={14} className="text-green-600" />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-grow p-3">
        <p className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-0.5">{product.category}</p>
        <h4 className="font-bold text-sm leading-tight text-[var(--text)] line-clamp-2 min-h-[2.3em]">{product.name}</h4>

        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span className="text-base font-extrabold text-[var(--text)] leading-none">S/. {product.price.toFixed(2)}</span>
          <button
            id={`add-to-cart-${product.id}`}
            type="button"
            onClick={handleAddToCart}
            className="w-9 h-9 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center shadow-md shadow-[var(--primary)]/20 hover:scale-105 transition-all active:scale-95"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardInner);
