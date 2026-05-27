'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productService, Product } from '@/services';
import {
  Users,
  Store,
  Award,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Plus,
  Mail,
  Edit,
  Activity,
  HeartHandshake
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductAuditTab } from '@/components/admin/ProductAuditTab';

// Mock Customer list
const initialCustomers = [
  { id: '11111111-1111-1111-1111-111111111111', fullName: 'Josep Garate', email: 'josep.garate@ecomarket.pe', role: 'admin', ecoScore: 900, status: 'Activo', registeredAt: '2026-04-12' },
  { id: '88888888-8888-8888-8888-888888888888', fullName: 'Administrador Principal', email: 'admin@ecomarket.pe', role: 'admin', ecoScore: 999, status: 'Activo', registeredAt: '2026-05-19' },
  { id: 'c1', fullName: 'Ana María Gómez', email: 'ana.gomez@gmail.com', role: 'customer', ecoScore: 185, status: 'Activo', registeredAt: '2026-05-02' },
  { id: 'c2', fullName: 'Carlos Rodríguez', email: 'carlos.rod@outlook.com', role: 'customer', ecoScore: 95, status: 'Activo', registeredAt: '2026-05-10' },
  { id: 'c3', fullName: 'Lucía Mendoza', email: 'lucia.m@gmail.com', role: 'customer', ecoScore: 230, status: 'Activo', registeredAt: '2026-05-14' },
  { id: 'c4', fullName: 'Mateo Quispe', email: 'm.quispe@hotmail.com', role: 'customer', ecoScore: 45, status: 'Inactivo', registeredAt: '2026-05-18' }
];

// Mock Producer list
const initialProducers = [
  { id: '33333333-3333-3333-3333-333333333333', businessName: 'EcoShop', ruc: '20123456789', email: 'proveedor.bio@ecomarket.pe', verified: true, ecoCertified: true, bankAccount: 'ES210049150000000000', salesCount: 42 },
  { id: 'p2', businessName: 'Biogranos del Sur', ruc: '20987654321', email: 'contacto@biogranos.pe', verified: false, ecoCertified: true, bankAccount: 'ES210049150000000001', salesCount: 15 },
  { id: 'p3', businessName: 'Selva Viva SAC', ruc: '20564738291', email: 'gerencia@selvaviva.pe', verified: true, ecoCertified: false, bankAccount: 'ES210049150000000002', salesCount: 8 },
  { id: 'p4', businessName: 'Hacienda Orgánica', ruc: '20493817263', email: 'hacienda.organica@outlook.com', verified: false, ecoCertified: false, bankAccount: 'ES210049150000000003', salesCount: 0 }
];

