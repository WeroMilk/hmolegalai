"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import type { UserRole } from "@/lib/user-profile";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const [role] = useState<UserRole>("cliente");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && profile?.role) {
      router.replace("/");
      return;
    }
  }, [profile, loading, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
      return;
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) throw new Error("No se pudo obtener el token");
      const res = await fetch("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: "cliente",
          nombreCompleto: nombreCompleto.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al guardar");
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || profile?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-md mx-auto px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect p-6 sm:p-8 rounded-xl border border-blue-500/40"
        >
          <h1 className="text-2xl font-bold text-center mb-2">Completa tu perfil</h1>
          <p className="text-muted text-center text-sm mb-6">
            Indica tu nombre para personalizar tu experiencia.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="complete-profile-nombre" className="block text-sm font-medium mb-2 text-foreground">Nombre completo (opcional)</label>
              <Input
                id="complete-profile-nombre"
                name="nombreCompleto"
                autoComplete="name"
                placeholder="Tu nombre"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
              />
            </div>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Continuar"}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
