"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

export default function ContactoPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ nombreCompleto: "", mensaje: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto.trim(),
          mensaje: form.mensaje.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error al enviar");
      if (data?.ok === false) {
        setError(data?.error || "No se pudo enviar el correo.");
        return;
      }
      setSuccess(true);
      setForm({ nombreCompleto: "", mensaje: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contact_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-teal-500/15 border border-teal-500/30 mb-4">
            <MessageCircle className="w-7 h-7 text-teal-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("contact_title")}</h1>
          <p className="text-muted text-sm sm:text-base">{t("contact_subtitle")}</p>
        </motion.div>

        {success ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-6 sm:p-8 text-center"
          >
            <p className="text-teal-600 dark:text-teal-400 font-medium">{t("contact_success")}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-teal-500/50 text-teal-600 hover:bg-teal-500/10"
              onClick={() => setSuccess(false)}
            >
              {t("contact_send_another")}
            </Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="glass-effect p-6 sm:p-8 rounded-2xl border border-teal-500/40"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="contacto-nombre" className="block text-sm font-medium mb-1.5">
                  {t("contact_name_label")} *
                </label>
                <Input
                  id="contacto-nombre"
                  required
                  value={form.nombreCompleto}
                  onChange={(e) => setForm((f) => ({ ...f, nombreCompleto: e.target.value }))}
                  placeholder={t("contact_name_placeholder")}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="contacto-mensaje" className="block text-sm font-medium mb-1.5">
                  {t("contact_message_label")} *
                </label>
                <textarea
                  id="contacto-mensaje"
                  required
                  rows={5}
                  value={form.mensaje}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                  placeholder={t("contact_message_placeholder")}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y"
                />
              </div>
            </div>
            {error && (
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
                <p className="text-sm text-muted">
                  O escribe directamente a{" "}
                  <a
                    href="mailto:lnhdianagallardo@gmail.com"
                    className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    lnhdianagallardo@gmail.com
                  </a>
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto mt-6 bg-teal-600 hover:bg-teal-700 inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {t("contact_sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("contact_submit")}
                </>
              )}
            </Button>
          </motion.form>
        )}
      </main>
    </div>
  );
}
