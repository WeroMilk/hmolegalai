"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { isSuperUser } from "@/lib/superuser";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Scale, User, ChevronDown, ChevronUp } from "lucide-react";

interface Abogado {
  id: string;
  email: string;
  nombreCompleto?: string;
  nombreDespacho?: string;
  approved?: boolean;
  createdAt?: number;
}

/** Ejemplos para mostrar cómo se verán los abogados cuando se registren */
const ABOGADOS_EJEMPLO: (Abogado & { esEjemplo?: boolean })[] = [
  { id: "ej-1", email: "maria.gonzalez@despacho.com", nombreCompleto: "Lic. María González López", nombreDespacho: "Despacho Legal González", approved: true, esEjemplo: true },
  { id: "ej-2", email: "carlos.mendoza@mendozaabogados.mx", nombreCompleto: "Lic. Carlos Mendoza Ruiz", nombreDespacho: "Mendoza & Asociados", approved: false, esEjemplo: true },
  { id: "ej-3", email: "ana.ramirez@ramirez-legal.com", nombreCompleto: "Lic. Ana Ramírez Torres", nombreDespacho: "Ramírez Abogados", approved: false, esEjemplo: true },
];

export default function AdminAbogadosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateAbogadoProfile } = useUserProfile();
  const [abogados, setAbogados] = useState<Abogado[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nombreCompleto: "", nombreDespacho: "", direccionDespacho: "", telefonoDespacho: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isSuperUser(user.email ?? null))) {
      router.replace("/");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        nombreCompleto: profile.nombreCompleto ?? "",
        nombreDespacho: profile.nombreDespacho ?? "",
        direccionDespacho: profile.direccionDespacho ?? "",
        telefonoDespacho: profile.telefonoDespacho ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user || !isSuperUser(user.email ?? null)) return;
    const fetchAbogados = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/abogados", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al cargar");
        const data = await res.json();
        setAbogados(data.abogados ?? []);
      } catch {
        setAbogados([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAbogados();
  }, [user]);

  const handleApprove = async (userId: string, approved: boolean) => {
    if (!user) return;
    setUpdating(userId);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/abogados", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, approved }),
      });
      if (!res.ok) throw new Error("Error");
      setAbogados((prev) =>
        prev.map((a) => (a.id === userId ? { ...a, approved } : a))
      );
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || !isSuperUser(user.email ?? null)) {
    return null;
  }

  const listado = abogados.length > 0 ? abogados : ABOGADOS_EJEMPLO;
  const mostrarEjemplos = abogados.length === 0 && !loading;

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Scale className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Administrar abogados</h1>
              <p className="text-sm text-muted mt-0.5">
                Revisa y aprueba a los profesionales que se registran en la plataforma.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mb-8 rounded-xl border border-border glass-effect overflow-hidden">
          <button
            type="button"
            onClick={() => setShowProfile((p) => !p)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Mi perfil (admin)</span>
            </div>
            {showProfile ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
          </button>
          {showProfile && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProfileSaving(true);
                setProfileSaved(false);
                const result = await updateAbogadoProfile(profileForm);
                setProfileSaving(false);
                if (result.ok) {
                  setProfileSaved(true);
                  // Actualizar el formulario con los valores del perfil actualizado
                  if (profile) {
                    setProfileForm({
                      nombreCompleto: profile.nombreCompleto ?? "",
                      nombreDespacho: profile.nombreDespacho ?? "",
                      direccionDespacho: profile.direccionDespacho ?? "",
                      telefonoDespacho: profile.telefonoDespacho ?? "",
                    });
                  }
                  // Ocultar el mensaje de guardado después de 3 segundos
                  setTimeout(() => setProfileSaved(false), 3000);
                }
              }}
              className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border"
            >
              <div>
                <label className="block text-sm text-muted mb-1">Nombre completo</label>
                <Input value={profileForm.nombreCompleto} onChange={(e) => setProfileForm((p) => ({ ...p, nombreCompleto: e.target.value }))} placeholder="Lic. Nombre" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Nombre del despacho</label>
                <Input value={profileForm.nombreDespacho} onChange={(e) => setProfileForm((p) => ({ ...p, nombreDespacho: e.target.value }))} placeholder="Bufete..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-muted mb-1">Dirección del despacho</label>
                <Input value={profileForm.direccionDespacho} onChange={(e) => setProfileForm((p) => ({ ...p, direccionDespacho: e.target.value }))} placeholder="Calle, colonia, ciudad" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Teléfono</label>
                <Input value={profileForm.telefonoDespacho} onChange={(e) => setProfileForm((p) => ({ ...p, telefonoDespacho: e.target.value }))} placeholder="(662) 123-4567" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={profileSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : profileSaved ? <><CheckCircle className="w-4 h-4 mr-2" />Guardado</> : "Guardar perfil"}
                </Button>
              </div>
            </form>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-muted">Cargando abogados...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {mostrarEjemplos && (
              <div className="rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 p-4 mb-6">
                <p className="text-sm text-muted">
                  Aún no hay abogados registrados. Cuando se inscriban, aparecerán aquí. A continuación un ejemplo de cómo se verán:
                </p>
              </div>
            )}
            {listado.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-effect rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 transition-all ${
                  (a as Abogado & { esEjemplo?: boolean }).esEjemplo
                    ? "border-dashed border-border opacity-90"
                    : "border-border hover:border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{a.nombreCompleto || a.email}</p>
                    <p className="text-sm text-muted truncate">{a.email}</p>
                    {a.nombreDespacho && (
                      <p className="text-xs text-muted mt-1">{a.nombreDespacho}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  {(a as Abogado & { esEjemplo?: boolean }).esEjemplo ? (
                    a.approved ? (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Aprobado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                        Pendiente de aprobación
                      </span>
                    )
                  ) : a.approved ? (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Aprobado
                    </span>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(a.id, true)}
                        disabled={updating === a.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating === a.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Aprobar"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(a.id, false)}
                        disabled={updating === a.id}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
