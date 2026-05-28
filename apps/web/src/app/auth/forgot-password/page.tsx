'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { sanitizeEmail } from '@/lib/sanitize';
import api from '@/lib/api';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Ingresa un email válido.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: cleanEmail });
    } catch {
      // Intencionalmente ignoramos el error del backend:
      // por seguridad SIEMPRE mostramos el mismo mensaje,
      // sin revelar si el email existe o no en el sistema.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-5 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-200">
          <CheckCircle2 size={32} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-xl font-extrabold text-[var(--text)]">Revisa tu correo</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Si existe una cuenta con <strong>{email}</strong>, recibirás un correo con
          instrucciones para restablecer tu contraseña en los próximos minutos.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          ¿No lo ves? Revisa la carpeta de spam.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:underline mt-2"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-5">
      {error && (
        <div className="bg-[var(--error-bg)] text-[var(--error)] text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-sm text-[var(--text-muted)] text-center">
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-bold mb-2">
          Email de tu cuenta
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            id="forgot-email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar instrucciones'}
      </button>

      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition font-medium"
      >
        <ArrowLeft size={16} />
        Volver al inicio de sesión
      </Link>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <Logo size={56} className="mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight">¿Olvidaste tu contraseña?</h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm text-center">
            Te ayudamos a recuperar el acceso a tu cuenta
          </p>
        </div>
        <Suspense
          fallback={
            <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] flex items-center justify-center h-40">
              <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
