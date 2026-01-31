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

export default function SuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
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

    // Evitar doble ejecución solo cuando ya vamos a generar (tenemos pago y usuario)
    if (validPaymentId && user && generationStarted.current) return;
    if (validPaymentId && user) generationStarted.current = true;

    const generateDocument = async () => {
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

      if (!validPaymentId || !user) {
        setError(t("success_invalid_session"));
        setGenerating(false);
        return;
      }

      const document = getDocumentById(params.id as string);
      if (!document) {
        setError(t("success_doc_not_found"));
        setGenerating(false);
        return;
      }

      const savedFormData = sessionStorage.getItem(`formData_${document.id}`);
      const formData = savedFormData ? JSON.parse(savedFormData) : {};
      const userInputs = buildUserInputsForApi(formData, document);

      const saveToAccount = searchParams.get("save") === "1";
      try {
        const token = await user.getIdToken();
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
      } catch (err: any) {
        setError(err.message || t("success_generate_error"));
      } finally {
        setGenerating(false);
      }
    };

    generateDocument();
  }, [params.id, searchParams, user, router, t]);

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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect hover-box p-8 rounded-xl border border-blue-500/40 text-center"
        >
          {generating ? (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="hover-title text-3xl font-bold mb-4 text-foreground">{t("success_generating")}</h1>
              <p className="text-muted">{t("success_ai_creating")}</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-400 text-4xl mb-4">✕</div>
              <h1 className="text-3xl font-bold mb-4 text-red-400">{t("success_error")}</h1>
              <p className="text-muted mb-6">{error}</p>
              <Button onClick={() => router.push("/documentos")}>
                {t("success_back_catalog")}
              </Button>
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
