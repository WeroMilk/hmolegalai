"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { isDidiUser } from "@/lib/didi";
import { toTitleCase, formatPesoDisplay, parsePesoForApi } from "@/lib/formatters";
import { Leaf, Loader2, FileText, Download, ArrowLeft, ImageDown } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";

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
  const planExportRef = useRef<HTMLDivElement>(null);

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
    const payload = { ...form, peso: parsePesoForApi(form.peso), condiciones };
    const doRequest = async (): Promise<void> => {
      const token = await user!.getIdToken(true);
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
      setPlanContent(data.content ?? "");
    };
    try {
      await doRequest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Sesión inválida") || msg.includes("iniciar sesión")) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          await doRequest();
          return;
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : "Error al generar el plan");
        }
      } else {
        setError(msg || "Error al generar el plan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
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

  const handleDownloadImage = async () => {
    if (!planContent || !planExportRef.current) return;
    try {
      const canvas = await html2canvas(planExportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Plan-Nutricional-${form.nombrePaciente || "Paciente"}-${new Date().toISOString().slice(0, 10)}.jpg`;
      a.click();
    } catch (err) {
      console.error("Error al generar imagen:", err);
      setError("No se pudo generar la imagen.");
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
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
            LNH. Diana Gallardo
          </p>
        </motion.div>

        {!planContent ? (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="glass-effect hover-box p-6 sm:p-8 rounded-2xl border border-purple-500/40 space-y-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Datos del paciente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del paciente *
                </label>
                <Input
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Peso (kg) *
                </label>
                <p className="text-xs text-muted mb-1">Formato: 55.500 kg. 55500 → 55.500, 101500 → 101.500. Máx: 150 kg.</p>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.peso}
                  onChange={(e) => handleChange("peso", e.target.value)}
                  onBlur={() => {
                    const f = formatPesoDisplay(form.peso);
                    if (f && f !== form.peso) handleChange("peso", f);
                  }}
                  placeholder="Ej. 55.500 o 55500 (se convierte a 55.500)"
                  required
                  className="focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estatura (m) *
                </label>
                <p className="text-xs text-muted mb-1">En metros (1.45) o en cm (155 → se convierte a 1.55 m)</p>
                <Input
                  type="number"
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Edad (años) *
                </label>
                <Input
                  type="number"
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sexo *
                </label>
                <select
                  value={form.sexo}
                  onChange={(e) => handleChange("sexo", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card dark:bg-transparent border border-border rounded-lg text-foreground dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 didi-select"
                >
                  <option value="">Selecciona</option>
                  {SEXO_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Actividad física *
                </label>
                <select
                  value={form.actividadFisica}
                  onChange={(e) => handleChange("actividadFisica", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card dark:bg-transparent border border-border rounded-lg text-foreground dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 didi-select"
                >
                  <option value="">Selecciona</option>
                  {ACTIVIDAD_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Objetivo del plan *
                </label>
                <p className="text-xs text-muted mb-1">La IA calculará las calorías según peso, estatura, edad, sexo y actividad.</p>
                <select
                  value={form.objetivo}
                  onChange={(e) => handleChange("objetivo", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card dark:bg-transparent border border-border rounded-lg text-foreground dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 didi-select"
                >
                  <option value="">Selecciona</option>
                  {OBJETIVO_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de dieta *
                </label>
                <select
                  value={form.tipoDieta}
                  onChange={(e) => handleChange("tipoDieta", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card dark:bg-transparent border border-border rounded-lg text-foreground dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 didi-select"
                >
                  <option value="">Selecciona</option>
                  {TIPO_DIETA_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
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
                    className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:border-purple-500/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={condiciones.includes(cond)}
                      onChange={() => handleCondicionToggle(cond)}
                      className="rounded border-border text-purple-500 focus:ring-purple-500/30"
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
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-effect hover-box p-6 sm:p-8 rounded-2xl border border-purple-500/40">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Plan listo para enviar al cliente
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPlanContent("")}
                    className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                  >
                    Nuevo plan
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownload}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar TXT
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownloadImage}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <ImageDown className="w-4 h-4 mr-2" />
                    Descargar JPG
                  </Button>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900/80 rounded-xl border border-border p-6 sm:p-8 text-foreground overflow-hidden">
                <div className="didi-plan-content overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{planContent}</ReactMarkdown>
                </div>
              </div>

              {/* Div para exportar a JPG - diseño profesional */}
              <div
                ref={planExportRef}
                className="absolute left-[-9999px] top-0 w-[800px] bg-white p-10 font-sans text-[#1a1a1a] didi-plan-content"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{planContent}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
