"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";
import { isSuperUser } from "@/lib/superuser";
export default function AbogadoDocumentoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const id = params.id as string;
  const [docData, setDocData] = useState<{
    content: string;
    documentType: string;
    status: string;
    userId: string;
    source?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState("");
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSuperUser(user?.email ?? null)) {
      router.replace("/admin/abogados");
      return;
    }
    if (!user || profile?.role !== "abogado" || profile?.approved !== true) {
      if (!profile?.role && !profile) return;
      router.replace("/abogado/dashboard");
      return;
    }
  }, [user, profile, router]);

  useEffect(() => {
    if (!id || !user) return;
    const fetchDoc = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/abogado/documentos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.replace("/abogado/dashboard");
          return;
        }
        const d = await res.json();
        setDocData({
          content: d?.content ?? "",
          documentType: d?.documentType ?? "",
          status: d?.status ?? "",
          userId: d?.userId ?? "",
          source: d?.source,
        });
        setEditedContent(d?.content ?? "");
      } catch {
        router.replace("/abogado/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id, user, router]);

  const handleApprove = async () => {
    if (!user) return;
    setApproving(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/documents/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: id, content: editedContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al aprobar");
      }
      router.push("/abogado/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setApproving(false);
    }
  };

  if (loading || !docData) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (docData.status !== "pending_abogado") {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <p className="text-muted">Este documento ya fue procesado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">{docData.documentType}</h1>
            {docData.source === "seri" && (
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm">
                {"Comunidad comca'ac · Pago presencial"}
              </span>
            )}
          </div>

          <div className="glass-effect p-4 rounded-xl border border-border">
            <label htmlFor="abogado-documento-content" className="block text-sm font-medium text-muted mb-2">Contenido (editable)</label>
            <textarea
              id="abogado-documento-content"
              name="editedContent"
              autoComplete="off"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[400px] p-4 rounded-lg bg-background border border-border text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              spellCheck
            />
          </div>

          <p className="text-sm text-muted">
            Revisa el documento, edita si es necesario, y aprueba para que pase a &quot;Mis documentos&quot; del cliente.
            {docData.source === "seri" && " El cliente comca'ac pagará de forma presencial en el despacho."}
          </p>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  Aprobar documento
                </>
              )}
            </Button>
            <Link href="/abogado/dashboard">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
