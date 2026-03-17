"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { motion } from "framer-motion";

const OBJETIVOS = [
  { value: "pérdida de peso", label: "Pérdida de peso" },
  { value: "tonificación", label: "Tonificación" },
  { value: "energía", label: "Más energía" },
  { value: "piel/antienvejecimiento", label: "Piel / antienvejecimiento" },
  { value: "salud articular", label: "Salud articular" },
];

const META_PESO = [
  { value: "bajar", label: "Bajar de peso" },
  { value: "mantener", label: "Mantener peso" },
  { value: "subir", label: "Subir de peso" },
];

const TIPO_DIETA = [
  { value: "normal", label: "Normal / equilibrada" },
  { value: "alta-proteina", label: "Alta en proteína" },
  { value: "baja-carbohidratos", label: "Baja en carbohidratos" },
  { value: "baja-calorias", label: "Baja en calorías" },
  { value: "sin-restricciones", label: "Sin restricciones (mantenimiento)" },
];

const HABITOS_ALIMENTACION = ["Regular", "Irregular", "Mucha comida rápida", "Cocino en casa", "Dietas restrictivas", "Otro"];
const HABITOS_EJERCICIO = ["Sedentario", "1-2 veces/semana", "3-4 veces/semana", "5+ veces/semana", "Otro"];
const HABITOS_SUENO = ["Menos de 6 h", "6-7 h", "7-8 h", "Más de 8 h", "Irregular"];
const HABITOS_ESTRES = ["Bajo", "Moderado", "Alto", "Muy alto"];

export default function ConsultaPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    objetivoPrincipal: "",
    metaPeso: "",
    tipoDieta: "",
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
      const consultaPayload = {
        nombre: form.nombre.trim(),
        edad: form.edad.trim() ? parseInt(form.edad, 10) : 0,
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        objetivoPrincipal: form.objetivoPrincipal || null,
        metaPeso: form.metaPeso || null,
        tipoDieta: form.tipoDieta || null,
        condicionesMedicas: form.condicionesMedicas.trim() || null,
        habitosAlimentacion: habitos.alimentacion,
        habitosEjercicio: habitos.ejercicio,
        habitosSueno: habitos.sueno,
        habitosEstres: habitos.estres,
        importanciaSuplementos: form.importanciaSuplementos,
      };
      const resConsulta = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaPayload),
      });
      const dataConsulta = await resConsulta.json().catch(() => ({}));
      if (!resConsulta.ok) throw new Error(dataConsulta?.error || "Error al guardar la solicitud");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const resCheckout = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "plan-dieta-personalizado", quantity: 1 }],
          successUrl: `${origin}/consulta/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/consulta`,
        }),
      });
      const dataCheckout = await resCheckout.json().catch(() => ({}));
      if (!resCheckout.ok) throw new Error(dataCheckout?.error || "Error al crear el pago");
      if (dataCheckout?.url) {
        window.location.href = dataCheckout.url;
        return;
      }
      throw new Error("No se recibió URL de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim() || !form.email.trim()) {
      setError("Completa nombre, teléfono y email para continuar.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const consultaPayload = {
        nombre: form.nombre.trim(),
        edad: form.edad.trim() ? parseInt(form.edad, 10) : 0,
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        objetivoPrincipal: form.objetivoPrincipal || null,
        metaPeso: form.metaPeso || null,
        tipoDieta: form.tipoDieta || null,
        condicionesMedicas: form.condicionesMedicas.trim() || null,
        habitosAlimentacion: habitos.alimentacion,
        habitosEjercicio: habitos.ejercicio,
        habitosSueno: habitos.sueno,
        habitosEstres: habitos.estres,
        importanciaSuplementos: form.importanciaSuplementos,
      };
      const resConsulta = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaPayload),
      });
      const dataConsulta = await resConsulta.json().catch(() => ({}));
      if (!resConsulta.ok) throw new Error(dataConsulta?.error || "Error al guardar la solicitud");

      addItem({ productId: "plan-dieta-personalizado", quantity: 1, isSubscription: false });
      router.push("/tienda/carrito");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

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
                <label className="block text-sm font-medium mb-1">¿Qué deseas lograr con tu peso? *</label>
                <select
                  required
                  value={form.metaPeso}
                  onChange={(e) => setForm((f) => ({ ...f, metaPeso: e.target.value }))}
                  className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona uno</option>
                  {META_PESO.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de dieta preferida *</label>
                <select
                  required
                  value={form.tipoDieta}
                  onChange={(e) => setForm((f) => ({ ...f, tipoDieta: e.target.value }))}
                  className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona uno</option>
                  {TIPO_DIETA.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">Ej. alta en proteína, baja en carbohidratos, etc.</p>
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? "Procesando..." : "Pagar y enviar solicitud"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleAddToCart}
              className="border-teal-500 text-teal-600 hover:bg-teal-500/10"
            >
              Enviar solicitud y añadir al carrito
            </Button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
