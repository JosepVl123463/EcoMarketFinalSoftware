'use client';

import { useState, Suspense, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { sanitizeEmail, sanitizePassword } from '@/lib/sanitize';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const email = sanitizeEmail(form.email);
      const password = sanitizePassword(form.password);

      if (!email || !password) {
        setError('Por favor completa todos los campos.');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Ingresa un email válido.');
        return;
      }

      setLoading(true);
      try {
        const data = await authService.login(email, password);
        const user = {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role as 'customer' | 'provider' | 'admin',
          ecoScore: data.ecoScore ?? 0,
        };
        setAuth(user, data.token);
        toast.success(`¡Bienvenido de vuelta, ${user.fullName?.split(' ')[0]}!`);
        const redirect = searchParams.get('redirect') ?? (user.role === 'admin' ? '/admin' : '/');
        startTransition(() => router.push(redirect));
        return;
      } catch (err: unknown) {
        // La autenticación es responsabilidad exclusiva del backend.
        // Un fallo NUNCA debe conceder sesión (evita puertas traseras en el cliente).
        const axiosError = err as { response?: { status?: number; data?: { error?: string } } };
        const status = axiosError?.response?.status;
        const apiError = axiosError?.response?.data?.error;

        if (status === 429) {
          setError(apiError || 'Demasiados intentos. Espera 5 minutos antes de reintentar.');
        } else if (status === 401 || status === 400) {
          setError('Credenciales incorrectas. Intenta de nuevo.');
        } else {
          setError('No se pudo conectar con el servidor. Inténtalo más tarde.');
        }
      } finally {
        setLoading(false);
      }
    },
    [form, router, searchParams, setAuth]
  );

  return (
    <form id="login-form" onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-5">
      {error && (
        <div id="login-error" className="bg-[var(--error-bg)] text-[var(--error)] text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email-input" className="block text-sm font-bold mb-2">Email</label>
        <input
          id="email-input"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
        />
      </div>

      <div>
        <label htmlFor="password-input" className="block text-sm font-bold mb-2">Contraseña</label>
        <div className="relative">
          <input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm pr-12"
          />
          <button
            type="button"
            id="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-xs text-green-700 font-semibold hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        id="login-submit-btn"
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Ingresar'}
      </button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" id="go-to-register-link" className="text-[var(--primary)] font-bold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <Logo size={56} className="mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight">Iniciar Sesión</h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm">Accede a tu cuenta Ecomarket</p>
        </div>
        <Suspense
          fallback={
            <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
