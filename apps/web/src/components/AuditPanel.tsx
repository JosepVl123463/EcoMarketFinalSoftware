'use client';

import { useState, useEffect } from 'react';
import { Eye, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

const AUDIT_STEPS = [
  { label: 'Analizando ingredientes...', value: '[OK]', color: 'text-green-600', duration: 800 },
  { label: 'Verificando Certificación ISO 14001...', value: '[VALID]', color: 'text-green-600', duration: 1200 },
  { label: 'Calculando Huella de Carbono Logística...', value: '0.04kg CO₂', color: 'text-blue-600', duration: 1600 },
  { label: 'Validando cadena de suministro...', value: '[PASS]', color: 'text-green-600', duration: 2000 },
  { label: 'GENERANDO ECO-SCORE FINAL:', value: '9.7 / 10', color: 'text-[var(--success)] text-xl font-extrabold', duration: 2400 },
];

export function AuditPanel() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    AUDIT_STEPS.forEach((step, i) => {
      const t = setTimeout(() => setVisibleSteps(i + 1), step.duration);
      timers.push(t);
    });
    // Restart animation after completion
    const restart = setTimeout(() => {
      setVisibleSteps(0);
      setAnimating(false);
      setTimeout(() => {
        setAnimating(true);
        setVisibleSteps(0);
      }, 500);
    }, 4000);
    timers.push(restart);
    return () => timers.forEach(clearTimeout);
  }, [animating]);

  return (
    <section className="max-w-7xl mx-auto px-6 mb-24">
      <div className="bg-[var(--surface)] rounded-[3rem] p-8 md:p-16 border border-[var(--border)] flex flex-col lg:flex-row gap-16 items-center">
        {/* Left: Description */}
        <div className="lg:w-1/2">
          <h3 className="text-4xl font-bold mb-6 text-[var(--primary)]">Nuestra Auditoría Inteligente</h3>
          <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed">
            A diferencia de otros mercados, en Ecomarket cada producto pasa por un <strong>Pipeline de Validación Estadística</strong>. No solo miramos la etiqueta; auditamos la cadena de suministro completa.
          </p>
          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 bg-[var(--success-bg)] rounded-2xl flex items-center justify-center text-[var(--success)] flex-shrink-0">
                <Eye size={22} />
              </div>
              <div>
                <h5 className="font-bold text-[var(--text)]">Análisis Visión IA</h5>
                <p className="text-sm text-[var(--text-muted)]">Escaneo de etiquetas mediante Visión Artificial para detectar 12,000+ químicos nocivos.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 bg-[var(--info-bg)] rounded-2xl flex items-center justify-center text-[var(--info)] flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h5 className="font-bold text-[var(--text)]">Verificación Inmutable</h5>
                <p className="text-sm text-[var(--text-muted)]">Registro de certificados de origen en una base de datos de auditoría inmutable (QLDB).</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-700 flex-shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h5 className="font-bold text-[var(--text)]">Certificación Garantizada</h5>
                <p className="text-sm text-[var(--text-muted)]">Cada aprobación es firmada digitalmente por un auditor certificado ISO.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live terminal simulation */}
        <div className="lg:w-1/2 bg-[#F9FBF8] rounded-[2rem] p-8 border border-green-100 relative w-full">
          <div className="absolute -top-4 -left-4 bg-green-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">
            Simulación en Vivo
          </div>
          <div className="space-y-4 font-mono text-[12px] text-[var(--text-muted)] min-h-[160px]">
            {AUDIT_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex justify-between border-b border-[var(--border)] pb-3 transition-all duration-500 ${
                  i < visibleSteps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                <span className="flex items-center gap-2">
                  {i < visibleSteps - 1 ? (
                    <CheckCircle2 size={12} className="text-green-500" />
                  ) : i === visibleSteps - 1 && i < AUDIT_STEPS.length - 1 ? (
                    <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                  ) : null}
                  {`> ${step.label}`}
                </span>
                {i < visibleSteps && (
                  <span className={`font-bold ${step.color}`}>{step.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Auditor signature */}
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <div className="bg-[var(--surface)] p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-[var(--success)]">RS</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Firma del Auditor</p>
                <p className="text-sm font-bold text-[var(--text-secondary)]">Auditoría Aprobada por Dr. R. Silva</p>
                <p className="text-xs text-[var(--text-muted)]">ISO 14001 · ISO 9001 Certificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
