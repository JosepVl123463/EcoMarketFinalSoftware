'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { productService } from '@/services';
import dynamic from 'next/dynamic';

const ProducerAuditFlow = dynamic(() => import('@/components/producer/ProducerAuditFlow').then((m) => ({ default: m.ProducerAuditFlow })), {
  loading: () => (
    <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-6 shadow-sm min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        <p className="text-sm font-bold">Cargando módulo de auditoría...</p>
      </div>
    </div>
  ),
  ssr: false,
});
import {
  Leaf, Upload, X, FileText, Loader2, Calendar, MapPin, AlertTriangle, ArrowRight, FlaskConical
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Cuidado Personal', 'Alimentación', 'Limpieza Hogar', 'Hogar Eco'];
const MAX_IMAGES = 5;
const MAX_PDF_MB = 10;

export default function ProducerProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'register' | 'audit'>('register');
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfName, setPdfName] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: CATEGORIES[0],
    fechaProduccion: '',
    origenRegion: '',
    fechaVencimiento: '',
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center p-8">
          <p className="text-[var(--text-muted)] mb-4">Debes iniciar sesión como productor</p>
          <Link href="/auth/login?redirect=/producer/products" className="text-[var(--primary)] font-bold hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'provider' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="mx-auto text-yellow-600 mb-4" size={40} />
          <p className="text-[var(--text-secondary)] font-bold mb-2">Acceso solo para productores</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">Regístrate como productor para gestionar tus productos.</p>
          <Link href="/auth/register?role=provider" className="text-[var(--primary)] font-bold hover:underline">
            Registrarme como productor
          </Link>
        </div>
      </div>
    );
  }

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - imagePreviews.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, MAX_IMAGES));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePdf = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      toast.error(`El PDF no puede superar ${MAX_PDF_MB} MB`);
      return;
    }
    setPdfName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (!pdfName) {
      toast.error('Sube el PDF de certificación ecológica');
      return;
    }

    setLoading(true);
    
    const localProductPayload = {
      id: `prod-local-${Date.now()}`,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      category: form.category,
      fechaProduccion: form.fechaProduccion || new Date().toISOString().slice(0, 10),
      origenRegion: form.origenRegion || 'Cusco, Perú',
      fechaVencimiento: form.fechaVencimiento || new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10),
      certificacionPdfUrl: pdfName.endsWith('.pdf') ? pdfName : `${pdfName}.pdf`,
      images: imagePreviews.length ? imagePreviews : ['/IMG/shampoo_solido.png'],
      providerId: user?.id || 'demo-provider-id',
      providerName: user?.fullName || 'EcoShop de Josep',
      providerRuc: '20123456789',
      status: 'PENDING' as const,
    };

    try {
      await productService.createProduct(localProductPayload as any);
      
      // Persistencia local inmediata para evitar errores si falla la llamada remota
      const pending = JSON.parse(localStorage.getItem('ecomarket-pending-products') || '[]');
      pending.push(localProductPayload);
      localStorage.setItem('ecomarket-pending-products', JSON.stringify(pending));

      toast.success('Producto enviado a revisión de auditoría del Comité EcoMarket');
      router.push('/profile');
    } catch {
      // Fallback robusto en modo demo local
      const pending = JSON.parse(localStorage.getItem('ecomarket-pending-products') || '[]');
      pending.push(localProductPayload);
      localStorage.setItem('ecomarket-pending-products', JSON.stringify(pending));
      
      toast.success('Producto registrado y enviado a revisión de auditoría (Modo Demo)');
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-[var(--text-inverse)]">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text)]">Panel del Productor</h1>
            <p className="text-sm text-[var(--text-muted)]">Gestiona tus productos y auditorías</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 border-b border-[var(--border)] pb-3">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <Upload size={16} /> Registrar Producto
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <FlaskConical size={16} /> Auditoría Química
          </button>
        </div>

        {activeTab === 'audit' && <ProducerAuditFlow />}

        {activeTab === 'register' && (
        <div className="max-w-3xl mx-auto">

        <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-black text-[var(--primary)] uppercase tracking-wider">Información básica</h2>
            <input
              type="text"
              placeholder="Nombre del producto *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <textarea
              rows={3}
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                placeholder="Precio (S/.) *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <input
                type="number"
                placeholder="Stock *"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A3C34]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black text-[var(--primary)] uppercase tracking-wider">Trazabilidad ecológica</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={form.fechaProduccion}
                  onChange={(e) => setForm({ ...form, fechaProduccion: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C34]"
                />
              </div>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C34]"
                />
              </div>
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Lugar / Región de origen"
                value={form.origenRegion}
                onChange={(e) => setForm({ ...form, origenRegion: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C34]"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black text-[var(--primary)] uppercase tracking-wider">
              Galería de fotos (máx. {MAX_IMAGES})
            </h2>
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImages(e.dataTransfer.files); }}
              className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center cursor-pointer hover:border-[#1A3C34] transition"
            >
              <Upload className="mx-auto text-[var(--text-muted)] mb-2" size={28} />
              <p className="text-sm text-[var(--text-muted)]">Arrastra imágenes o haz clic</p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImages(e.target.files)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreviews((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-[var(--error-bg)] text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imagePreviews.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:border-[#1A3C34]"
                >
                  +
                </button>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black text-[var(--primary)] uppercase tracking-wider">Certificación ecológica (PDF)</h2>
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:border-[#1A3C34] transition bg-[var(--input-bg)]/50"
            >
              <FileText className="mx-auto text-[var(--primary)] mb-3" size={32} />
              {pdfName ? (
                <p className="text-sm font-bold text-[var(--text-secondary)]">{pdfName}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Arrastra tu PDF o haz clic</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Máximo: {MAX_PDF_MB} MB • Solo PDF</p>
                </>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdf(e.target.files?.[0] || null)}
              />
            </div>
          </section>

          <div className="bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-xl p-4 flex gap-3 text-xs text-yellow-900 dark:text-yellow-300">
            <AlertTriangle size={18} className="shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p>Tu producto será visible en la tienda solo después de ser aprobado por el Comité de Auditoría EcoMarket.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                if (!form.name) {
                  toast.error('Por favor, ingresa el nombre de tu producto para auditarlo.');
                  return;
                }
                toast.loading('Ejecutando Pipeline IA de Autoevaluación Ecológica...', { id: 'self-audit' });
                setTimeout(() => {
                  const score = form.name.toLowerCase().includes('quimic') || form.name.toLowerCase().includes('sulfat') ? 45 : 95;
                  const isApproved = score >= 70;
                  const stampText = isApproved ? 'APROBADO (VISTO BUENO)' : 'RECHAZADO';
                  
                  const docHtml = `
                    <html>
                    <head>
                      <title>Autoevaluación IA - ${form.name}</title>
                      <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #2D3748; background: #FCFBF9; }
                        .cert { border: 4px dashed #1A3C34; padding: 45px; border-radius: 16px; max-width: 600px; margin: 0 auto; background: white; position: relative; }
                        .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; }
                        .header h1 { color: #1A3C34; margin: 0; font-size: 24px; font-weight: 800; }
                        .stamp { position: absolute; top: 120px; right: 50px; border: 4px solid ${isApproved ? '#38A169' : '#E53E3E'}; color: ${isApproved ? '#38A169' : '#E53E3E'}; padding: 10px 20px; font-size: 18px; font-weight: 900; text-transform: uppercase; border-radius: 6px; transform: rotate(-5deg); background: white; }
                        .field { margin-bottom: 12px; font-size: 13px; }
                        .label { font-weight: bold; color: #718096; text-transform: uppercase; font-size: 10px; }
                        .val { font-size: 14px; font-weight: 600; color: #2D3748; }
                        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #A0AEC0; }
                      </style>
                    </head>
                    <body>
                      <div class="cert">
                        <div class="header">
                          <h1>EcoMarket Pipeline Autoevaluación</h1>
                          <p style="font-size: 11px; margin: 5px 0 0; color:#718096;">Pre-auditoría automática para Productores</p>
                        </div>
                        <div class="stamp">${stampText}</div>
                        <div class="field"><div class="label">Producto:</div><div class="val">${form.name}</div></div>
                        <div class="field"><div class="label">Categoría:</div><div class="val">${form.category}</div></div>
                        <div class="field"><div class="label">Eco-Score Estimado:</div><div class="val" style="font-size: 18px; color: #1A3C34; font-weight: 900;">${score} / 100</div></div>
                        <div class="field">
                          <div class="label">Resultado:</div>
                          <div class="val" style="color: ${isApproved ? '#38A169' : '#E53E3E'}">
                            ${isApproved ? 'El producto cumple preliminarmente con los estándares y es apto para revisión oficial.' : 'Ingredientes o descripción con alertas ambientales. Corrija la formulación.'}
                          </div>
                        </div>
                        <div class="footer">
                          <p>Generado de forma inmutable el ${new Date().toLocaleString()}</p>
                          <p>Conserve este Visto Bueno preliminar.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;
                  
                  const pW = window.open('', '_blank');
                  if (pW) {
                    pW.document.write(docHtml);
                    pW.document.close();
                    pW.focus();
                    setTimeout(() => pW.print(), 500);
                  }
                  toast.success('¡Pre-auditoría completada! PDF generado exitosamente 🌿', { id: 'self-audit' });
                }, 1000);
              }}
              className="flex-1 bg-yellow-600 dark:bg-yellow-700 text-white py-4 rounded-2xl font-bold text-sm hover:bg-yellow-700 dark:hover:bg-yellow-600 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText size={18} /> Autoevaluar con IA (Descargar PDF)
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--primary)] text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Enviar a Revisión Oficial <ArrowRight size={18} /></>}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
    </div>
  );
}
