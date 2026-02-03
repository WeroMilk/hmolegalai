"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { isSuperUser } from "@/lib/superuser";

interface Document {
  id: string;
  documentId: string;
  documentType: string;
  createdAt: any;
  content: string;
}

export default function MisDocumentosPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Superusuario demo no tiene sesión en Firebase → no consultar Firestore (evita "Missing or insufficient permissions")
    const isDemoSuperuser = user.uid === "demo-superuser" || isSuperUser(user.email ?? null);
    if (isDemoSuperuser || !db) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      // Solo where(userId) para no requerir índice compuesto; ordenamos en memoria
      const q = query(
        collection(db, "documents"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const docs: Document[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Document);
      });
      // Ordenar por fecha de creación (más reciente primero)
      docs.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() ?? 0;
        const tB = b.createdAt?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
        return;
      }
      loadDocuments();
    }
  }, [user, authLoading, router, loadDocuments]);

  const handleDownload = (content: string, documentType: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-muted">{t("mis_docs_loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <h1 className="text-4xl font-bold mb-8 text-foreground">
          <span className="gradient-text hover-title">{t("mis_docs_title")}</span>
        </h1>

        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect hover-box p-12 rounded-xl border border-blue-500/40 text-center"
          >
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="hover-title text-2xl font-semibold mb-2 text-foreground">{t("mis_docs_empty_title")}</h2>
            <p className="text-muted mb-6">{t("mis_docs_empty_desc")}</p>
            <button
              onClick={() => router.push("/documentos")}
              className="hover-button btn-primary px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg glow-border text-white font-medium"
            >
              {t("mis_docs_see_catalog")}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect hover-box p-6 rounded-xl border border-blue-500/40 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  <button
                    onClick={() => handleDownload(doc.content, doc.documentType)}
                    className="p-2 hover:bg-card rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5 text-muted" />
                  </button>
                </div>
                <h3 className="hover-title text-xl font-semibold mb-2 text-foreground">{doc.documentType}</h3>
                <div className="flex items-center text-muted text-sm">
                  {doc.createdAt
                    ? format(doc.createdAt.toDate(), "dd MMM yyyy")
                    : t("mis_docs_date_unavailable")}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
