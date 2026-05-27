'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auditService } from '@/services';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Loader2,
  FileText, FlaskConical, ArrowRight, Leaf, Info, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditResult {
  eco_score: number;
  badges: string[];
  status: string;
  issues: string[];
  chemical_analysis: {
    findings: { ingredient: string; matched_as: string; risk: string; reason: string; regulation: string }[];
    risk_summary: { high: number; medium: number; low: number };
    total_penalty: number;
  };
  audit_hash: string;
}

export function ProducerAuditFlow() {
  const { user } = useAuthStore();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Cuidado Personal');
  const [description, setDescription] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const categories = ['Cuidado Personal', 'Alimentación', 'Limpieza Hogar', 'Hogar Eco'];
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = useCallback(async (file: File) => {
    setExtractingPdf(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      const lines = fullText
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && /[a-zA-Z]/.test(s))
        .slice(0, 50);
      if (lines.length >= 2) {
        setIngredientsText(lines.join('\n'));
        toast.success(`Extracto exitoso: ${lines.length} ingredientes detectados`);
      } else {
        toast.error('No se pudieron detectar ingredientes. Intenta ingresarlos manualmente.');
      }
    } catch {
      toast.error('Error al leer el PDF. Ingresa los ingredientes manualmente.');
    } finally {
      setExtractingPdf(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }
    setPdfFile(file);
    extractTextFromPdf(file);
  }, [extractTextFromPdf]);

  const handleAnalyze = useCallback(async () => {
    if (!productName.trim()) {
      toast.error('Ingresa el nombre del producto');
      return;
    }
    if (!ingredientsText.trim()) {
      toast.error('Ingresa al menos 2 ingredientes');
      return;
    }

    const ingredients = ingredientsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (ingredients.length < 2) {
      toast.error('Ingresa al menos 2 ingredientes');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const productId = `audit-${Date.now()}`;
      const data = await auditService.producerAnalyze({
        product_id: productId,
        product_name: productName.trim(),
        ingredients,
        category,
        description: description.trim(),
        provider_id: user?.id || 'unknown',
      });
      setResult(data);

      if (data.status === 'APPROVED') {
        toast.success(`Aprobado! Eco-Score: ${data.eco_score}/100`);
      } else {
        toast.error(`Rechazado - ${data.issues.length} incidencias encontradas`);
      }
    } catch {
      toast.error('Error al conectar con el servicio de auditoría. Usando simulación local.');
      simulateLocalAudit(ingredients);
    } finally {
      setLoading(false);
    }
  }, [productName, category, description, ingredientsText, user]);

  const simulateLocalAudit = (ingredients: string[]) => {
    const badIngredients = ['sulfato', 'parabeno', 'petrolato', 'silicona', 'bpa', 'ftalato', 'triclosan', 'formaldehido', 'microplastico', 'aluminio', 'sodium lauryl', 'sles', 'dimethicone', 'mineral oil'];
    const riskMap: Record<string, { risk: string; reason: string }> = {};
    badIngredients.forEach((bad) => {
      riskMap[bad] = { risk: 'high', reason: `Ingrediente restringido por normativa EcoMarket.` };
    });

    const findings: AuditResult['chemical_analysis']['findings'] = [];
    let penalty = 0;

    ingredients.forEach((ing) => {
      const matched = badIngredients.find((bad) => ing.toLowerCase().includes(bad));
      if (matched) {
        findings.push({
          ingredient: ing,
          matched_as: matched,
          risk: 'high',
          reason: riskMap[matched]?.reason || 'Componente no permitido',
          regulation: 'Estándar EcoMarket',
        });
        penalty += 25;
      }
    });

    const ecoScore = Math.max(0, 100 - penalty);
    const badges: string[] = [];
    if (ecoScore >= 90) badges.push('Eco-Friendly');
    if (ecoScore >= 80) { badges.push('Vegan'); badges.push('Cruelty Free'); }

    const resultData: AuditResult = {
      eco_score: ecoScore,
      badges,
      status: ecoScore >= 70 ? 'APPROVED' : 'REJECTED',
      issues: findings.map((f) => `${f.ingredient}: ${f.reason}`),
      chemical_analysis: {
        findings,
        risk_summary: { high: findings.length, medium: 0, low: ingredients.length - findings.length },
        total_penalty: penalty,
      },
      audit_hash: `sim-${Date.now().toString(16)}`,
    };
    setResult(resultData);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-[var(--text-inverse)]">
          <FlaskConical size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--text)]">Auditoría Química Automática</h2>
          <p className="text-sm text-[var(--text-muted)]">Valida ingredientes contra la base de datos EcoMarket</p>
        </div>
      </div>

      <div className="bg-[var(--success-bg)] border border-[var(--success)] rounded-2xl p-4 flex gap-3 text-xs text-[var(--success)]">
        <Info size={18} className="shrink-0" />
        <div>
          <p className="font-bold mb-1">Base de datos química: {Object.keys({
            sulfatos: 1, parabenos: 1, ftalatos: 1, bpa: 1, petrolatos: 1,
            siliconas: 1, triclosan: 1, formaldehido: 1, microplasticos: 1,
            colorantes_azoicos: 1, aluminio: 1
          }).length} categorías de riesgo analizadas</p>
          <p>Ingresa los ingredientes de tu producto para recibir una pre-auditoría automática antes del envío oficial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Nombre del producto</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Shampoo Sólido de Verbena"
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Descripción breve</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu producto..."
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
              Ficha Técnica (PDF) <span className="text-[var(--text-muted)] font-normal">— sube el PDF para extraer ingredientes automáticamente</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 bg-[var(--input-bg)] border-2 border-dashed border-[var(--border)] rounded-xl text-center cursor-pointer hover:border-[var(--primary)] transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {extractingPdf ? (
                <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-bold">Extrayendo ingredientes...</span>
                </div>
              ) : pdfFile ? (
                <div className="flex items-center justify-center gap-2 text-[var(--primary)]">
                  <FileText size={20} />
                  <span className="text-sm font-bold">{pdfFile.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <Upload size={24} />
                  <span className="text-sm font-bold">Haz clic para subir la ficha técnica</span>
                  <span className="text-xs">PDF con la lista de ingredientes de tu producto</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
              Lista de ingredientes <span className="text-[var(--text-muted)] font-normal">(uno por línea)</span>
            </label>
            <textarea
              rows={6}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder={`Sodium Cocoyl Isethionate\nVerbena Officinalis Extract\nCocos Nucifera Oil\nParfum Natural\nAgua`}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {pdfFile && ingredientsText && (
              <p className="text-xs text-[var(--success)] mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> {ingredientsText.split('\n').filter(Boolean).length} ingredientes extraídos del PDF
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-[var(--primary)] text-[var(--text-inverse)] py-4 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Analizando ingredientes...</>
            ) : (
              <><FlaskConical size={18} /> Ejecutar Auditoría Química</>
            )}
          </button>
        </div>

        <div className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-6 shadow-sm min-h-[400px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
              <FileText size={48} className="mb-4 opacity-30" />
              <p className="font-bold text-sm">Los resultados aparecerán aquí</p>
              <p className="text-xs mt-1">Ingresa los ingredientes y ejecuta la auditoría</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className={`rounded-2xl p-4 border ${
                result.status === 'APPROVED'
                  ? 'bg-[var(--success-bg)] border-[var(--success)]'
                  : 'bg-[var(--error-bg)] border-[var(--error)]'
              }`}>
                <div className="flex items-center gap-3">
                  {result.status === 'APPROVED' ? (
                    <CheckCircle2 size={32} className="text-[var(--success)]" />
                  ) : (
                    <XCircle size={32} className="text-[var(--error)]" />
                  )}
                  <div>
                    <p className={`font-black text-lg ${
                      result.status === 'APPROVED' ? 'text-[var(--success)]' : 'text-[var(--error)]'
                    }`}>
                      {result.status === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">Eco-Score: {result.eco_score}/100</p>
                  </div>
                </div>
              </div>

              {result.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.badges.map((badge) => (
                    <span key={badge} className="bg-[var(--success-bg)] text-[var(--success)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--success)]">
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {result.chemical_analysis.findings.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[var(--error)] mb-2 flex items-center gap-1">
                    <AlertTriangle size={14} /> Incidencias encontradas ({result.chemical_analysis.findings.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.chemical_analysis.findings.map((f, i) => (
                      <div key={i} className="bg-[var(--error-bg)] rounded-xl p-3 border border-[var(--error)]">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-[var(--text)]">{f.ingredient}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{f.reason}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">{f.regulation}</p>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--error)] bg-[var(--error-bg)] px-2 py-0.5 rounded border border-[var(--error)]">
                            {f.risk.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[var(--input-bg)] rounded-xl p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[var(--error)] font-black text-lg">{result.chemical_analysis.risk_summary.high}</p>
                    <p className="text-[var(--text-muted)]">Alto riesgo</p>
                  </div>
                  <div>
                    <p className="text-yellow-600 font-black text-lg">{result.chemical_analysis.risk_summary.medium}</p>
                    <p className="text-[var(--text-muted)]">Medio riesgo</p>
                  </div>
                  <div>
                    <p className="text-[var(--success)] font-black text-lg">{result.chemical_analysis.risk_summary.low}</p>
                    <p className="text-[var(--text-muted)]">Bajo riesgo</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[var(--text-muted)] font-mono break-all bg-[var(--input-bg)] rounded-xl p-3">
                Hash: {result.audit_hash}
              </div>

              {result.status === 'APPROVED' ? (
                <div className="flex items-center gap-2 text-sm text-[var(--success)] font-bold">
                  <Leaf size={16} /> Producto apto para certificación oficial
                </div>
              ) : (
                <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-xl p-3">
                  <p className="text-sm font-bold text-[var(--error)] mb-1">Mejoras Requeridas:</p>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
                    {result.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                    <li className="font-bold text-[var(--error)]">Corrige los ingredientes señalados y vuelve a auditar</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
