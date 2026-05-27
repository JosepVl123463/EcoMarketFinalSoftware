'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Package, Truck, Calendar, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  platformFee: number;
  createdAt: string;
  items: any[];
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchOrders = async () => {
        try {
          const { data } = await api.get(`/api/orders/customer/${user.id}`);
          setOrders(data);
        } catch {
          // Mock data for demo
          setOrders([
            {
              id: '00000000-0000-0000-0000-000000000001',
              status: 'paid',
              totalAmount: 34.50,
              platformFee: 5.17,
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              items: []
            },
            {
              id: 'ORD-1779219219',
              status: 'pending',
              totalAmount: 18.90,
              platformFee: 2.83,
              createdAt: new Date().toISOString(),
              items: []
            }
          ]);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-[var(--text-muted)] font-medium">Debes iniciar sesión para ver tus pedidos.</p>
        <Link href="/auth/login?redirect=/orders" className="bg-[#1A3C34] text-white px-6 py-3 rounded-xl font-bold">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]">Mis Pedidos</h1>
            <p className="text-[var(--text-muted)] font-medium">Historial de compras y seguimiento</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3C34]"></div></div>
        ) : orders.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-[2rem] p-16 text-center border border-[var(--border)] shadow-sm">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Aún no has hecho pedidos</h3>
            <p className="text-[var(--text-muted)] mb-8">Tus compras con impacto positivo aparecerán aquí.</p>
            <Link href="/" className="bg-[#1A3C34] text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-800 transition">
              Empezar a explorar
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm transition hover:shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-50 pb-6">
                  <div>
                    <p className="text-sm text-[var(--text-muted)] font-bold tracking-widest uppercase mb-1">Pedido #{order.id.substring(0,8)}</p>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-extrabold text-[var(--text)]">S/. {order.totalAmount.toFixed(2)}</span>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      order.status === 'paid' || order.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status === 'paid' ? 'Pagado' : order.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-green-700 font-medium">
                    <Truck size={18} />
                    Envío Carbono Neutral
                  </div>
                  <button className="text-[var(--primary)] font-bold hover:underline flex items-center gap-1">
                    <Search size={16} /> Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
