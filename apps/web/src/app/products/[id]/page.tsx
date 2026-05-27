'use client';

import { useState, useEffect, use } from 'react';
import { productService, auditService, Product } from '@/services';
import { useCartStore } from '@/store/cartStore';
import { Star, Leaf, ShoppingBasket, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const prod = await productService.getById(resolvedParams.id);
        setProduct(prod);
      } catch (err) {
        // Fallback to finding in mock data if API fails
        const mockFetch = async () => {
           // Basic fallback logic
           setProduct({
             id: resolvedParams.id,
             name: 'Producto Ecológico',
             description: 'Detalle simulado por falta de conexión al servidor.',
             price: 15.0,
             stock: 10,
             category: 'Eco',
             ecoScore: 95,
             images: ['/IMG/shampoo_solido.png'],
             badges: ['Eco']
           });
        };
        await mockFetch();
      }

      try {
        const audit = await auditService.getProductAudit(resolvedParams.id);
        setAuditData(audit);
      } catch {
        setAuditData({
          eco_score: 95,
          badges: ["Vegan", "Plastic Free"],
          audit_hash: "0x3F2B89A1...",
          status: "APPROVED",
          details: { issues: [], timestamp: Date.now() / 1000, auditor: "AI System 1.0" }
        });
      }
      setLoading(false);
    };
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3C34]"></div></div>;
  }

  if (!product) return <div>Producto no encontrado</div>;

  const handleAddToCart = () => {
    addItem({ ...product, quantity: 1 });
    toast.success('Añadido al carrito');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] mb-8 font-semibold transition">
          <ArrowLeft size={18} /> Volver al Catálogo
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image & Ledger */}
          <div className="space-y-6">
            <div className="bg-[var(--input-bg)] rounded-[3rem] aspect-square flex items-center justify-center p-8 relative overflow-hidden">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full rounded-2xl shadow-xl" />
              ) : (
                <Leaf size={120} className="text-[var(--success)]" />
              )}
            </div>

            {/* QLDB Ledger Simulation */}
            {auditData && (
              <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-6 rounded-3xl font-mono text-xs shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheck size={64} /></div>
                <p className="text-white font-bold mb-2 uppercase tracking-widest text-[10px]">Registro Inmutable (Amazon QLDB)</p>
                <div className="space-y-1">
                  <p><span className="text-gray-400">Hash:</span> {auditData.audit_hash}</p>
                  <p><span className="text-gray-400">Timestamp:</span> {new Date(auditData.details?.timestamp * 1000).toISOString()}</p>
                  <p><span className="text-gray-400">Status:</span> <span className="bg-green-900/50 text-green-400 px-2 rounded">{auditData.status}</span></p>
                  <p><span className="text-gray-400">Auditor:</span> {auditData.details?.auditor}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details & Audit */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--success)] uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text)] mb-4 leading-tight">{product.name}</h1>
            
            <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">{product.description}</p>
            
            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-extrabold text-[var(--text)]">S/. {product.price.toFixed(2)}</span>
              <span className="text-[var(--text-muted)] font-medium pb-1">Stock: {product.stock} u.</span>
            </div>

            <button onClick={handleAddToCart} className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-3 mb-12 shadow-lg">
              <ShoppingBasket size={24} /> Añadir al Carrito
            </button>

            {/* Eco-Score Breakdown */}
            <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm">
              <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-2">
                <Leaf className="text-[var(--success)]" /> Auditoría de Ingredientes
              </h3>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-[var(--border)]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-[var(--success)] transition-all duration-1000 ease-out" strokeDasharray={`${auditData?.eco_score || 0}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-[var(--text)]">{auditData?.eco_score || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[var(--text)]">Puntaje Ecológico</p>
                  <p className="text-sm text-[var(--text-muted)]">Evaluado por IA en base a formulación química.</p>
                </div>
              </div>

              {/* Fake ingredient list with risk colors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-2">Desglose (Simulado)</h4>
                <div className="flex items-center justify-between p-3 bg-[var(--success-bg)] rounded-xl border border-[var(--success)]/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[var(--success)]" />
                    <span className="font-medium text-[var(--text)]">Extractos Orgánicos</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--success)] bg-[var(--success-bg)] px-2 py-1 rounded">Seguro</span>
                </div>
                {auditData?.details?.issues?.length > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-[var(--error-bg)] rounded-xl border border-[var(--error)]/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} className="text-[var(--error)]" />
                      <span className="font-medium text-[var(--text)]">Alerta: {auditData.details.issues[0]}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--error)] bg-[var(--error-bg)] px-2 py-1 rounded">Riesgo</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[var(--success-bg)] rounded-xl border border-[var(--success)]/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-[var(--success)]" />
                      <span className="font-medium text-[var(--text)]">Libre de Parabenos</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--success)] bg-[var(--success-bg)] px-2 py-1 rounded">Seguro</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
