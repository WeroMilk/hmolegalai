"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const OBJETIVOS = [
  { value: "pérdida de peso", label: "Pérdida de peso" },
  { value: "tonificación", label: "Tonificación" },
  { value: "energía", label: "Más energía" },
  { value: "piel/antienvejecimiento", label: "Piel / antienvejecimiento" },
  { value: "salud articular", label: "Salud articular" },
];

const HABITOS_ALIMENTACION = ["Regular", "Irregular", "Mucha comida rápida", "Cocino en casa", "Dietas restrictivas", "Otro"];
const HABITOS_EJERCICIO = ["Sedentario", "1-2 veces/semana", "3-4 veces/semana", "5+ veces/semana", "Otro"];
const HABITOS_SUENO = ["Menos de 6 h", "6-7 h", "7-8 h", "Más de 8 h", "Irregular"];
const HABITOS_ESTRES = ["Bajo", "Moderado", "Alto", "Muy alto"];

export default function ConsultaPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    objetivoPrincipal: "",
    condicionesMedicas: "",
    importanciaSuplementos: 5,
  });
  const [habitos, setHabitos] = useState({
    alimentacion: [] as string[],
    ejercicio: [] as string[],
    sueno: [] as string[],
    estres: [] as string[],
  });

  const toggleHabito = (key: keyof typeof habitos, value: string) => {
    setHabitos((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          edad: form.edad.trim() ? parseInt(form.edad, 10) : 0,
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          objetivoPrincipal: form.objetivoPrincipal || null,
          condicionesMedicas: form.condicionesMedicas.trim() || null,
          habitosAlimentacion: habitos.alimentacion,
          habitosEjercicio: habitos.ejercicio,
          habitosSueno: habitos.sueno,
          habitosEstres: habitos.estres,
          importanciaSuplementos: form.importanciaSuplementos,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error al enviar");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const whatsappMessage = encodeURIComponent(
    "Hola Nutrióloga, ya envié mi formulario de consulta. Quedo atenta a mi plan personalizado."
  );
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${whatsappMessage}` : "#";

  if (submitted) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 pt-28 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect p-8 rounded-xl border border-teal-500/40"
          >
            <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-4">
              ¡Gracias!
            </h1>
            <p className="text-muted mb-6">
              La nutrióloga recibió tu información. En menos de 24 horas hábiles te contactará por WhatsApp con tu plan personalizado.
            </p>
            {whatsappNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Contactar por WhatsApp
              </a>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-bold mb-2">Solicitar mi plan de alimentación</h1>
        <p className="text-muted text-sm mb-6">
          Completa el formulario. En menos de 24 h hábiles te contactaremos por WhatsApp con tu plan personalizado.
        </p>
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          className="glass-effect p-6 sm:p-8 rounded-xl border border-teal-500/40"
        >
          {/* Desktop: layout horizontal en dos columnas */}
          <div className="flex flex-col lg:flex-row lg:gap-10 lg:items-start">
            <div className="flex-1 space-y-5 min-w-0">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <Input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  className="max-w-md"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Edad *</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={120}
                    value={form.edad}
                    onChange={(e) => setForm((f) => ({ ...f, edad: e.target.value }))}
                    placeholder="Ej. 35"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono *</label>
                  <Input
                    required
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="Ej. (662) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="max-w-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Objetivo principal *</label>
                <select
                  required
                  value={form.objetivoPrincipal}
                  onChange={(e) => setForm((f) => ({ ...f, objetivoPrincipal: e.target.value }))}
                  className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona uno</option>
                  {OBJETIVOS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condiciones médicas (opcional)</label>
                <textarea
                  value={form.condicionesMedicas}
                  onChange={(e) => setForm((f) => ({ ...f, condicionesMedicas: e.target.value }))}
                  placeholder="Diabetes, alergias, medicación, etc."
                  className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  maxLength={5000}
                />
              </div>
            </div>
            <div className="flex-1 space-y-5 min-w-0 lg:mt-0 mt-6">
              <div>
                <label className="block text-sm font-medium mb-2">Hábitos (opcional)</label>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted block mb-1">Alimentación</span>
                    <div className="flex flex-wrap gap-2">
                      {HABITOS_ALIMENTACION.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabito("alimentacion", h)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            habitos.alimentacion.includes(h)
                              ? "border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300"
                              : "border-border text-muted hover:border-teal-500/50"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1">Ejercicio</span>
                    <div className="flex flex-wrap gap-2">
                      {HABITOS_EJERCICIO.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabito("ejercicio", h)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            habitos.ejercicio.includes(h)
                              ? "border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300"
                              : "border-border text-muted hover:border-teal-500/50"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1">Sueño</span>
                    <div className="flex flex-wrap gap-2">
                      {HABITOS_SUENO.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabito("sueno", h)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            habitos.sueno.includes(h)
                              ? "border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300"
                              : "border-border text-muted hover:border-teal-500/50"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1">Estrés</span>
                    <div className="flex flex-wrap gap-2">
                      {HABITOS_ESTRES.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabito("estres", h)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            habitos.estres.includes(h)
                              ? "border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300"
                              : "border-border text-muted hover:border-teal-500/50"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  ¿Qué tan importante es para ti usar suplementos de alta calidad? (1-10)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={form.importanciaSuplementos}
                    onChange={(e) => setForm((f) => ({ ...f, importanciaSuplementos: parseInt(e.target.value, 10) }))}
                    className="range-teal flex-1 min-w-[120px] max-w-xs"
                  />
                  <span className="font-medium w-8">{form.importanciaSuplementos}</span>
                </div>
              </div>
              <p className="text-xs text-muted">
                Si necesitas enviar fotos (analíticas, etc.), podrás hacerlo por WhatsApp después.
              </p>
            </div>
          </div>
          {error && (
            <div className="mt-5 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mt-6">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
