"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import { getDocumentById } from "@/lib/documents";
import { buildUserInputsForApi } from "@/lib/formatters";
import { PREVIEW_STORAGE_KEYS } from "@/lib/preview-utils";

const isSessionError = (msg: string) =>
  /Sesión inválida|iniciar sesión|session|unauthorized/i.test(msg);

export default function SuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [generating, setGenerating] = useState(true);
  const [documentContent, setDocumentContent] = useState("");
  const [error, setError] = useState("");
  const generationStarted = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentIntent = searchParams.get("payment_intent");
    const contentParam = searchParams.get("content");
    const validPaymentId = sessionId || paymentIntent;

    // Esperar a que la auth termine de cargar antes de decidir
    if (authLoading) return;
    if (validPaymentId && user && generationStarted.current) return;
    if (validPaymentId && user) generationStarted.current = true;

    const generateDocument = async (retryWithFreshToken = false) => {
      // Si viene contenido en la URL (superusuario legacy), ir a preview
      if (contentParam) {
        const content = decodeURIComponent(contentParam);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.content, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.original, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.editsLeft, "5");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.recreatesLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.documentId, params.id as string);
        router.replace(`/documentos/${params.id}/preview`);
        return;
      }

      if (!validPaymentId) {
        setGenerating(false);
        router.replace("/documentos");
        return;
      }

      // Sin usuario tras cargar auth: no mostrar "Sesión inválida", mantener spinner y redirigir
      if (!user) {
        const returnTo = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
        setTimeout(() => {
          router.replace(returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : "/auth");
        }, 2000);
        return;
      }

      const document = getDocumentById(params.id as string);
      if (!document) {
        setGenerating(false);
        router.replace("/documentos");
        return;
      }

      const savedFormData = sessionStorage.getItem(`formData_${document.id}`);
      const formData = savedFormData ? JSON.parse(savedFormData) : {};
      const userInputs = buildUserInputsForApi(formData, document);

      const saveToAccount = searchParams.get("save") === "1";
      let keepSpinner = false;
      try {
        const token = await user.getIdToken(retryWithFreshToken);
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId: document.id,
            documentType: document.name,
            userInputs,
            sessionId: validPaymentId,
            saveToAccount,
          }),
        });

        if (!response.ok) {
          let msg = t("success_generate_error");
          try {
            const body = await response.json();
            if (body?.error && typeof body.error === "string") msg = body.error;
          } catch {
            // ignorar si no es JSON
          }
          const isSession = isSessionError(msg);
          if (isSession && !retryWithFreshToken) {
            keepSpinner = true;
            await generateDocument(true);
            return;
          }
          if (isSession) {
            keepSpinner = true;
            setTimeout(() => router.replace(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`), 2000);
            return;
          }
          throw new Error(msg);
        }

        const data = await response.json();
        const content = data.content as string;
        setDocumentContent(content);

        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.content, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.original, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.editsLeft, "5");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.recreatesLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.documentId, document.id);
        router.replace(`/documentos/${document.id}/preview`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isSessionError(msg) && !retryWithFreshToken) {
          keepSpinner = true;
          await generateDocument(true);
          return;
        }
        if (isSessionError(msg)) {
          keepSpinner = true;
          setTimeout(() => router.replace(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`), 2000);
          return;
        }
        setError(msg || t("success_generate_error"));
      } finally {
        if (!keepSpinner) setGenerating(false);
      }
    };

    generateDocument(false);
  }, [params.id, searchParams, user, authLoading, router, t]);

  const handleDownload = () => {
    const blob = new Blob([documentContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documento-legal-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect hover-box p-8 rounded-xl border border-blue-500/40 text-center"
        >
          {generating || error ? (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="hover-title text-3xl font-bold mb-4 text-foreground">
                {generating ? t("success_generating") : t("success_ai_creating")}
              </h1>
              <p className="text-muted mb-6">
                {generating ? t("success_ai_creating") : t("success_back_catalog")}
              </p>
              {!generating && (
                <Button onClick={() => router.push("/documentos")} className="mt-2">
                  {t("success_back_catalog")}
                </Button>
              )}
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="hover-title text-3xl font-bold mb-4 text-foreground">{t("success_document_ready")}</h1>
              <p className="text-muted mb-8">{t("success_document_created")}</p>

              <div className="bg-card border border-transparent dark:border-blue-500/20 rounded-lg p-6 mb-6 text-left">
                <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-mono">
                  {documentContent}
                </pre>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleDownload} className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  {t("success_download_doc")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/mis-documentos")}
                >
                  {t("success_see_my_documents")}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
