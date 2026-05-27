'use client';

import { useAuthStore } from '@/store/authStore';
import { User, ShieldCheck, Leaf, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-[var(--text-muted)] font-medium">Debes iniciar sesión para ver tu perfil.</p>
        <Link href="/auth/login?redirect=/profile" className="bg-[#1A3C34] text-white px-6 py-3 rounded-xl font-bold">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  const score = user.ecoScore || 0;
  const progress = Math.min(100, (score / 1000) * 100);

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="bg-[var(--surface)] rounded-[2rem] p-8 text-center border border-[var(--border)] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-[#1A3C34]" />
            <div className="w-24 h-24 bg-[var(--surface)] rounded-full mx-auto relative z-10 flex items-center justify-center border-4 border-white shadow-lg mb-4">
              <User size={40} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text)]">{user.fullName}</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">{user.email}</p>
            <div className="inline-flex items-center gap-1 bg-[var(--success-bg)] text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> {user.role}
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-[2rem] p-4 border border-[var(--border)] shadow-sm flex flex-col">
            <button className="flex items-center gap-3 p-4 text-[var(--text-muted)] hover:bg-[var(--input-bg)] rounded-xl transition font-medium text-sm text-left">
              <Settings size={18} /> Ajustes de Cuenta
            </button>
            <button onClick={logout} className="flex items-center gap-3 p-4 text-[var(--error)] hover:bg-[var(--error-bg)] rounded-xl transition font-medium text-sm text-left">
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="bg-[var(--surface)] rounded-[2rem] p-10 border border-[var(--border)] shadow-sm relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-5"><Leaf size={200} /></div>
            
            <h3 className="text-2xl font-bold text-[var(--text)] mb-2">Tu Eco-Score</h3>
            <p className="text-[var(--text-muted)] mb-8">Acumula puntos con cada compra sustentable y sube de nivel.</p>
            
            <div className="flex items-end justify-between mb-3">
              <span className="text-4xl font-extrabold text-[var(--primary)]">{score} <span className="text-lg text-[var(--text-muted)]">pts</span></span>
              <span className="text-sm font-bold text-[var(--text-muted)]">Meta: 1000 pts (Rango Eco-Guardián)</span>
            </div>
            
            <div className="h-4 bg-[var(--input-bg)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-[#1A3C34] transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/orders" className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm hover:border-[var(--success)] hover:shadow-md transition group">
              <h4 className="font-bold text-[var(--text)] mb-2 group-hover:text-[var(--primary)]">Mis Pedidos</h4>
              <p className="text-sm text-[var(--text-muted)]">Revisa tu historial de compras y trackings.</p>
            </Link>
            <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm hover:border-[var(--success)] hover:shadow-md transition group cursor-pointer">
              <h4 className="font-bold text-[var(--text)] mb-2 group-hover:text-[var(--primary)]">Mis Certificados</h4>
              <p className="text-sm text-[var(--text-muted)]">Insignias obtenidas por tus compras.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
