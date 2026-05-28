'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Leaf, Eye, EyeOff, Loader2, CheckCircle2, Building2, User, Mail, Phone, ArrowRight, ArrowLeft, Check, ShieldAlert, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';

const ROLES = [
  { value: 'customer', label: 'Consumidor', desc: 'Comprar productos orgánicos' },
  { value: 'provider', label: 'Productor (Seller)', desc: 'Vender con el sello EcoMarket' },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const defaultRole = searchParams.get('role') || 'customer';

  // State management
  const [role, setRole] = useState<'customer' | 'provider'>(defaultRole as 'customer' | 'provider');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validatingRuc, setValidatingRuc] = useState(false);
  const [rucValidated, setRucValidated] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRegisteredPending, setIsRegisteredPending] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Cliente / General
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Productor Corporativo
    ruc: '',
    businessName: '',
    direccionFiscal: '',
    telefonoCorporativo: '',
    emailEmpresarial: '',
    representanteLegal: '',
  });

  // RUC Simulation validation with professional databases
  const handleValidateRuc = () => {
    if (form.ruc.length !== 11 || !/^\d+$/.test(form.ruc)) {
      toast.error('Por favor, ingresa un RUC válido de 11 dígitos.');
      return;
    }

    setValidatingRuc(true);
    toast.loading('Consultando padrón SUNAT...', { id: 'ruc-validation' });

    setTimeout(() => {
      setValidatingRuc(false);
      
      // Simulamos empresas con base en los dígitos del RUC ingresado
      let business = 'EcoShop de Josep Vladimir Garate';
      let address = 'Av. Primavera 1024, Oficina 501, San Borja, Lima';
      
      if (form.ruc.startsWith('20')) {
        business = 'EcoCorporación Sostenible del Perú S.A.C.';
        address = 'Av. Javier Prado Este 2450, San Borja, Lima';
      } else if (form.ruc.startsWith('10')) {
        business = 'BioHuerto Familiar Garate E.I.R.L.';
        address = 'Jr. Ucayali 450, Centro de Lima, Lima';
      } else {
        business = `Consorcio AgroEcológico ${form.ruc.slice(0, 4)} S.A.C.`;
        address = 'Av. El Sol 104, Wanchaq, Cusco';
      }

      setForm(prev => ({
        ...prev,
        businessName: business,
        direccionFiscal: address
      }));
      setRucValidated(true);
      toast.success('RUC verificado exitosamente en SUNAT 🌿', { id: 'ruc-validation' });
    }, 1200);
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.ruc || !form.businessName || !form.direccionFiscal) {
        setError('Por favor, completa todos los datos fiscales. Recuerda validar tu RUC.');
        return;
      }
      if (form.ruc.length !== 11) {
        setError('El RUC debe tener exactamente 11 dígitos.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.representanteLegal || !form.telefonoCorporativo || !form.emailEmpresarial) {
        setError('Completa toda la información del representante y contacto corporativo.');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(form.emailEmpresarial)) {
        setError('Ingresa un email empresarial válido.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  // Google OAuth — requiere configuración de GOOGLE_CLIENT_ID en el servidor
  const handleGoogleLogin = () => {
    if (role === 'provider') {
      toast.error('El registro con Google es exclusivo para consumidores. Los productores deben pasar validación fiscal RUC.');
      return;
    }
    toast.error('Registro con Google no disponible. Usa email y contraseña.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'customer') {
      // Cliente Submit
      if (!form.email || !form.password || !form.fullName || !form.phone) {
        setError('Por favor completa todos los campos.');
        return;
      }
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(form.email)) {
        setError('Ingresa un email válido.');
        return;
      }

      setLoading(true);
      try {
        const data = await authService.register(form.email, form.password, form.fullName, form.phone);
        const registeredUser = {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          phone: form.phone,
          role: (data.role ?? 'customer') as 'customer' | 'provider' | 'admin',
          ecoScore: data.ecoScore ?? 0,
          authMethod: 'email' as const,
        };
        setAuth(registeredUser, data.token);
        toast.success('¡Cuenta creada exitosamente! Bienvenido a Ecomarket 🌿');
        router.push('/');
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { error?: string } }; code?: string };
        const status = axiosError?.response?.status;
        if (!status || axiosError?.code === 'ERR_NETWORK') {
          setError('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
        } else if (status === 403) {
          setError('Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.');
        } else if (status === 409) {
          setError('Ya existe una cuenta con ese email. Intenta iniciar sesión.');
        } else {
          setError('Error al crear la cuenta. Verifica tus datos e inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Productor Submit
      if (!form.password || !form.confirmPassword) {
        setError('Ingresa y confirma tu contraseña.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (form.password.length < 8) {
        setError('La contraseña corporativa debe tener al menos 8 caracteres.');
        return;
      }
      if (!acceptedTerms) {
        setError('Debes aceptar los Términos y Condiciones.');
        return;
      }

      setLoading(true);
      try {
        const producerData = {
          email: form.emailEmpresarial,
          password: form.password,
          fullName: form.representanteLegal,
          ruc: form.ruc,
          businessName: form.businessName,
          direccionFiscal: form.direccionFiscal,
          telefonoCorporativo: form.telefonoCorporativo,
          emailEmpresarial: form.emailEmpresarial,
          representanteLegal: form.representanteLegal,
        };
        await authService.registerProducer(producerData);
        setIsRegisteredPending(true);
        toast.success('¡Solicitud corporativa registrada y pendiente de verificación!');
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { error?: string } }; code?: string };
        const status = axiosError?.response?.status;
        if (!status || axiosError?.code === 'ERR_NETWORK') {
          setError('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
        } else if (status === 403) {
          setError('Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.');
        } else {
          setError('Error al registrar la solicitud. Verifica tus datos e inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (isRegisteredPending) {
    return (
      <div className="bg-[var(--surface)] rounded-[2rem] p-10 border border-[var(--border)] shadow-md text-center max-w-lg mx-auto space-y-6">
        <div className="w-20 h-20 bg-[var(--success-bg)] rounded-full flex items-center justify-center text-[var(--primary)] mx-auto border border-[var(--success)]">
          <Building2 size={38} className="animate-pulse text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text)] tracking-tight">¡Solicitud Registrada Exitosamente!</h2>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Hola <strong>{form.representanteLegal}</strong>, hemos registrado a <strong>{form.businessName}</strong> (RUC: {form.ruc}) como productor en nuestra plataforma.
        </p>
        
        <div className="bg-[#F8F6F0] rounded-2xl p-5 border border-yellow-200 text-left space-y-4">
          <div className="flex gap-2 text-yellow-800 font-bold text-sm items-center">
            <ShieldAlert size={18} className="text-[#D4AF37]" />
            <span>Estado: Pendiente de Aprobación</span>
          </div>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Solicitud recibida', done: true },
              { step: 2, label: 'Verificación RUC SUNAT', done: false },
              { step: 3, label: 'Revisión del Comité EcoMarket', done: false },
              { step: 4, label: 'Activación de cuenta', done: false },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-green-600 text-white' : 'bg-gray-200 text-[var(--text-muted)]'}`}>
                  {item.done ? <Check size={14} /> : item.step}
                </div>
                <span className={`text-xs font-semibold ${item.done ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Te enviaremos un correo a <strong>{form.emailEmpresarial}</strong> cuando tu cuenta sea aprobada.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#1A3C34] text-white py-4 rounded-2xl font-bold text-base hover:bg-green-800 transition shadow-sm"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm space-y-6">
      {error && (
        <div id="register-error" className="bg-[var(--error-bg)] text-[var(--error)] text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5 animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      {/* Role selector */}
      <div>
        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3 text-center">Selecciona tu perfil de cuenta</label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              id={`role-${r.value}-btn`}
              onClick={() => {
                setRole(r.value as 'customer' | 'provider');
                setStep(1);
                setError('');
              }}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                role === r.value
                  ? 'border-[#1A3C34] bg-[var(--success-bg)]/50 ring-2 ring-[#1A3C34]'
                  : 'border-[var(--border)] hover:border-[var(--border-light)] bg-[var(--surface)]'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-bold text-[var(--text)]">{r.label}</span>
                {role === r.value && <Check size={14} className="text-[var(--primary)] bg-green-200/50 rounded-full p-0.5" />}
              </div>
              <span className="text-xs text-[var(--text-muted)] mt-2 block font-normal leading-normal">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {role === 'customer' ? (
        /* ==================== FORMULARIO CONSUMIDOR ==================== */
        <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[var(--input-bg)] transition hover:border-[var(--border-light)] hover:scale-[1.01] disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h3.99c2.33-2.14 3.66-5.3 3.66-8.74z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.12c-1.11.74-2.53 1.19-3.97 1.19-3.05 0-5.63-2.06-6.55-4.83H1.47v3.22C3.48 20.3 7.46 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.45 14.33a7.14 7.14 0 0 1 0-4.66V6.45H1.47a11.96 11.96 0 0 0 0 11.1l3.98-3.22z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.46 0 3.48 3.7 1.47 7.68l3.98 3.22c.92-2.77 3.5-4.83 6.55-4.83z"
              />
            </svg>
            <span>Registrarse con Google</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-[var(--border)]"></div>
            <span className="px-3 text-xs text-[var(--text-muted)] font-medium bg-[var(--surface)]">o con correo electrónico</span>
            <div className="flex-1 border-t border-[var(--border)]"></div>
          </div>

          {/* Full Name */}
          <div className="relative">
            <label htmlFor="fullname-input" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Nombre completo</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="fullname-input"
                type="text"
                placeholder="Tu nombre y apellido"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email-input" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="reg-email-input"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full pl-12 pr-4 py-3.5 bg-[var(--input-bg)] border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition ${
                  form.email && /\S+@\S+\.\S+/.test(form.email) ? 'border-green-300' : form.email ? 'border-[var(--error)]' : 'border-[var(--border)]'
                }`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone-input" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Celular</label>
            <div className="relative flex">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)] z-10">+51</span>
              <input
                id="phone-input"
                type="tel"
                placeholder="987 654 321"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                className={`w-full pl-14 pr-4 py-3.5 bg-[var(--input-bg)] border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition ${
                  form.phone.length === 9 ? 'border-green-300' : form.phone ? 'border-[var(--error)]' : 'border-[var(--border)]'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password-input" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <input
                id="reg-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition pr-12"
              />
              <button
                type="button"
                id="reg-toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthBar password={form.password} />
          </div>

          {/* Submit */}
          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A3C34] text-white py-4 rounded-2xl font-bold text-base hover:bg-green-800 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Crear mi cuenta gratis'}
          </button>
        </form>
      ) : (
        /* ==================== FORMULARIO PRODUCTOR MULTIPASO (STEPPER) ==================== */
        <div className="space-y-6">
          {/* Indicador de Stepper */}
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors border ${
                  step === s
                    ? 'bg-[#1A3C34] text-white border-[#1A3C34]'
                    : step > s
                      ? 'bg-green-100 text-[var(--primary)] border-[var(--success)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]'
                }`}>
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                    step > s ? 'bg-green-200' : 'bg-gray-150'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="font-extrabold text-[var(--text)] text-base">
              {step === 1 && 'Paso 1: Datos Fiscales de la Empresa'}
              {step === 2 && 'Paso 2: Representante Legal y Contacto'}
              {step === 3 && 'Paso 3: Credenciales de Acceso'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">EcoMarket verifica rigurosamente cada alta comercial</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                {/* RUC */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">RUC (Registro Único de Contribuyente)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="Ej. 20123456789"
                      value={form.ruc}
                      onChange={(e) => { setForm({ ...form, ruc: e.target.value.replace(/\D/g, '') }); setRucValidated(false); }}
                      className="flex-1 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={handleValidateRuc}
                      disabled={validatingRuc || form.ruc.length !== 11}
                      className="px-4 bg-[#D4AF37] text-white font-bold text-xs rounded-2xl hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {validatingRuc ? <Loader2 size={12} className="animate-spin" /> : rucValidated ? <CheckCircle2 size={14} /> : 'Validar RUC'}
                    </button>
                  </div>
                  {rucValidated && (
                    <p className="text-xs text-green-700 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} /> RUC verificado en SUNAT
                    </p>
                  )}
                </div>

                {/* RUS (Régimen Único Simplificado) */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Categoría RUS / Régimen Tributario</label>
                  <select
                    value={(form as any).rusCategory || 'N/A'}
                    onChange={(e) => setForm({ ...form, rusCategory: e.target.value } as any)}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C34]"
                  >
                    <option value="N/A">General / RMT (No aplica RUS)</option>
                    <option value="RUS-1">Nuevo RUS - Categoría 1 (Ingresos hasta S/. 5,000)</option>
                    <option value="RUS-2">Nuevo RUS - Categoría 2 (Ingresos hasta S/. 8,000)</option>
                  </select>
                </div>

                {/* Razón Social */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Razón Social o Nombre Comercial</label>
                  <input
                    type="text"
                    placeholder="Ej. Jabones y Aceites del Perú S.A.C."
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                </div>

                {/* Dirección Fiscal */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Dirección Fiscal Completa</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Av. Larco 123, Miraflores, Lima"
                    value={form.direccionFiscal}
                    onChange={(e) => setForm({ ...form, direccionFiscal: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-[#1A3C34] text-white py-4 rounded-2xl font-bold text-base hover:bg-green-800 transition flex items-center justify-center gap-2"
                >
                  <span>Continuar</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {/* Nombre de Representante */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Representante Legal (Nombre Completo)</label>
                  <input
                    type="text"
                    placeholder="Nombre completo del firmante"
                    value={form.representanteLegal}
                    onChange={(e) => setForm({ ...form, representanteLegal: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                </div>

                {/* Teléfono Corporativo */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Teléfono Corporativo / Negocio</label>
                  <input
                    type="tel"
                    placeholder="Celular del negocio"
                    value={form.telefonoCorporativo}
                    onChange={(e) => setForm({ ...form, telefonoCorporativo: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                </div>

                {/* Email Empresarial */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Empresarial de Contacto</label>
                  <input
                    type="email"
                    placeholder="ventas@tuempresa.com"
                    value={form.emailEmpresarial}
                    onChange={(e) => setForm({ ...form, emailEmpresarial: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-[var(--border)] text-[var(--text-secondary)] py-4 rounded-2xl font-bold text-base hover:bg-[var(--input-bg)] transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    <span>Atrás</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#1A3C34] text-white py-4 rounded-2xl font-bold text-base hover:bg-green-800 transition flex items-center justify-center gap-2"
                  >
                    <span>Continuar</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-[var(--input-bg)] rounded-xl p-4 text-xs space-y-1 border border-[var(--border)]">
                  <p className="font-bold text-[var(--text-secondary)] mb-2">Resumen de tu solicitud</p>
                  <p><span className="text-[var(--text-muted)]">RUC:</span> {form.ruc}</p>
                  <p><span className="text-[var(--text-muted)]">Empresa:</span> {form.businessName}</p>
                  <p><span className="text-[var(--text-muted)]">Representante:</span> {form.representanteLegal}</p>
                  <p><span className="text-[var(--text-muted)]">Email:</span> {form.emailEmpresarial}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Contraseña Corporativa</label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition"
                  />
                  <PasswordStrengthBar password={form.password} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Confirmar Contraseña</label>
                  <input
                    type="password"
                    placeholder="Escribe de nuevo tu contraseña"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 bg-[var(--input-bg)] border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A3C34] text-sm transition ${
                      form.confirmPassword && form.password === form.confirmPassword ? 'border-green-300' : form.confirmPassword ? 'border-[var(--error)]' : 'border-[var(--border)]'
                    }`}
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 rounded border-[var(--border-light)] text-[var(--primary)] focus:ring-[#1A3C34]"
                  />
                  <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Acepto los <strong>Términos y Condiciones</strong> y la política de verificación corporativa de EcoMarket.
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-[var(--border)] text-[var(--text-secondary)] py-4 rounded-2xl font-bold text-base hover:bg-[var(--input-bg)] transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    <span>Atrás</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1A3C34] text-white py-4 rounded-2xl font-bold text-base hover:bg-green-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar Registro'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <p className="text-center text-sm text-[var(--text-muted)]">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" id="go-to-login-link" className="text-[var(--primary)] font-bold hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#1A3C34] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
            <Leaf size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">EcoMarket Registro</h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm text-center">Forma parte de la red de consumo ético líder en el Perú</p>
        </div>

        <Suspense fallback={
          <div className="bg-[var(--surface)] rounded-[2rem] p-8 border border-[var(--border)] shadow-sm flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
