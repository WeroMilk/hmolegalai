"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { SeriWizardFlow, INIT_DATA, type SeriWizardData } from "@/components/seri-wizard-flow";
import { useUserProfile } from "@/lib/use-user-profile";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function SeriPage() {
  const { t } = useI18n();
  const { profile } = useUserProfile();
  const [wizardData, setWizardData] = useState<SeriWizardData>(INIT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Prellenar nombre y domicilio desde perfil
  useEffect(() => {
    if (!profile) return;
    const nombre = profile.nombreCompleto?.trim() ?? "";
    const dom = (profile.domicilio ?? profile.direccionDespacho ?? "").trim();
    if (nombre || dom) {
      setWizardData((prev) => ({
        ...prev,
        nombre: nombre || prev.nombre,
        domicilio: dom || prev.domicilio,
      }));
    }
  }, [profile]);

  const handleGenerate = async () => {
    if (!wizardData.selectedDoc) {
      setError(t("seri_error_empty"));
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Traducir resumen (Seri -> español) si hay texto
      let resumenSpanish = "";
      if (wizardData.resumen.trim()) {
        const translateRes = await fetch("/api/seri-translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptSeri: wizardData.resumen.trim() }),
        });
        if (!translateRes.ok) {
          const data = await translateRes.json().catch(() => ({}));
          throw new Error(data?.error || t("seri_error_translate"));
        }
        const { spanish } = await translateRes.json();
        resumenSpanish = spanish || "";
      }

      let abogadoId: string | null = null;
      try {
        const listRes = await fetch("/api/abogados/list");
        const listData = await listRes.json();
        // Buscar específicamente el abogado con email abogado@avatar.com
        const defaultAbogado = (listData.abogados ?? []).find((a: { email: string }) => a.email === "abogado@avatar.com");
        if (defaultAbogado?.id) {
          abogadoId = defaultAbogado.id;
        } else {
          // Fallback: usar el primero si no se encuentra el específico
          const first = (listData.abogados ?? [])[0];
          if (first?.id) abogadoId = first.id;
        }
      } catch {
        /* ignorar - el backend asignará automáticamente si no hay abogadoId */
      }

      const genRes = await fetch("/api/seri-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: wizardData.selectedDoc.name,
          documentId: wizardData.selectedDoc.id,
          quejosoData: {
            nombre: wizardData.nombre.trim(),
            domicilio: wizardData.domicilio.trim(),
            telefonoCorreo: wizardData.telefonoCorreo.trim(),
          },
          resumenSpanish,
          abogadoId,
        }),
      });

      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}));
        const errorMsg = data?.error || `Error ${genRes.status}: ${genRes.statusText}` || t("seri_error_generate");
        throw new Error(errorMsg);
      }
      
      const genData = await genRes.json().catch(() => ({}));
      if (!genData.success && !genData.content) {
        throw new Error(genData?.error || t("seri_error_generate"));
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("seri_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSuccess(false);
    setWizardData(INIT_DATA);
    setError("");
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 flex flex-col min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6 md:mb-8 flex-shrink-0"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight text-foreground">
            <span className="text-foreground">Comunidad comca&apos;ac · </span>
            <span className="text-blue-500">Cmiique Iitom</span>
          </h1>
          <p className="text-xs xs:text-sm sm:text-lg md:text-xl text-muted mb-6 xs:mb-8 md:mb-12 max-w-3xl mx-auto px-2 xs:px-4">
            {t("seri_subtitle")}
          </p>
        </motion.div>

        {!success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:-mt-8"
          >
            <section className="glass-effect hover-box p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-blue-500/40 flex flex-col">
              <SeriWizardFlow
                data={wizardData}
                onChange={setWizardData}
                disabled={loading}
                onGenerate={handleGenerate}
              />
            </section>
            {error && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex-shrink-0">
                {error}
              </div>
            )}
            {loading && (
              <div className="mt-3 flex justify-center items-center gap-3 py-4 flex-shrink-0">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-sm">{t("seri_btn_generating")}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col justify-center"
          >
            <section className="glass-effect p-4 sm:p-6 rounded-xl border border-green-500/40 bg-green-500/5 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="w-6 h-6" />
                <h2 className="text-lg font-semibold">{t("seri_result_title")}</h2>
              </div>
              <p className="text-sm text-muted mb-4">
                {t("seri_result_desc")}
              </p>
              <Button variant="outline" size="sm" onClick={handleNew} className="border-blue-500/50 text-blue-500">
                {t("seri_btn_new")}
              </Button>
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
}