// Mock Audit list matching the 12 products
const mockAudits: Record<string, any> = {
  '00000000-0000-0000-0000-000000000001': {
    name: 'Shampoo Sólido de Verbena',
    hash: '0x3F2B89A1D7C4F2B0A9E7F6C5B4A3D2E1',
    block: 412,
    auditor: 'AI System v2.1 (Ecomarket)',
    timestamp: '2026-05-18T14:23:10Z',
    ingredients: [
      { name: 'Sodium Cocoyl Isethionate', conc: '45%', safety: 'green', desc: 'Tensioactivo suave derivado del coco.' },
      { name: 'Verbena Officinalis Extract', conc: '10%', safety: 'green', desc: 'Extracto natural aromático.' },
      { name: 'Cocos Nucifera Oil', conc: '15%', safety: 'green', desc: 'Aceite de coco nutritivo.' },
      { name: 'Parfum Natural', conc: '1%', safety: 'yellow', desc: 'Fragancia de origen natural.' }
    ]
  },
  '00000000-0000-0000-0000-000000000002': {
    name: 'Proteína de Arveja Orgánica',
    hash: '0x7A4C9B3E2F8D1C5A6B9E8D7F6C5B4A3E',
    block: 388,
    auditor: 'AI System v2.1 (Ecomarket)',
    timestamp: '2026-05-12T09:15:42Z',
    ingredients: [
      { name: 'Organic Pea Protein Isolate', conc: '98%', safety: 'green', desc: 'Proteína aislada de arveja orgánica.' },
      { name: 'Xanthan Gum', conc: '1.5%', safety: 'green', desc: 'Espesante natural seguro.' },
      { name: 'Stevia Extract', conc: '0.5%', safety: 'green', desc: 'Endulzante natural sin calorías.' }
    ]
  },
  '00000000-0000-0000-0000-000000000003': {
    name: 'Detergente Biodegradable',
    hash: '0x9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B',
    block: 405,
    auditor: 'AI System v2.1 (Ecomarket)',
    timestamp: '2026-05-16T18:44:02Z',
    ingredients: [
      { name: 'Aqua', conc: '70%', safety: 'green', desc: 'Agua purificada.' },
      { name: 'Lauryl Glucoside', conc: '15%', safety: 'green', desc: 'Tensioactivo biodegradable derivado del maíz.' },
      { name: 'Sodium Carbonate', conc: '10%', safety: 'green', desc: 'Agente alcalinizante mineral.' },
      { name: 'Citric Acid', conc: '5%', safety: 'green', desc: 'Ajustador de pH orgánico.' }
    ]
  },
  '00000000-0000-0000-0000-000000000004': {
    name: 'Cepillo Bambú Moso',
    hash: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D',
    block: 295,
    auditor: 'Certificación PerúEco',
    timestamp: '2026-03-22T11:05:00Z',
    ingredients: [
      { name: 'Moso Bamboo Wood', conc: '95%', safety: 'green', desc: 'Madera de bambú de rápido crecimiento compostable.' },
      { name: 'Nylon 6 Biodegradable Bristles', conc: '5%', safety: 'yellow', desc: 'Cerdas biodegradables de alto rendimiento.' }
    ]
  }
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'producers' | 'products'>('overview');

  // Loading states
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState(initialCustomers);
  const [producers, setProducers] = useState(initialProducers);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  // Statistics
  const totalSales = 14820;
  const platformFee = totalSales * 0.15;

  useEffect(() => {
    // Access validation
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión como administrador para acceder a esta ruta.');
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Acceso denegado. Se requieren privilegios de Administrador.');
      router.push('/');
      return;
    }

    setCheckingAuth(false);

    // Fetch actual products inside the marketplace
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll({ size: 20 });
        if (data && data.content) {
          setProducts(data.content);
        }
      } catch (err) {
        console.error('Error fetching marketplace products:', err);
      }
    };
    fetchProducts();
  }, [isAuthenticated, user, router]);

  // Handle Verify Producer Action
  const handleVerifyProducer = (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Validando RUC y Certificaciones de ${name}...`,
        success: () => {
          setProducers(prev =>
            prev.map(prod =>
              prod.id === id ? { ...prod, verified: true, ecoCertified: true } : prod
            )
          );
          return `¡${name} ha sido verificado y certificado exitosamente! 🌿`;
        },
        error: 'Error al procesar la verificación.'
      }
    );
  };

  // Handle Toggle Customer Status Action
  const handleToggleCustomerStatus = (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    setCustomers(prev =>
      prev.map(cust =>
        cust.id === id ? { ...cust, status: nextStatus } : cust
      )
    );
    toast.success(`Cliente ${name} ahora está ${nextStatus}`);
  };

  // Handle Boost Customer Score Action
  const handleBoostEcoScore = (id: string, name: string) => {
    setCustomers(prev =>
      prev.map(cust =>
        cust.id === id ? { ...cust, ecoScore: cust.ecoScore + 50 } : cust
      )
    );
    toast.success(`¡Se añadieron +50 Eco-Puntos a ${name} por compras responsables! 🎉`);
  };

  // Inspect AI Audit Checklist
  const inspectAudit = (product: Product) => {
    const auditInfo = mockAudits[product.id] || {
      name: product.name,
      hash: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}E3C4D...`,
      block: Math.floor(Math.random() * 200) + 100,
      auditor: 'AI Engine v1.0 (Auto-Audited)',
      timestamp: new Date().toISOString(),
      ingredients: [
        { name: 'Materia Orgánica Base', conc: '85%', safety: 'green', desc: 'Ingredientes 100% de origen vegetal.' },
        { name: 'Agentes Acondicionadores', conc: '12%', safety: 'green', desc: 'Componentes bio-sostenibles.' },
        { name: 'Aditivos Orgánicos', conc: '3%', safety: 'yellow', desc: 'Fragancias naturales tolerables.' }
      ]
    };
    setSelectedAudit(auditInfo);
  };

  // Filter lists based on inputs
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = cust.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cust.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || 
                          (statusFilter === 'ADMIN' && cust.role === 'admin') || 
                          (statusFilter === 'CUSTOMER' && cust.role === 'customer');
    return matchesSearch && matchesFilter;
  });

  const filteredProducers = producers.filter(prod => {
    const matchesSearch = prod.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.ruc.includes(searchQuery);
    const matchesFilter = statusFilter === 'ALL' || 
                          (statusFilter === 'VERIFIED' && prod.verified) || 
                          (statusFilter === 'PENDING' && !prod.verified);
    return matchesSearch && matchesFilter;
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-[var(--primary)] mb-4" size={48} />
        <p className="text-[var(--text-muted)] font-bold tracking-wide">Autenticando Acceso Administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-20">
      {/* Premium Dashboard Header */}
      <header className="bg-gradient-to-r from-[#1A3C34] to-[#122A24] text-white py-12 px-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity size={240} />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-[#E6F4EA] text-[var(--primary)] font-bold text-xs px-3 py-1.5 rounded-full w-fit shadow-inner">
              <Zap size={14} className="animate-pulse" />
              <span>SISTEMA AUDITADO GLOBAL</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Panel Administrativo</h1>
            <p className="text-green-100 mt-2 text-sm max-w-xl">
              Supervisión de clientes, productores certificados y transacciones verificadas con respaldo inmutable de cadena de bloques (QLDB).
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-[var(--surface)]/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-lg">
            <div className="w-10 h-10 bg-[var(--surface)]/20 rounded-full flex items-center justify-center font-bold text-[#FFDF00]">
              👑
            </div>
            <div>
              <p className="text-xs text-green-200 font-semibold">Administrador Activo</p>
              <p className="text-sm font-bold">{user?.fullName || 'Administrador principal'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3 mb-8">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg translate-y-[-1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <TrendingUp size={18} />
            Resumen General
          </button>
          
          <button
            onClick={() => { setActiveTab('customers'); setActiveTab('customers'); setSearchQuery(''); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg translate-y-[-1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <Users size={18} />
            Clientes ({customers.length})
          </button>

          <button
            onClick={() => { setActiveTab('producers'); setSearchQuery(''); setStatusFilter('ALL'); }}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'producers'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg translate-y-[-1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <Store size={18} />
            Productores ({producers.length})
          </button>

          <button
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg translate-y-[-1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <Award size={18} />
            Auditoría de Productos ({products.length > 0 ? products.length : 12})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[var(--success-bg)] rounded-2xl flex items-center justify-center text-green-700 font-bold text-xl group-hover:scale-105 transition-transform">
                    S/.
                  </div>
                      <span className="text-[11px] font-extrabold bg-[var(--success-bg)] text-[var(--success)] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ArrowUpRight size={10} /> +15.4%
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ventas Totales</p>
                <p className="text-2xl font-black text-[var(--text)] mt-1">S/. {totalSales.toFixed(2)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Comisión Plataforma (15%): S/. {platformFee.toFixed(2)}</p>
              </div>

              <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[var(--info-bg)] rounded-2xl flex items-center justify-center text-[var(--info)] group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                      <span className="text-[11px] font-extrabold bg-[var(--info-bg)] text-[var(--info)] px-2.5 py-1 rounded-full">
                    +4 nuevos
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Clientes Activos</p>
                <p className="text-2xl font-black text-[var(--text)] mt-1">{customers.filter(c => c.role === 'customer').length}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Eco-Puntos acumulados: {customers.reduce((acc, c) => acc + c.ecoScore, 0)}</p>
              </div>

              <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
                    <Store size={20} />
                  </div>
                  <span className="text-[11px] font-extrabold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-full">
                    50% Certificado
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Productores Registrados</p>
                <p className="text-2xl font-black text-[var(--text)] mt-1">{producers.length}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Validados por RUC: {producers.filter(p => p.verified).length}</p>
              </div>

              <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-700 dark:text-orange-300 group-hover:scale-105 transition-transform">
                    <Award size={20} />
                  </div>
                  <span className="text-[11px] font-extrabold bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 px-2.5 py-1 rounded-full">
                    Rango Excelente
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Eco-Score Promedio</p>
                <p className="text-2xl font-black text-[var(--text)] mt-1">96.2 / 100</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Auditorías aprobadas por IA: 100%</p>
              </div>
            </div>

            {/* Graphs & Audits Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales Chart Mockup */}
              <div className="lg:col-span-2 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-[var(--text)]">Actividad de Transacciones</h3>
                    <p className="text-xs text-[var(--text-muted)]">Distribución de compras ecológicas (Mayo 2026)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[var(--primary)] rounded-full inline-block"></span>
                    <span className="text-xs font-bold text-[var(--text-muted)]">Monto (S/.)</span>
                  </div>
                </div>

                {/* SVG Beautiful Bar Graph */}
                <div className="h-64 w-full flex items-end justify-between pt-6 border-b border-[var(--border)] pb-1 px-4 relative">
                  <div className="absolute left-0 right-0 top-1/3 border-t border-dashed border-[var(--border)]"></div>
                  <div className="absolute left-0 right-0 top-2/3 border-t border-dashed border-[var(--border)]"></div>

                  <div className="flex flex-col items-center gap-2 w-12 group">
                    <div className="w-8 bg-[var(--input-bg)] dark:bg-gray-700 rounded-t-lg h-32 group-hover:bg-[var(--primary)] transition-all duration-300 relative shadow-sm">
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-950 text-white text-[10px] px-2 py-1 rounded font-bold transition-opacity">S/.1,200</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Sem 01</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-12 group">
                    <div className="w-8 bg-[var(--input-bg)] dark:bg-gray-700 rounded-t-lg h-44 group-hover:bg-[var(--primary)] transition-all duration-300 relative shadow-sm">
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-950 text-white text-[10px] px-2 py-1 rounded font-bold transition-opacity">S/.2,800</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Sem 02</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-12 group">
                    <div className="w-8 bg-[var(--input-bg)] dark:bg-gray-700 rounded-t-lg h-48 group-hover:bg-[var(--primary)] transition-all duration-300 relative shadow-sm">
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-950 text-white text-[10px] px-2 py-1 rounded font-bold transition-opacity">S/.3,400</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Sem 03</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-12 group">
                    <div className="w-8 bg-[var(--primary)] rounded-t-lg h-56 relative shadow-sm">
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-950 text-white text-[10px] px-2 py-1 rounded font-bold">S/.7,420</span>
                    </div>
                    <span className="text-[10px] text-[var(--text)] font-bold uppercase">Sem 04</span>
                  </div>
                </div>
              </div>

              {/* Immutable AI Audit Feed */}
              <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-[var(--text)]">Auditorías Inmutables</h3>
                  <p className="text-xs text-[var(--text-muted)]">Verificaciones de ingredientes por IA & QLDB</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start border-l-2 border-green-500 pl-4 py-1">
                    <div className="w-7 h-7 bg-[var(--success-bg)] rounded-full flex items-center justify-center text-green-700 flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">Shampoo Sólido de Verbena</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Pureza 98% • Ingredientes Verdes</p>
                      <p className="text-[9px] font-mono text-green-600 mt-1 bg-[var(--success-bg)] px-2.5 py-0.5 rounded w-fit">Hash: 0x3F2B89A1...</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start border-l-2 border-green-500 pl-4 py-1">
                    <div className="w-7 h-7 bg-[var(--success-bg)] rounded-full flex items-center justify-center text-green-700 flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">Proteína de Arveja Orgánica</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Pureza 95% • Ingredientes Certificados</p>
                      <p className="text-[9px] font-mono text-green-600 mt-1 bg-[var(--success-bg)] px-2.5 py-0.5 rounded w-fit">Hash: 0x7A4C9B3E...</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start border-l-2 border-yellow-500 pl-4 py-1">
                    <div className="w-7 h-7 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-700 flex-shrink-0">
                      <AlertCircle size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">Cepillo Bambú Moso</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Nylon 6 requiere revisión de compostabilidad</p>
                      <p className="text-[9px] font-mono text-yellow-600 mt-1 bg-yellow-50 px-2.5 py-0.5 rounded w-fit">Hash: 0x1A2B3C4D...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-[var(--text)]">Clientes de la Plataforma</h3>
                <p className="text-xs text-[var(--text-muted)]">Visualiza y gestiona las cuentas de los consumidores registrados en EcoMarket.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-xs transition"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text)]"
                  >
                    <option value="ALL">Todos los Roles</option>
                    <option value="ADMIN">Administradores</option>
                    <option value="CUSTOMER">Clientes Estándar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] font-extrabold uppercase text-[10px] border-b border-[var(--border)]">
                    <th className="p-4 pl-6">Usuario</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Eco-Score (Puntos)</th>
                    <th className="p-4">Registro</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100 font-medium">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[var(--text-muted)] font-bold">
                        Ningún usuario coincide con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-[var(--input-bg)]/50 transition">
                        <td className="p-4 pl-6 font-bold text-[var(--text)]">{cust.fullName}</td>
                        <td className="p-4 text-[var(--text-muted)]">{cust.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                            cust.role === 'admin' 
                              ? 'bg-[var(--error-bg)] text-[var(--error)] border border-red-100'
                              : 'bg-[var(--success-bg)] text-green-700 border border-green-100'
                          }`}>
                            {cust.role === 'admin' ? 'ADMIN' : 'CLIENTE'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[var(--text)]">
                          🌱 {cust.ecoScore} pts
                        </td>
                        <td className="p-4 text-[var(--text-muted)]">{cust.registeredAt}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            cust.status === 'Activo'
                              ? 'bg-green-100 text-[var(--success)]'
                              : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cust.status === 'Activo' ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                            {cust.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleBoostEcoScore(cust.id, cust.fullName)}
                              title="Bonificar Eco-Puntos"
                              className="p-1.5 bg-[var(--success-bg)] text-green-700 rounded-lg hover:bg-green-100 transition"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleCustomerStatus(cust.id, cust.fullName, cust.status)}
                              title="Activar/Desactivar cuenta"
                              className={`p-1.5 rounded-lg transition ${
                                cust.status === 'Activo' 
                                  ? 'bg-[var(--error-bg)] text-[var(--error)] hover:bg-red-100' 
                                  : 'bg-[var(--success-bg)] text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {cust.status === 'Activo' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCERS TAB */}
        {activeTab === 'producers' && (
          <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-[var(--text)]">Productores & Proveedores</h3>
                <p className="text-xs text-[var(--text-muted)]">Verifica la legalidad de los productores (RUC) y valida su nivel de certificación ecológica.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Buscar RUC o Razón Social..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-xs transition"
                  />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text)]"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="VERIFIED">RUC Verificados</option>
                    <option value="PENDING">Pendientes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] font-extrabold uppercase text-[10px] border-b border-[var(--border)]">
                    <th className="p-4 pl-6">Razón Social</th>
                    <th className="p-4">RUC</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Verificación RUC</th>
                    <th className="p-4">Certificación Eco</th>
                    <th className="p-4">Ventas Registradas</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100 font-medium">
                  {filteredProducers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[var(--text-muted)] font-bold">
                        Ningún productor coincide con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredProducers.map((prod) => (
                      <tr key={prod.id} className="hover:bg-[var(--input-bg)]/50 transition">
                        <td className="p-4 pl-6 font-bold text-[var(--text)] flex items-center gap-2">
                          <div className="w-8 h-8 bg-[var(--input-bg)] rounded-lg flex items-center justify-center text-[var(--text-muted)] font-black">
                            {prod.businessName.charAt(0)}
                          </div>
                          {prod.businessName}
                        </td>
                        <td className="p-4 font-mono text-[var(--text-muted)]">{prod.ruc}</td>
                        <td className="p-4 text-[var(--text-muted)]">{prod.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            prod.verified
                              ? 'bg-[var(--success-bg)] text-green-700 border border-[var(--success)]'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}>
                            {prod.verified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {prod.verified ? 'Verificado Sunat' : 'Pendiente Validación'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            prod.ecoCertified
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border)]'
                          }`}>
                            <Award size={12} />
                            {prod.ecoCertified ? 'Certificado' : 'Sin Certificado'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[var(--text)]">{prod.salesCount} órdenes</td>
                        <td className="p-4 pr-6 text-right">
                          {!prod.verified || !prod.ecoCertified ? (
                            <button
                              onClick={() => handleVerifyProducer(prod.id, prod.businessName)}
                              className="px-3.5 py-2 bg-[var(--primary)] text-white rounded-xl font-bold text-[10px] hover:opacity-90 transition shadow-sm"
                            >
                              Validar & Certificar
                            </button>
                          ) : (
                            <span className="text-[10px] text-green-700 font-bold bg-[var(--success-bg)] px-3 py-2 rounded-xl">
                              ✓ Validado Completo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS AUDIT TAB */}
        {activeTab === 'products' && <ProductAuditTab />}
      </main>

      {/* Audit Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-[2.5rem] max-w-2xl w-full p-8 shadow-2xl space-y-6 relative overflow-hidden animate-scaleIn">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-[var(--success)]">
              <ShieldCheck size={280} />
            </div>

            <div className="flex justify-between items-start border-b border-[var(--border)] pb-4 relative z-10">
              <div>
                <h4 className="text-xl font-black text-[var(--text)]">{selectedAudit.name}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Ficha Técnica de Auditoría de Pureza Ética</p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="w-9 h-9 bg-[var(--input-bg)] hover:bg-gray-200 text-[var(--text-muted)] rounded-full flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* QLDB Immutable ledger */}
            <div className="bg-gray-950 text-green-400 p-6 rounded-2xl font-mono text-[10px] leading-relaxed relative shadow-inner">
              <div className="absolute top-4 right-4 text-white/20"><ShieldCheck size={48} /></div>
              <p className="text-white font-extrabold text-[9px] tracking-widest uppercase mb-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[var(--success-bg)]0 rounded-full animate-ping"></span>
                REGISTRO INMUTABLE (AMAZON QLDB LEDGER)
              </p>
              <p><span className="text-[var(--text-muted)]">Hash de Bloque:</span> {selectedAudit.hash}</p>
              <p><span className="text-[var(--text-muted)]">Dirección Bloque:</span> Bloque #{selectedAudit.block} (Dirección Lógica)</p>
              <p><span className="text-[var(--text-muted)]">Fecha de Registro:</span> {selectedAudit.timestamp}</p>
              <p><span className="text-[var(--text-muted)]">Auditor Firmante:</span> {selectedAudit.auditor}</p>
            </div>

            {/* Chemical Ingredients Safety checklist */}
            <div className="space-y-4">
              <h5 className="text-xs font-black text-[var(--text)] flex items-center gap-1.5">
                <FileText size={14} className="text-[var(--success)]" />
                DESGLOSE DE INGREDIENTES Y SEGURIDAD
              </h5>
              
              <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                {selectedAudit.ingredients.map((ing: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[var(--input-bg)] rounded-xl p-3 border border-[var(--border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[var(--text)]">{ing.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] bg-gray-200/60 px-1.5 py-0.5 rounded font-bold">{ing.conc}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">{ing.desc}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] flex items-center gap-1 ${
                      ing.safety === 'green'
                        ? 'bg-green-100 text-[var(--success)]'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${ing.safety === 'green' ? 'bg-green-600' : 'bg-yellow-500'}`}></span>
                      {ing.safety === 'green' ? 'SEGURO' : 'PRECAUCIÓN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedAudit(null)}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold text-xs hover:opacity-90 transition"
            >
              Cerrar Ficha Técnica
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
