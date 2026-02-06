"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  Clock,
  CheckCircle,
  Settings,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CalendarDays,
  User,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { isSuperUser } from "@/lib/superuser";
import { toTitleCase, formatTelefono, formatDireccion } from "@/lib/formatters";

export interface Cita {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
  asunto: string;
  notas?: string;
  createdAt: number;
}

interface PendingDoc {
  id: string;
  documentId?: string;
  documentType: string;
  content?: string;
  status: string;
  createdAt?: { toMillis: () => number };
  createdAtMs?: number;
  source?: string;
  esEjemplo?: boolean;
}

export default function AbogadoDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateAbogadoProfile } = useUserProfile();
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const [approvedDocs, setApprovedDocs] = useState<PendingDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"documentos" | "agenda" | "config">("documentos");
  const [searchDoc, setSearchDoc] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [showAddCita, setShowAddCita] = useState(false);
  const [newCita, setNewCita] = useState({ fecha: format(new Date(), "yyyy-MM-dd"), hora: "09:00", cliente: "", asunto: "", notas: "" });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<"pendientes" | "aprobados" | "todos">("pendientes");
  const [configForm, setConfigForm] = useState({
    nombreCompleto: "",
    nombreDespacho: "",
    direccionDespacho: "",
    telefonoDespacho: "",
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const isAbogado = profile?.role === "abogado" && profile?.approved;
  const isAdmin = isSuperUser(user?.email ?? null);
  const canAccess = isAbogado && !isAdmin;
  const abogadoId = user?.uid ?? "demo";

  const loadCitas = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/abogado/citas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCitas([]);
        return;
      }
      const data = await res.json();
      const list: Cita[] = (data.citas ?? []).map((c: { id: string; fecha: string; hora: string; cliente: string; asunto?: string; notas?: string; createdAt: number }) => ({
        id: c.id,
        fecha: c.fecha,
        hora: c.hora,
        cliente: c.cliente,
        asunto: c.asunto ?? "",
        notas: c.notas,
        createdAt: c.createdAt ?? Date.now(),
      }));
      setCitas(list);
    } catch {
      setCitas([]);
    }
  }, [user]);

  const saveCita = useCallback(
    async (cita: Omit<Cita, "id" | "createdAt">) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/abogado/citas", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cita),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error ?? "Error al guardar");
        }
        const data = await res.json();
        const full: Cita = data.cita ?? { ...cita, id: crypto.randomUUID(), createdAt: Date.now() };
        setCitas((prev) => [full, ...prev]);
        setShowAddCita(false);
        setNewCita({ fecha: format(new Date(), "yyyy-MM-dd"), hora: "09:00", cliente: "", asunto: "", notas: "" });
      } catch (e) {
        console.error("Error saving cita:", e);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user && isAbogado) loadCitas();
  }, [user, isAbogado, loadCitas]);

  useEffect(() => {
    if (profile) {
      setConfigForm({
        nombreCompleto: profile.nombreCompleto ?? "",
        nombreDespacho: profile.nombreDespacho ?? "",
        direccionDespacho: profile.direccionDespacho ?? "",
        telefonoDespacho: profile.telefonoDespacho ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin/abogados");
      return;
    }
    if (!profileLoading && profile?.role !== "abogado") {
      if (profile?.role === "cliente" || (!profile && user)) {
        router.replace("/documentos");
        return;
      }
    }
  }, [profile, profileLoading, user, router, isAdmin]);

  useEffect(() => {
    if (!user || !isAbogado) return;
    const fetchDocs = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/abogado/documentos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setDocs([]);
          setApprovedDocs([]);
          return;
        }
        const data = await res.json();
        const pendingList: PendingDoc[] = (data.pending ?? []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          documentId: d.documentId as string,
          documentType: (d.documentType as string) ?? "",
          content: d.content as string,
          status: (d.status as string) ?? "pending_abogado",
          createdAtMs: d.createdAtMs as number,
          source: d.source as string | undefined,
        }));
        const approvedList: PendingDoc[] = (data.approved ?? []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          documentId: d.documentId as string,
          documentType: (d.documentType as string) ?? "",
          content: d.content as string,
          status: (d.status as string) ?? "approved",
          createdAtMs: d.createdAtMs as number,
          source: d.source as string | undefined,
        }));
        setDocs(pendingList);
        setApprovedDocs(approvedList);
      } catch (e) {
        console.error("Error loading documents:", e);
        setDocs([]);
        setApprovedDocs([]);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, [user, isAbogado]);

  const loading = authLoading || profileLoading;

  const filteredDocs =
    filterStatus === "pendientes"
      ? docs.filter(
          (d) =>
            !searchDoc ||
            d.documentType?.toLowerCase().includes(searchDoc.toLowerCase()) ||
            d.content?.toLowerCase().includes(searchDoc.toLowerCase())
        )
      : filterStatus === "aprobados"
        ? approvedDocs.filter(
            (d) =>
              !searchDoc ||
              (d.documentType as string)?.toLowerCase().includes(searchDoc.toLowerCase()) ||
              (d.content as string)?.toLowerCase().includes(searchDoc.toLowerCase())
          )
        : [...docs, ...approvedDocs].filter(
            (d) =>
              !searchDoc ||
              (d.documentType as string)?.toLowerCase().includes(searchDoc.toLowerCase()) ||
              (d.content as string)?.toLowerCase().includes(searchDoc.toLowerCase())
          );

  const hasRealDocs = filteredDocs.some((d) => !(d as PendingDoc & { esEjemplo?: boolean }).esEjemplo);
  const todayCitas = citas.filter((c) => c.fecha === format(new Date(), "yyyy-MM-dd"));
  const monthCitas = citas.filter((c) => {
    const d = parseISO(c.fecha);
    return isSameMonth(d, calendarMonth);
  });
  const monthDays = eachDayOfInterval({
    start: startOfMonth(calendarMonth),
    end: endOfMonth(calendarMonth),
  });
  const firstDay = startOfMonth(calendarMonth).getDay();
  const padStart = firstDay === 0 ? 6 : firstDay - 1;

  if (loading) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (profile?.role === "abogado" && profile?.approved === false) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="glass-effect p-8 rounded-2xl border border-amber-500/40 text-center">
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Cuenta pendiente de aprobación</h1>
            <p className="text-muted text-sm mb-4">
              Tu perfil está en revisión. Debes enviar tu foto, INE y título profesional para completar la verificación.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted text-sm sm:text-base mt-1">
              Hola, {profile?.nombreCompleto || user?.email?.split("@")[0] || "Abogado"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {[
            { id: "documentos" as const, label: "Documentos", icon: FileText },
            { id: "agenda" as const, label: "Agenda", icon: CalendarDays },
            { id: "config" as const, label: "Configuración", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-blue-500/40"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "documentos" && (
            <motion.div
              key="documentos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <div className="glass-effect p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{docs.length}</p>
                    <p className="text-sm text-muted">Pendientes de revisar</p>
                  </div>
                </div>
                <div className="glass-effect p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{approvedDocs.length}</p>
                    <p className="text-sm text-muted">Aprobados (últimos 50)</p>
                  </div>
                </div>
                <div className="glass-effect p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{docs.length + approvedDocs.length}</p>
                    <p className="text-sm text-muted">Total en sistema</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <Input
                    placeholder="Buscar por tipo o contenido..."
                    value={searchDoc}
                    onChange={(e) => setSearchDoc(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(["pendientes", "aprobados", "todos"] as const).map((s) => {
                    const isActive = filterStatus === s;
                    const styles = {
                      pendientes: isActive ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25" : "bg-card border border-border text-muted hover:text-foreground hover:border-amber-500/40",
                      aprobados: isActive ? "bg-green-600 text-white shadow-lg shadow-green-500/25" : "bg-card border border-border text-muted hover:text-foreground hover:border-green-500/40",
                      todos: isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "bg-card border border-border text-muted hover:text-foreground hover:border-blue-500/40",
                    };
                    return (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${styles[s]}`}
                      >
                        {s === "pendientes" ? "Pendientes" : s === "aprobados" ? "Aprobados" : "Todos"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {docsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect p-12 rounded-2xl border border-border text-center"
                >
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">No hay documentos</h2>
                  <p className="text-muted text-sm">No hay documentos que coincidan con el filtro.</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {!hasRealDocs && (
                    <div className="rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 p-4 mb-4">
                      <p className="text-sm text-muted">
                        No hay solicitudes reales. A continuación ejemplos de cómo se verán cuando te lleguen:
                      </p>
                    </div>
                  )}
                  {filteredDocs.map((doc, idx) => {
                    const isPending = doc.status === "pending_abogado";
                    const esEjemplo = doc.esEjemplo === true;
                    return (
                      <motion.div
                        key={doc.id ?? idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                        className={`glass-effect hover-box p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${esEjemplo ? "border-dashed border-border opacity-90" : "border-border"}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <FileText
                            className={`w-8 h-8 flex-shrink-0 mt-0.5 ${isPending ? "text-amber-500" : "text-green-500"}`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground truncate">
                                {(doc as { documentType?: string }).documentType}
                              </h3>
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                                  Pendiente
                                </span>
                              )}
                              {!isPending && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                                  Aprobado
                                </span>
                              )}
                              {(doc as { source?: string }).source === "seri" && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs">
                                  comca&apos;ac
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted">
                              {(() => {
                                const d = doc as PendingDoc;
                                const ms = d.createdAtMs ?? (typeof d.createdAt?.toMillis === "function" ? d.createdAt.toMillis() : null);
                                return ms ? format(ms, "dd MMM yyyy, HH:mm", { locale: es }) : "";
                              })()}
                            </p>
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {((doc as { content?: string }).content ?? "").slice(0, 120)}...
                            </p>
                          </div>
                        </div>
                        {isPending && !esEjemplo && (
                          <Link href={`/abogado/documento/${doc.id}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10">
                              Revisar
                            </Button>
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "agenda" && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Calendario</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCalendarMonth((d) => subMonths(d, 1))}
                        className="p-2 rounded-lg hover:bg-card border border-border transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                        {format(calendarMonth, "MMMM yyyy", { locale: es })}
                      </span>
                      <button
                        onClick={() => setCalendarMonth((d) => addMonths(d, 1))}
                        className="p-2 rounded-lg hover:bg-card border border-border transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="glass-effect p-4 rounded-xl border border-border">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-muted py-1">
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: padStart }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))}
                      {monthDays.map((day) => {
                        const dayCitas = citas.filter((c) => c.fecha === format(day, "yyyy-MM-dd"));
                        const hasCitas = dayCitas.length > 0;
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                              !isSameMonth(day, calendarMonth)
                                ? "text-muted/50"
                                : isSelected
                                  ? "bg-blue-600 text-white"
                                  : isToday(day)
                                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                    : hasCitas
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                                      : "hover:bg-card"
                            }`}
                          >
                            {format(day, "d")}
                            {hasCitas && (
                              <span className="block w-1 h-1 rounded-full bg-current mx-auto mt-0.5 opacity-70" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="glass-effect p-4 rounded-xl border border-border">
                      <h3 className="font-semibold text-foreground mb-3">
                        Citas del {format(selectedDate, "EEEE d MMMM", { locale: es })}
                      </h3>
                      {citas
                        .filter((c) => c.fecha === format(selectedDate, "yyyy-MM-dd"))
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border mb-2 last:mb-0"
                          >
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 shrink-0">{c.hora}</span>
                            <div>
                              <p className="font-medium text-foreground">{c.cliente}</p>
                              <p className="text-sm text-muted">{c.asunto}</p>
                              {c.notas && <p className="text-xs text-muted mt-1">{c.notas}</p>}
                            </div>
                          </div>
                        ))}
                      {citas.filter((c) => c.fecha === format(selectedDate, "yyyy-MM-dd")).length === 0 && (
                        <p className="text-sm text-muted">No hay citas programadas.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Hoy</h2>
                    <Button size="sm" onClick={() => setShowAddCita(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Nueva cita
                    </Button>
                  </div>
                  <div className="glass-effect p-4 rounded-xl border border-border space-y-3">
                    {todayCitas.length === 0 ? (
                      <p className="text-sm text-muted">No tienes citas hoy.</p>
                    ) : (
                      todayCitas
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map((c) => (
                          <div key={c.id} className="p-3 rounded-lg bg-background/50 border border-border">
                            <p className="font-medium text-foreground">{c.cliente}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{c.hora}</p>
                            <p className="text-xs text-muted">{c.asunto}</p>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="glass-effect p-4 rounded-xl border border-border">
                    <h3 className="font-semibold text-foreground mb-2">Próximas citas del mes</h3>
                    {monthCitas
                      .filter((c) => c.fecha >= format(new Date(), "yyyy-MM-dd"))
                      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
                      .slice(0, 5)
                      .map((c) => (
                        <div key={c.id} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                          <span className="text-muted">{format(parseISO(c.fecha), "d MMM", { locale: es })}</span>
                          <span className="font-medium text-foreground">{c.cliente}</span>
                        </div>
                      ))}
                    {monthCitas.filter((c) => c.fecha >= format(new Date(), "yyyy-MM-dd")).length === 0 && (
                      <p className="text-sm text-muted">No hay citas próximas.</p>
                    )}
                  </div>
                </div>
              </div>

              {showAddCita && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowAddCita(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background border border-border rounded-2xl shadow-xl max-w-md w-full p-6"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4">Nueva cita</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="cita-fecha" className="block text-sm font-medium text-foreground mb-1">
                          Fecha
                        </label>
                        <Input
                          id="cita-fecha"
                          name="fecha"
                          type="date"
                          value={newCita.fecha}
                          onChange={(e) => setNewCita((p) => ({ ...p, fecha: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="cita-hora" className="block text-sm font-medium text-foreground mb-1">
                          Hora
                        </label>
                        <Input
                          id="cita-hora"
                          name="hora"
                          type="time"
                          value={newCita.hora}
                          onChange={(e) => setNewCita((p) => ({ ...p, hora: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="cita-cliente" className="block text-sm font-medium text-foreground mb-1">
                          Cliente *
                        </label>
                        <Input
                          id="cita-cliente"
                          name="cliente"
                          placeholder="Nombre del cliente"
                          value={newCita.cliente}
                          onChange={(e) => setNewCita((p) => ({ ...p, cliente: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="cita-asunto" className="block text-sm font-medium text-foreground mb-1">
                          Asunto
                        </label>
                        <Input
                          id="cita-asunto"
                          name="asunto"
                          placeholder="Ej: Revisión de contrato"
                          value={newCita.asunto}
                          onChange={(e) => setNewCita((p) => ({ ...p, asunto: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="cita-notas" className="block text-sm font-medium text-foreground mb-1">
                          Notas
                        </label>
                        <Input
                          id="cita-notas"
                          name="notas"
                          placeholder="Notas adicionales"
                          value={newCita.notas}
                          onChange={(e) => setNewCita((p) => ({ ...p, notas: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button
                        onClick={() => {
                          if (newCita.cliente.trim()) saveCita(newCita);
                        }}
                        disabled={!newCita.cliente.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddCita(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setConfigSaving(true);
                  setConfigSaved(false);
                  const result = await updateAbogadoProfile(configForm);
                  setConfigSaving(false);
                  if (result.ok) {
                    setConfigSaved(true);
                    // Actualizar el formulario con los valores del perfil actualizado
                    if (profile) {
                      setConfigForm({
                        nombreCompleto: profile.nombreCompleto ?? "",
                        nombreDespacho: profile.nombreDespacho ?? "",
                        direccionDespacho: profile.direccionDespacho ?? "",
                        telefonoDespacho: profile.telefonoDespacho ?? "",
                      });
                    }
                    // Ocultar el mensaje de guardado después de 3 segundos
                    setTimeout(() => setConfigSaved(false), 3000);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="glass-effect p-6 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Perfil profesional</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label htmlFor="config-nombre" className="block text-muted mb-1">Nombre completo</label>
                      <Input
                        id="config-nombre"
                        value={configForm.nombreCompleto}
                        onChange={(e) => setConfigForm((p) => ({ ...p, nombreCompleto: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v) setConfigForm((p) => ({ ...p, nombreCompleto: toTitleCase(v) }));
                        }}
                        placeholder="Ej: Lic. Juan Pérez López"
                        className="font-medium"
                      />
                    </div>
                    <div>
                      <span className="block text-muted mb-1">Correo</span>
                      <span className="font-medium text-foreground">{user?.email || "—"}</span>
                      <p className="text-xs text-muted mt-0.5">El correo no se puede modificar</p>
                    </div>
                    <div>
                      <label htmlFor="config-despacho" className="block text-muted mb-1">Nombre del despacho</label>
                      <Input
                        id="config-despacho"
                        value={configForm.nombreDespacho}
                        onChange={(e) => setConfigForm((p) => ({ ...p, nombreDespacho: e.target.value }))}
                        placeholder="Ej: Bufete Jurídico Pérez"
                        className="font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="glass-effect p-6 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Despacho</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label htmlFor="config-direccion" className="block text-muted mb-1">Dirección</label>
                      <Input
                        id="config-direccion"
                        value={configForm.direccionDespacho}
                        onChange={(e) => setConfigForm((p) => ({ ...p, direccionDespacho: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v) setConfigForm((p) => ({ ...p, direccionDespacho: formatDireccion(v) }));
                        }}
                        placeholder="Av. Reforma 150, Col. Centro, Hermosillo, Sonora"
                        className="font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="config-telefono" className="block text-muted mb-1">Teléfono</label>
                      <Input
                        id="config-telefono"
                        value={configForm.telefonoDespacho}
                        onChange={(e) => setConfigForm((p) => ({ ...p, telefonoDespacho: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v) setConfigForm((p) => ({ ...p, telefonoDespacho: formatTelefono(v) }));
                        }}
                        placeholder="(662) 215-3000"
                        className="font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="submit" disabled={configSaving} className="bg-blue-600 hover:bg-blue-700">
                    {configSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : configSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Guardado
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
