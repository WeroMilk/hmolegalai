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
import { User, Briefcase } from "lucide-react";
import type { UserRole } from "@/lib/user-profile";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const [role, setRole] = useState<UserRole | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [ciudadPie, setCiudadPie] = useState("");
  const [nombreDespacho, setNombreDespacho] = useState("");
  const [direccionDespacho, setDireccionDespacho] = useState("");
  const [telefonoDespacho, setTelefonoDespacho] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && profile?.role) {
      router.replace(profile.role === "abogado" ? "/abogado/dashboard" : "/documentos");
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
    if (!role) {
      setError("Selecciona si eres Cliente o Abogado.");
      return;
    }
    if (role === "abogado" && !nombreCompleto.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }
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
          role,
          nombreCompleto: nombreCompleto.trim() || undefined,
          domicilio: role === "cliente" ? domicilio.trim() || undefined : undefined,
          ciudadPie: role === "cliente" ? ciudadPie.trim() || undefined : undefined,
          nombreDespacho: role === "abogado" ? nombreDespacho.trim() || undefined : undefined,
          direccionDespacho: role === "abogado" ? direccionDespacho.trim() || undefined : undefined,
          telefonoDespacho: role === "abogado" ? telefonoDespacho.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al guardar");
      }
      router.replace(role === "abogado" ? "/abogado/dashboard" : "/documentos");
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
      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect p-6 sm:p-8 rounded-xl border border-blue-500/40"
        >
          <h1 className="text-2xl font-bold text-center mb-2">Completa tu perfil</h1>
          <p className="text-muted text-center text-sm mb-6">
            Elige si eres Cliente o Abogado. Esta elección no podrá cambiarse.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="md:flex md:gap-8 md:items-start">
              <div className="md:flex-shrink-0 md:w-48 mb-4 md:mb-0">
                <label className="block text-sm font-medium mb-2 text-foreground">¿Eres Cliente o Abogado?</label>
                <div className="flex md:flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("cliente")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      role === "cliente"
                        ? "border-blue-500 bg-blue-500/10 text-foreground"
                        : "border-border text-muted hover:border-blue-500/50"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("abogado")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      role === "abogado"
                        ? "border-blue-500 bg-blue-500/10 text-foreground"
                        : "border-border text-muted hover:border-blue-500/50"
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    Abogado
                  </button>
                </div>
              </div>
              <div className="md:flex-1 md:min-w-0 space-y-3">
                {role === "cliente" && (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/30">
                    <p className="text-sm text-muted">Opcional: estos datos prellenarán tus documentos de amparo.</p>
                    <div>
                      <label htmlFor="complete-profile-nombreCliente" className="sr-only">Nombre completo</label>
                      <Input
                        id="complete-profile-nombreCliente"
                        name="nombreCompleto"
                        autoComplete="name"
                        placeholder="Nombre completo (para prellenar quejoso)"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="complete-profile-domicilioCliente" className="sr-only">Domicilio</label>
                      <Input
                        id="complete-profile-domicilioCliente"
                        name="domicilio"
                        autoComplete="street-address"
                        placeholder="Domicilio (calle, colonia, CP, ciudad, estado)"
                        value={domicilio}
                        onChange={(e) => setDomicilio(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="complete-profile-ciudadPie" className="sr-only">Ciudad para documentos</label>
                      <Input
                        id="complete-profile-ciudadPie"
                        name="ciudadPie"
                        placeholder="Ciudad para pie del documento (ej: Hermosillo, Sonora)"
                        value={ciudadPie}
                        onChange={(e) => setCiudadPie(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {role === "abogado" && (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/30">
                    <div>
                      <label htmlFor="complete-profile-nombreCompleto" className="sr-only">Nombre completo</label>
                      <Input
                        id="complete-profile-nombreCompleto"
                        name="nombreCompleto"
                        autoComplete="name"
                        placeholder="Nombre completo *"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        required={role === "abogado"}
                      />
                    </div>
                    <div className="md:grid md:grid-cols-2 md:gap-3">
                      <div>
                        <label htmlFor="complete-profile-nombreDespacho" className="sr-only">Nombre del despacho</label>
                        <Input
                          id="complete-profile-nombreDespacho"
                          name="nombreDespacho"
                          autoComplete="organization"
                          placeholder="Nombre del despacho"
                          value={nombreDespacho}
                          onChange={(e) => setNombreDespacho(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="complete-profile-telefonoDespacho" className="sr-only">Teléfono del despacho</label>
                        <Input
                          id="complete-profile-telefonoDespacho"
                          name="telefonoDespacho"
                          autoComplete="tel"
                          placeholder="Teléfono del despacho"
                          value={telefonoDespacho}
                          onChange={(e) => setTelefonoDespacho(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="complete-profile-direccionDespacho" className="sr-only">Dirección del despacho</label>
                      <Input
                        id="complete-profile-direccionDespacho"
                        name="direccionDespacho"
                        autoComplete="street-address"
                        placeholder="Dirección del despacho"
                        value={direccionDespacho}
                        onChange={(e) => setDireccionDespacho(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted">
                      Después deberás enviar tu foto, INE y título para verificar tu cuenta.
                    </p>
                  </div>
                )}
              </div>
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
