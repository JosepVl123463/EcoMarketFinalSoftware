'use client';

import { useState, Suspense, useCallback, useTransition, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { sanitizeEmail, sanitizePassword } from '@/lib/sanitize';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0); // cuenta regresiva de bloqueo
  const [, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Cuenta regresiva cuando el servidor bloquea por demasiados intentos.
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setInterval(() => setLockSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockSeconds]);

  const emailValid = EMAIL_RE.test(form.email.trim());
  const canSubmit = emailValid && form.password.length > 0 && !loading && lockSeconds === 0;

  const onPwKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

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
      if (!EMAIL_RE.test(email)) {
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

        if (status === 429) {
          // Bloqueo temporal por demasiados intentos: se muestra cuenta regresiva.
          setLockSeconds(60);
          setError('Demasiados intentos. Por seguridad, tu acceso está bloqueado temporalmente.');
        } else if (status === 401 || status === 400) {
          // Mensaje genérico: no revela si el email existe (anti-enumeración).
          setError('Correo o contraseña incorrectos.');
        } else {
          setError('No se pudo conectar con el servidor. Inténtalo en unos segundos.');
        }
      } finally {
        setLoading(false);
      }
    },
    [form, router, searchParams, setAuth]
  );

  const mmss = `${String(Math.floor(lockSeconds / 60)).padStart(2, '0')}:${String(lockSeconds % 60).padStart(2, '0')}`;

  return (
    <form id="login-form" onSubmit={handleSubmit} noValidate className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-5">
      {error && (
        <div id="login-error" role="alert" aria-live="assertive" className="bg-[var(--error-bg)] text-[var(--error)] text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {lockSeconds > 0 && (
        <div role="status" aria-live="polite" className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-secondary)] text-sm p-4 rounded-xl flex items-center gap-3">
          <Lock size={18} className="shrink-0 text-[var(--primary)]" />
          <span>Podrás reintentar en <strong className="font-mono tabular-nums">{mmss}</strong></span>
        </div>
      )}

      <div>
        <label htmlFor="email-input" className="block text-sm font-bold mb-2">Correo electrónico</label>
        <div className="relative">
          <input
            ref={emailRef}
            id="email-input"
            type="email"
            inputMode="email"
            placeholder="tu@email.com"
            autoComplete="email"
            aria-invalid={emailTouched && !emailValid}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            className={`w-full px-4 py-3 bg-[var(--input-bg)] border rounded-xl focus:outline-none focus:ring-2 text-sm pr-10 transition ${
              emailTouched && form.email
                ? emailValid
                  ? 'border-green-400 focus:ring-green-300'
                  : 'border-[var(--error)] focus:ring-red-300'
                : 'border-[var(--border)] focus:ring-[var(--primary)]'
            }`}
          />
          {emailTouched && form.email && emailValid && (
            <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
          )}
        </div>
        {emailTouched && form.email && !emailValid && (
          <p className="text-xs text-[var(--error)] mt-1.5">Ingresa un correo con formato válido.</p>
        )}
      </div>

      <div>
        <label htmlFor="password-input" className="block text-sm font-bold mb-2">Contraseña</label>
        <div className="relative">
          <input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyUp={onPwKey}
            onKeyDown={onPwKey}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm pr-12"
          />
          <button
            type="button"
            id="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {capsLock && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertCircle size={12} /> Bloq Mayús está activado
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-xs text-green-700 font-semibold hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        id="login-submit-btn"
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={20} className="animate-spin" /> Verificando…</> : lockSeconds > 0 ? `Bloqueado (${mmss})` : 'Ingresar'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <ShieldCheck size={13} className="text-green-600" />
        <span>Conexión cifrada · Tus datos viajan protegidos (TLS)</span>
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] border-t border-[var(--border)] pt-4">
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
