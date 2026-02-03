"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { DidiSelect } from "@/components/ui/didi-select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { isDidiUser } from "@/lib/didi";
import { toTitleCase, formatPesoDisplay, parsePesoForApi } from "@/lib/formatters";
import { generateDidiPdf } from "@/lib/didi-pdf";
import { Leaf, Loader2, FileText, Download, ArrowLeft, Copy, Edit3, Check, MessageSquare } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Normaliza el markdown del plan para que la vista previa sea legible y fácil de editar (saltos de línea) */
function normalizePlanMarkdownForPreview(raw: string): string {
  if (!raw?.trim()) return raw;
  let s = raw.trim();
  // Separa # PLAN NUTRICIONAL de lo que sigue
  s = s.replace(/#\s*PLAN NUTRICIONAL\s+/gi, "# PLAN NUTRICIONAL\n\n");
  // Separa ## (títulos) cuando van pegados al texto anterior
  s = s.replace(/(\S)\s+(##\s+)/g, "$1\n\n$2");
  s = s.replace(/\s+(##\s+)/g, "\n\n$1");
  // "Datos del Paciente" como subencabezado
  s = s.replace(/(\S)\s*Datos del Paciente\s*/gi, "$1\n\n## Datos del Paciente\n\n");
  s = s.replace(/^Datos del Paciente\s*/im, "## Datos del Paciente\n\n");
  // Separa cada ítem de comida: - **Desayuno:**, - **Comida:**, etc.
  s = s.replace(/\s+(-\s+\*\*)/g, "\n\n$1");
  // Después de **Desayuno:**, **Comida:**, etc. salto de línea para que la descripción vaya abajo
  s = s.replace(/\*\*(Desayuno|Comida|Cena|Colación|Total del d[ií]a):\*\*\s+/gi, "**$1:**\n\n");
  // Separa RECOMENDACIONES GENERALES
  s = s.replace(/(\S)\s+(##\s*RECOMENDACIONES GENERALES)/i, "$1\n\n$2");
  s = s.replace(/(\S)\s+(RECOMENDACIONES GENERALES)/i, "$1\n\n## $2");
  // Cada "Label: valor" en Datos del Paciente en su propia línea (Nombre:, Peso:, Estatura:, etc.)
  s = s.replace(/\s+(Nombre|Peso|Estatura|Edad|Sexo|Calorías objetivo|Tipo de dieta|Fecha del plan|Consideraciones):\s+/gi, "\n\n$1: ");
  // Límite de líneas en blanco consecutivas
  s = s.replace(/\n{4,}/g, "\n\n\n");
  return s.trim();
}

const SEXO_OPTIONS = ["Hombre", "Mujer", "Otro"];
const ACTIVIDAD_OPTIONS = [
  "Sedentario (poco o ningún ejercicio)",
  "Ligera (1-3 días/semana)",
  "Moderada (3-5 días/semana)",
  "Intensa (6-7 días/semana)",
  "Muy intensa (atleta)",
];
const TIPO_DIETA_OPTIONS = [
  "Normal / Equilibrada",
  "Baja en calorías",
  "Alta en proteínas",
  "Baja en carbohidratos",
  "Sin restricciones (mantenimiento)",
];
const OBJETIVO_OPTIONS = [
  "Mantener peso",
  "Bajar de peso",
  "Subir de peso",
];
const PROMPT_FORMATEAR_TABLA = `Convierte el siguiente plan nutricional en un formato profesional, limpio y súper legible, listo para compartir con pacientes en PDF o Word.

REQUISITOS OBLIGATORIOS:
- Formato vertical (carta).
- Diseño claro, ordenado y fácil de leer (nada encimado).
- Texto con saltos de línea dentro de cada celda.
- Tipografía profesional estilo consultorio.

ENCABEZADO:
- Título centrado: "PLAN NUTRICIONAL"
- Subtítulo: "L.N.H. DIANA GALLARDO"

SECCIÓN: DATOS DEL PACIENTE
Mostrar en formato ordenado:
- Nombre
- Peso
- Estatura
- Edad
- Sexo
- Calorías objetivo
- Tipo de dieta
- Consideraciones (si existen)
- Fecha del plan (si se incluye)

TABLA PRINCIPAL:
Columnas obligatorias:
Día | Desayuno | Comida | Cena | Colación | Aprox. de calorías

INSTRUCCIONES PARA LA TABLA:
- Una fila por día (Lunes a Domingo).
- En cada celda usar este formato exacto:
  [Platillo].
  (cantidades y detalle)
  Acompañamientos
- Usar saltos de línea dentro de cada comida.
- Mantener coherencia visual y suficiente espacio entre filas.
- No resumir ni quitar información del plan original.

SECCIÓN FINAL:
Título: "Recomendaciones Generales"
- Mostrar en viñetas claras y profesionales.

FORMATO DE SALIDA:
- Priorizar PDF vertical perfectamente acomodado.
- Si no es posible, entregar en Markdown o HTML con tabla bien estructurada.
- El resultado debe verse profesional incluso en celular.

IMPORTANTE:
- No cambiar alimentos, cantidades ni calorías.
- Mantener el texto tal cual, solo reorganizarlo visualmente.
- Pensar como documento clínico profesional.

PLAN A CONVERTIR:

`;

const CONDICIONES_OPTIONS = [
  "Diabetes",
  "Colesterol alto",
  "Hipertensión",
  "Triglicéridos altos",
  "Gastritis o reflujo",
  "Ácido úrico elevado (gota)",
  "Hipertiroidismo",
  "Hipotiroidismo",
];

export default function DidiPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    nombreLnh: "L.N.H. Diana Gallardo",
    nombrePaciente: "",
    peso: "",
    estatura: "",
    edad: "",
    sexo: "",
    actividadFisica: "",
    objetivo: "",
    tipoDieta: "",
  });
  const [condiciones, setCondiciones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planContent, setPlanContent] = useState("");
  const [originalPlanContent, setOriginalPlanContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [promptEditText, setPromptEditText] = useState("");
  const [loadingPromptEdit, setLoadingPromptEdit] = useState(false);
  const [promptEditError, setPromptEditError] = useState("");

  const handleCopyPrompt = () => {
    const fullPrompt = PROMPT_FORMATEAR_TABLA + planContent;
    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth?returnTo=/didi");
      return;
    }
    if (!isDidiUser(user.email)) {
      router.replace("/documentos");
      return;
    }
  }, [user, authLoading, router]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleCondicionToggle = (condicion: string) => {
    setCondiciones((prev) =>
      prev.includes(condicion) ? prev.filter((c) => c !== condicion) : [...prev, condicion]
    );
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    setPlanContent("");
    const payload = { ...form, peso: parsePesoForApi(form.peso), condiciones, nombreLnh: form.nombreLnh || "L.N.H. Diana Gallardo" };
    const doRequest = async (forceRefreshToken: boolean): Promise<void> => {
      const token = await user!.getIdToken(forceRefreshToken);
      const res = await fetch("/api/didi-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar el plan");
      const content = data.content ?? "";
      setPlanContent(content);
      setOriginalPlanContent(content);
      setIsEditing(false);
    };
    try {
      await doRequest(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isSessionError = /Sesión inválida|iniciar sesión/i.test(msg);
      if (isSessionError) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          await doRequest(true);
          return;
        } catch {
          // No mostrar "Sesión inválida": redirigir a login para volver a entrar
          setTimeout(() => router.replace("/auth?returnTo=/didi"), 1500);
          return;
        }
      } else {
        setError(msg || "Error al generar el plan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!planContent) return;
    const blob = new Blob([planContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan-Nutricional-${form.nombrePaciente || "Paciente"}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!planContent) return;
    generateDidiPdf(planContent, form.nombrePaciente || "Paciente", form.nombreLnh || "L.N.H. Diana Gallardo");
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleApplyPromptEdit = async () => {
    const prompt = promptEditText.trim();
    if (!prompt || !planContent || !user) return;
    setLoadingPromptEdit(true);
    setPromptEditError("");
    const doRequest = async (forceRefreshToken: boolean): Promise<void> => {
      const token = await user.getIdToken(forceRefreshToken);
      const res = await fetch("/api/didi-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: planContent, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al editar con el prompt");
      setPlanContent(data.content);
      setShowPromptEdit(false);
      setPromptEditText("");
    };
    try {
      await doRequest(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isSessionError = /Sesión inválida|iniciar sesión/i.test(msg);
      if (isSessionError) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          await doRequest(true);
          return;
        } catch {
          setTimeout(() => router.replace("/auth?returnTo=/didi"), 1500);
          return;
        }
      }
      setPromptEditError(msg || "Error al editar el plan");
    } finally {
      setLoadingPromptEdit(false);
    }
  };

  const isDidi = user ? isDidiUser(user.email) : false;
  const showSpinner = authLoading || !user || !isDidi;
  if (showSpinner && !planContent) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main id="main" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        <Link
          href="/documentos"
          className="inline-flex items-center text-purple-500 hover:text-purple-400 mb-0 py-2 -my-2 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
          Volver
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-500/20 border-2 border-purple-500/50 mb-6">
            <Leaf className="w-10 h-10 text-purple-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text hover-title mb-2 mt-2 ml-4 sm:ml-6">
            DIDI · Plan Nutricional
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
            {form.nombreLnh || "L.N.H. Diana Gallardo"}
          </p>
        </motion.div>

        {!planContent ? (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="didi-form-section glass-effect hover-box p-6 sm:p-8 rounded-2xl border border-purple-500/40 space-y-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Datos del paciente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label htmlFor="didi-nombreLnh" className="block text-sm font-medium text-foreground mb-2">
                  Nombre del nutriólogo (LNH)
                </label>
                <Input
                  id="didi-nombreLnh"
                  name="nombreLnh"
                  value={form.nombreLnh}
                  onChange={(e) => handleChange("nombreLnh", e.target.value)}
                  placeholder="L.N.H. Diana Gallardo"
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
                <p className="text-xs text-muted mt-1">Aparece en el plan y en el PDF. Por defecto: L.N.H. Diana Gallardo.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="didi-nombrePaciente" className="block text-sm font-medium text-foreground mb-2">
                  Nombre del paciente *
                </label>
                <Input
                  id="didi-nombrePaciente"
                  name="nombrePaciente"
                  value={form.nombrePaciente}
                  onChange={(e) => handleChange("nombrePaciente", e.target.value)}
                  onBlur={() => {
                    const t = toTitleCase(form.nombrePaciente);
                    if (t !== form.nombrePaciente) handleChange("nombrePaciente", t);
                  }}
                  placeholder="Ej. María García López"
                  required
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label htmlFor="didi-peso" className="block text-sm font-medium text-foreground mb-2">
                  Peso (kg) *
                </label>
                <p className="text-xs text-muted mb-1">Formato: 57 → 57.000, 55500 → 55.500. Máx: 150 kg.</p>
                <Input
                  id="didi-peso"
                  name="peso"
                  type="text"
                  inputMode="decimal"
                  value={form.peso}
                  onChange={(e) => handleChange("peso", e.target.value)}
                  onBlur={() => {
                    const f = formatPesoDisplay(form.peso);
                    if (f && f !== form.peso) handleChange("peso", f);
                  }}
                  placeholder="Ej. 57 o 55500 (se convierte a 57.000 o 55.500)"
                  required
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label htmlFor="didi-estatura" className="block text-sm font-medium text-foreground mb-2">
                  Estatura (m) *
                </label>
                <p className="text-xs text-muted mb-1">En metros (1.45) o en cm (155 → se convierte a 1.55 m)</p>
                <Input
                  id="didi-estatura"
                  name="estatura"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.5"
                  max="250"
                  value={form.estatura}
                  onChange={(e) => handleChange("estatura", e.target.value)}
                  onBlur={() => {
                    const v = form.estatura.replace(",", ".").trim();
                    const num = parseFloat(v);
                    if (!Number.isNaN(num) && num >= 10 && num <= 250) {
                      const metros = (num / 100).toFixed(2);
                      if (metros !== form.estatura) handleChange("estatura", metros);
                    }
                  }}
                  placeholder="Ej. 1.45 o 155"
                  required
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label htmlFor="didi-edad" className="block text-sm font-medium text-foreground mb-2">
                  Edad (años) *
                </label>
                <p className="text-xs text-muted mb-1">1-120 años. El plan se adapta a bebés, niños, adolescentes, adultos y adultos mayores.</p>
                <Input
                  id="didi-edad"
                  name="edad"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={form.edad}
                  onChange={(e) => handleChange("edad", e.target.value)}
                  placeholder="Ej. 32"
                  required
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label htmlFor="didi-sexo" className="block text-sm font-medium text-foreground mb-2">
                  Sexo *
                </label>
                <DidiSelect
                  id="didi-sexo"
                  aria-label="Sexo"
                  value={form.sexo}
                  onChange={(v) => handleChange("sexo", v)}
                  options={SEXO_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="Selecciona"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="didi-actividadFisica" className="block text-sm font-medium text-foreground mb-2">
                  Actividad física *
                </label>
                <DidiSelect
                  id="didi-actividadFisica"
                  aria-label="Actividad física"
                  value={form.actividadFisica}
                  onChange={(v) => handleChange("actividadFisica", v)}
                  options={ACTIVIDAD_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="Selecciona"
                  required
                />
              </div>
              <div>
                <label htmlFor="didi-objetivo" className="block text-sm font-medium text-foreground mb-2">
                  Objetivo del plan *
                </label>
                <p className="text-xs text-muted mb-1">La IA calcula calorías según los datos. Se ajustan por etapa de vida (niños, adolescentes, adultos, mayores).</p>
                <DidiSelect
                  id="didi-objetivo"
                  aria-label="Objetivo del plan"
                  value={form.objetivo}
                  onChange={(v) => handleChange("objetivo", v)}
                  options={OBJETIVO_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="Selecciona"
                  required
                />
              </div>
              <div>
                <label htmlFor="didi-tipoDieta" className="block text-sm font-medium text-foreground mb-2">
                  Tipo de dieta *
                </label>
                <DidiSelect
                  id="didi-tipoDieta"
                  aria-label="Tipo de dieta"
                  value={form.tipoDieta}
                  onChange={(v) => handleChange("tipoDieta", v)}
                  options={TIPO_DIETA_OPTIONS.map((o) => ({ value: o, label: o }))}
                  placeholder="Selecciona"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Enfermedades o condiciones (opcional)
              </label>
              <p className="text-xs text-muted mb-3">Marca las que apliquen para adaptar la dieta (puedes marcar varias).</p>
              <div className="flex flex-wrap gap-3">
                {CONDICIONES_OPTIONS.map((cond) => (
                  <label
                    key={cond}
                    htmlFor={`didi-condicion-${cond.replace(/\s+/g, "-")}`}
                    className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:border-purple-500/40 transition-colors"
                  >
                    <input
                      id={`didi-condicion-${cond.replace(/\s+/g, "-")}`}
                      name="condiciones"
                      type="checkbox"
                      value={cond}
                      checked={condiciones.includes(cond)}
                      onChange={() => handleCondicionToggle(cond)}
                      className="rounded border-border text-purple-500 accent-purple-500 focus:ring-purple-500/30"
                    />
                    <span className="text-sm text-foreground">{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[200px] py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl hover-button"
              >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                  Generando plan...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2 inline" />
                  Generar plan nutricional semanal
                </>
              )}
            </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="didi-preview-section glass-effect hover-box p-6 sm:p-8 rounded-2xl border border-purple-500/40">
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <FileText className="w-5 h-5 text-purple-500 shrink-0" />
                  Plan listo para enviar al paciente
                </h2>
                <div className="flex flex-wrap gap-3 justify-center w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPlanContent("");
                      setOriginalPlanContent("");
                    }}
                    className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                  >
                    Nuevo plan
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
                  className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10 flex items-center gap-2 min-w-[11rem]"
                >
                  {isEditing ? (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar cambios
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-muted text-xs sm:text-sm max-w-xl mx-auto mb-4">
                Puedes editar el plan las veces que necesites antes de descargar el PDF. El PDF se genera en hoja tamaño oficio horizontal (apaisada), con tabla organizada y colores rosa y morado pastel.
              </p>

              <div
                className="didi-preview-pdf-style rounded-xl border border-gray-300 p-6 sm:p-8 shadow-lg"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#1a1a1a",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                {isEditing ? (
                  <textarea
                    id="didi-plan-edit"
                    name="planContent"
                    value={planContent}
                    onChange={(e) => setPlanContent(e.target.value)}
                    className="w-full min-h-[360px] font-mono text-sm leading-loose whitespace-pre-wrap resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg p-4 border border-gray-300"
                    style={{ backgroundColor: "#fafafa", color: "#1a1a1a" }}
                    placeholder="Plan nutricional... (puedes editar títulos ##, listas - **Desayuno:**, etc.)"
                    spellCheck
                    aria-label="Contenido del plan nutricional para editar"
                  />
                ) : (
                  <div
                    className="didi-plan-content w-full min-w-0 prose prose-sm max-w-none"
                    style={{ backgroundColor: "transparent", color: "#1a1a1a" }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizePlanMarkdownForPreview(planContent)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowPromptEdit(true);
                    setPromptEditError("");
                    setPromptEditText("");
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Edita con PROMPT
                </Button>
              </div>
            </div>

            {/* Modal Edita con PROMPT: portal en body para que el blur cubra toda la pantalla (incl. header) */}
            {showPromptEdit &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  onClick={() => !loadingPromptEdit && setShowPromptEdit(false)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="prompt-edit-title"
                >
                  <div
                    className="bg-card border border-purple-500/40 rounded-2xl shadow-xl max-w-lg w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 id="prompt-edit-title" className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                      Edita con PROMPT
                    </h3>
                    <p className="text-sm text-muted mb-3">
                      Escribe una instrucción para modificar el plan. Por ejemplo: &quot;A mi paciente no le gusta el huevo&quot;, &quot;Cambia el pollo por pescado&quot;, &quot;Corrige la edad a 35 años&quot;.
                    </p>
                    <textarea
                      value={promptEditText}
                      onChange={(e) => {
                        setPromptEditText(e.target.value);
                        setPromptEditError("");
                      }}
                      placeholder="Ej: A mi paciente no le gusta el huevo, sustituye por otra proteína..."
                      className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                      disabled={loadingPromptEdit}
                      aria-label="Instrucción para editar el plan"
                    />
                    {promptEditError && (
                      <p className="mt-2 text-sm text-red-400">{promptEditError}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Button
                        type="button"
                        onClick={handleApplyPromptEdit}
                        disabled={loadingPromptEdit || !promptEditText.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {loadingPromptEdit ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Aplicando...
                          </>
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => !loadingPromptEdit && setShowPromptEdit(false)}
                        disabled={loadingPromptEdit}
                        className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
