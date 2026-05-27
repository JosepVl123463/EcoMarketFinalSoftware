'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { productService, Product, ProductFilters } from '@/services';
import { Leaf, Search } from 'lucide-react';

const CATEGORIES = ['Todos', 'Cuidado Personal', 'Alimentación', 'Limpieza Hogar', 'Hogar Eco'];

// Fallback products for local development (when API not running)
const MOCK_PRODUCTS: Product[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Shampoo Sólido de Verbena', description: 'Fórmula 100% natural sin sulfatos ni parabenos.', price: 14.50, stock: 50, category: 'Cuidado Personal', ecoScore: 98, images: ['/IMG/shampoo_solido.png'], badges: ['Plastic Free', 'Vegan'] },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Proteína de Arveja Orgánica', description: 'Alta proteína vegetal certificada orgánica.', price: 32.00, stock: 30, category: 'Alimentación', ecoScore: 95, images: ['/IMG/proteina_arveja.png'], badges: ['Gluten Free', 'Keto'] },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Detergente Biodegradable', description: 'Limpieza efectiva con fórmula biodegradable al 100%.', price: 18.90, stock: 100, category: 'Limpieza Hogar', ecoScore: 92, images: ['/IMG/detergente_bio.png'], badges: ['Ecolabel', 'Refill'] },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Cepillo Bambú Moso', description: 'Cepillo de dientes de bambú certificado compostable.', price: 5.50, stock: 200, category: 'Cuidado Personal', ecoScore: 99, images: ['/IMG/cepillo_bambu.png'], badges: ['Compostable', 'BPA Free'] },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Aceite de Coco Virgen', description: 'Extracción en frío, comercio justo certificado.', price: 22.00, stock: 60, category: 'Alimentación', ecoScore: 96, images: ['/IMG/aceite_coco.png'], badges: ['Vegan', 'Fair Trade'] },
  { id: '00000000-0000-0000-0000-000000000006', name: 'Jabón de Avena Natural', description: 'Hidratante y calmante para piel sensible.', price: 8.90, stock: 150, category: 'Cuidado Personal', ecoScore: 91, images: ['/IMG/jabon_avena.png'], badges: ['Vegan', 'Plastic Free'] },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Bolsas Reutilizables Orgánicas', description: 'Bolsas de algodón orgánico certificado GOTS.', price: 12.00, stock: 80, category: 'Hogar Eco', ecoScore: 97, images: ['/IMG/aceite_coco.png'], badges: ['Zero Waste', 'Compostable'] },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Té Verde Matcha Ceremonial', description: 'Grado ceremonial japonés, cultivo biológico.', price: 38.00, stock: 40, category: 'Alimentación', ecoScore: 94, images: ['/IMG/proteina_arveja.png'], badges: ['Vegan', 'Gluten Free'] },
  { id: '00000000-0000-0000-0000-000000000009', name: 'Desodorante Natural en Barra', description: 'Desodorante orgánico libre de aluminio y plástico.', price: 16.90, stock: 120, category: 'Cuidado Personal', ecoScore: 97, images: ['/IMG/desodorante_natural.png'], badges: ['Vegan', 'Aluminium Free'] },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Crema Facial Hidratante Aloe', description: 'Crema hidratante de aloe vera biológico para el rostro.', price: 28.50, stock: 75, category: 'Cuidado Personal', ecoScore: 95, images: ['/IMG/jabon_avena.png'], badges: ['Vegan', 'Bio'] },
  { id: '00000000-0000-0000-0000-000000000011', name: 'Harina de Almendras Orgánica', description: 'Harina fina de almendras orgánicas, ideal keto.', price: 24.00, stock: 90, category: 'Alimentación', ecoScore: 93, images: ['/IMG/proteina_arveja.png'], badges: ['Vegan', 'Keto'] },
  { id: '00000000-0000-0000-0000-000000000012', name: 'Esponja de Luffa Vegetal', description: 'Esponja exfoliante 100% biodegradable.', price: 7.90, stock: 110, category: 'Hogar Eco', ecoScore: 100, images: ['/IMG/cepillo_bambu.png'], badges: ['Compostable', 'Zero Waste'] },
];

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [filters, setFilters] = useState<ProductFilters>({ page: 0, size: 12 });

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('q');

  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, [searchParam]);

  // Sync category from URL search params
  useEffect(() => {
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      setActiveCategory(decodedCategory);
      setFilters(f => ({ ...f, category: decodedCategory === 'Todos' ? undefined : decodedCategory }));
    } else {
      setActiveCategory('Todos');
      setFilters(f => ({ ...f, category: undefined }));
    }
  }, [categoryParam]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getAll(filters);
        if (res.content && res.content.length > 0) {
          setProducts(res.content);
        } else {
          // If content is empty but success, fallback to filtered mocks
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        // Fallback to local mocks
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  // Client-side search and category filtering for mock fallback/robustness
  const displayed = products.filter(p => {
    const matchesSearch = search === '' || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="max-w-7xl mx-auto px-6 mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text)]">Selección Curada</h2>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Productos que superaron el 9.0 en nuestro Eco-Score</p>
        </div>
        {/* Search bar */}
        <div className="flex bg-[var(--input-bg)] rounded-full px-4 py-2 items-center gap-2 w-full md:w-auto">
          <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            id="product-search-input"
            type="text"
            placeholder="Buscar productos..."
            className="bg-transparent border-none focus:outline-none text-sm w-full md:w-52"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-8 hide-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`filter-${cat.replace(/\s/g, '-').toLowerCase()}`}
            onClick={() => {
              setActiveCategory(cat);
              setFilters(f => ({ ...f, category: cat === 'Todos' ? undefined : cat }));
            }}
            className={`flex-none px-6 py-3 rounded-2xl font-semibold text-sm transition whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[var(--input-bg)] rounded-[2rem] aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : displayed.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <Leaf size={48} className="mx-auto text-[var(--border)] mb-4" />
          <p className="text-[var(--text-muted)] font-medium">No encontramos productos con esos filtros</p>
        </div>
      )}
    </main>
  );
}
