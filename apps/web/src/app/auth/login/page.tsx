'use client';

import { useState, Suspense, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { sanitizeEmail, sanitizePassword } from '@/lib/sanitize';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Loader2, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
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
      if (!turnstileToken) {
        setError('Completa la verificación de seguridad.');
        return;
      }

      setLoading(true);
      try {
        const data = await authService.login(email, password, turnstileToken);
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
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { error?: string } } };
        const status = axiosError?.response?.status;
        const apiError = axiosError?.response?.data?.error;

        if (status === 429) {
          setError(apiError || 'Demasiados intentos. Espera 5 minutos antes de reintentar.');
        } else if (status === 403) {
          setError('Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.');
        } else {
          setError('Credenciales incorrectas. Intenta de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    },
    [form, router, searchParams, setAuth, turnstileToken]
  );

  return (
    <form id="login-form" onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-5">
      {error && (
        <div id="login-error" className="bg-[var(--error-bg)] text-[var(--error)] text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled
        className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h3.99c2.33-2.14 3.66-5.3 3.66-8.74z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.12c-1.11.74-2.53 1.19-3.97 1.19-3.05 0-5.63-2.06-6.55-4.83H1.47v3.22C3.48 20.3 7.46 24 12 24z" />
          <path fill="#FBBC05" d="M5.45 14.33a7.14 7.14 0 0 1 0-4.66V6.45H1.47a11.96 11.96 0 0 0 0 11.1l3.98-3.22z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.46 0 3.48 3.7 1.47 7.68l3.98 3.22c.92-2.77 3.5-4.83 6.55-4.83z" />
        </svg>
        <span>Iniciar sesión con Google</span>
      </button>

      <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-center -mt-2">
        <Info size={12} />
        OAuth requiere configuración del servidor (GOOGLE_CLIENT_ID).
      </p>

      <div className="flex items-center my-4">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span className="px-3 text-xs text-[var(--text-muted)] font-medium">o con credenciales</span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

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

      <TurnstileWidget
        onSuccess={(token) => setTurnstileToken(token)}
        onError={() => setError('Error en verificación de seguridad. Recarga la página.')}
      />

      <button
        id="login-submit-btn"
        type="submit"
        disabled={loading || !turnstileToken}
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
