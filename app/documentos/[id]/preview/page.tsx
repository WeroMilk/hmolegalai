"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDocumentById } from "@/lib/documents";
import { buildUserInputsForApi } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { getEditsRemaining, PREVIEW_STORAGE_KEYS } from "@/lib/preview-utils";
import { motion } from "framer-motion";
import { DOC_NAME_DESC_KEYS } from "@/lib/translations";
import { Edit3, Download, Printer, Check, FileText } from "lucide-react";

const MAX_EDITS = 2;

/** Detecta si una línea del documento es un título (para centrarla). */
function isTitleLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 120) return false;
  const letters = t.replace(/\s/g, "").replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, "");
  if (letters.length < 2) return false;
  const upper = (t.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length;
  if (upper / letters.length >= 0.7) return true;
  if (/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|CLAUSULA|CLÁUSULA|ARTÍCULO|ARTICULO|NOTA DE VALIDEZ|DOCUMENTO PRIVADO|OBJETO|—+|=+)/i.test(t)) return true;
  return false;
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const documentId = params.id as string;
  const doc = getDocumentById(documentId);
  const docNameDesc = doc ? DOC_NAME_DESC_KEYS[doc.id] : null;
  const docTitle = docNameDesc ? t(docNameDesc.name) : doc?.name ?? "";

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const editsRemaining = getEditsRemaining(originalContent, content);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = sessionStorage.getItem(PREVIEW_STORAGE_KEYS.content);
    const storedOriginal = sessionStorage.getItem(PREVIEW_STORAGE_KEYS.original);
    const storedDocId = sessionStorage.getItem(PREVIEW_STORAGE_KEYS.documentId);

    if (!storedContent || storedDocId !== documentId) {
      router.replace(`/documentos/${documentId}`);
      return;
    }

    setContent(storedContent);
    setOriginalContent(storedOriginal || storedContent);
    setReady(true);
  }, [documentId, router]);

  const handleSaveEdit = () => {
    setIsEditing(false);
    sessionStorage.setItem(PREVIEW_STORAGE_KEYS.content, content);
  };

  const downloadContent = (text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc?.name?.replace(/\s+/g, "-") || "documento"}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => downloadContent(content);

  const handlePrint = () => {
    const escaped = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = content.split("\n").map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return "<div style=\"height:0.5em\"></div>";
      if (isTitleLine(line)) return `<div style="text-align:center;margin:0.25em 0">${escaped(line)}</div>`;
      return `<div style="text-align:justify;margin:0.25em 0">${escaped(line)}</div>`;
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>body{font-family:Georgia,serif;max-width:700px;margin:2rem auto;padding:1rem;line-height:1.6;color:#111;}@page{margin:1cm;}</style></head><body>${lines.join("")}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      window.print();
      return;
    }
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      URL.revokeObjectURL(url);
    });
  };

  if (!ready || !doc) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <Navbar />
        <div className="animate-pulse text-muted">{t("preview_loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{docTitle}</h1>
                <p className="text-muted text-sm">{t("preview_title")}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/10 to-transparent rounded-2xl blur-xl pointer-events-none" />
            <div className="relative bg-card border border-transparent dark:border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 sm:p-8 md:p-12 lg:p-14 min-h-[320px] sm:min-h-[420px]">
                <div className="max-w-2xl mx-auto">
                  {isEditing ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full min-h-[360px] bg-background/80 dark:bg-gray-800/90 dark:border-gray-600/50 dark:text-gray-100 dark:placeholder:text-gray-400 border border-border rounded-xl p-6 text-foreground font-serif text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-muted text-justify"
                      placeholder={t("preview_placeholder")}
                      spellCheck
                    />
                  ) : (
                    <div className="legal-document-content font-serif text-base sm:text-lg text-foreground/95 leading-relaxed space-y-0.5">
                      {content.split("\n").map((line, i) => {
                        const trimmed = line.trim();
                        if (trimmed === "") return <div key={i} className="h-2" aria-hidden />;
                        if (isTitleLine(line)) {
                          return (
                            <div key={i} className="legal-doc-title py-0.5">
                              {line}
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="text-justify py-0.5">
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-600/50 via-blue-500/30 to-transparent" />
            </div>
          </div>

          <p className="text-center text-muted text-xs sm:text-sm max-w-2xl mx-auto py-2 border-t border-border mt-4 pt-4">
            {t("legal_preview_legend")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={isEditing ? handleSaveEdit : () => { setIsEditing(true); handleDownload(); }}
                disabled={editsRemaining <= 0 && !isEditing}
                className="i18n-stable-btn flex items-center justify-center gap-2 min-w-[11rem] px-5 py-3 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
              >
                {isEditing ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("preview_save_changes")}
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    {t("preview_edit")}
                  </>
                )}
              </Button>
              <span
                className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold border-2 whitespace-nowrap ${
                  editsRemaining > 0
                    ? "bg-blue-500/90 text-white border-blue-400/50 shadow-lg shadow-blue-500/20"
                    : "bg-card text-muted border-border"
                }`}
              >
                {editsRemaining} {t("preview_of_2")}
              </span>
            </div>
          </div>

          <p className="text-center text-muted text-sm max-w-md mx-auto">
            {t("preview_edit_hint")}
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button
              onClick={handlePrint}
              className="i18n-stable-btn flex items-center justify-center gap-2 min-w-[8rem] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4" />
              {t("preview_print")}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="i18n-stable-btn flex items-center justify-center gap-2 min-w-[8rem] px-6 py-3 rounded-xl border border-border hover:border-blue-500/50"
            >
              <Download className="w-4 h-4" />
              {t("preview_download")}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/documentos")}
              className="text-blue-500 hover:text-blue-400 text-sm mr-8"
            >
              ← {t("preview_back_catalog")}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
