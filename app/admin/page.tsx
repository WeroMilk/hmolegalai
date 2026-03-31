"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isDidiUser } from "@/lib/didi";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Package,
  Clock,
  Mail,
  Phone,
  Target,
  Calendar,
  Truck,
  Sparkles,
  Trash2,
} from "lucide-react";

type Consulta = {
  id: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  edad?: number;
  estatura?: number;
  peso?: string | null;
  objetivoPrincipal?: string;
  metaPeso?: string;
  tipoDieta?: string;
  condicionesMedicas?: string | null;
  habitos?: { alimentacion?: string[]; ejercicio?: string[]; sueno?: string[]; estres?: string[] };
  importanciaSuplementos?: number;
  createdAt?: string | null;
  paidAt?: string | null;
  planDieta?: "semanal" | "quincenal" | "mensual" | "prueba" | null;
};

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type Order = {
  id: string;
  stripeSessionId?: string;
  status?: string;
  userId?: string | null;
  items?: unknown;
  createdAt?: string | null;
  paidAt?: string | null;
  shippingAddress?: ShippingAddress | null;
  numeroGuia?: string | null;
  enviadaAt?: string | null;
};

type OrderStatus = "pendiente" | "enviado" | "por llegar" | "finalizado";

const ORDER_STATUS_OPTIONS: OrderStatus[] = ["pendiente", "enviado", "por llegar", "finalizado"];

function normalizeOrderStatus(status?: string): OrderStatus {
  if (status === "enviado" || status === "por llegar" || status === "finalizado") return status;
  if (status === "paid" || status === "pending" || status === "enviada" || status === "pendiente") return "pendiente";
  return "pendiente";
}

function getOrderStatusLabel(status?: string): string {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "enviado") return "Enviado";
  if (normalized === "por llegar") return "Por llegar";
  if (normalized === "finalizado") return "Finalizado";
  return "Pendiente";
}

function getOrderStatusClass(status?: string): string {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "enviado") return "bg-sky-500/15 text-sky-600 dark:text-sky-400";
  if (normalized === "por llegar") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (normalized === "finalizado") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  return "bg-red-500/15 text-red-600 dark:text-red-400";
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingGuiaOrderId, setEditingGuiaOrderId] = useState<string | null>(null);
  const [guiaEditValue, setGuiaEditValue] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingConsultaId, setDeletingConsultaId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth?returnTo=/admin");
      return;
    }
    if (!isDidiUser(user.email)) {
      router.replace("/");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !isDidiUser(user.email)) return;
    const fetchConsultas = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/consultas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConsultas(data.consultas ?? []);
        } else {
          setConsultas([]);
        }
      } catch {
        setConsultas([]);
      } finally {
        setLoadingConsultas(false);
      }
    };
    const fetchOrders = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setOrders(data.orders ?? []);
          const sync = data?.debug?.sync as { attempted?: boolean; error?: string; mode?: string; reason?: string } | undefined;
          if (sync?.error) {
            setOrdersError(`Error al sincronizar Stripe: ${sync.error}`);
          } else if (sync?.reason) {
            setOrdersError(`Sincronización Stripe no activa: ${sync.reason}`);
          } else if (sync?.attempted) {
            setOrdersError(`Sincronización Stripe OK (modo ${sync.mode ?? "desconocido"}).`);
          } else {
            setOrdersError(null);
          }
        } else {
          setOrders([]);
          setOrdersError(data?.error ? `Error al cargar órdenes: ${data.error}` : "Error al cargar órdenes.");
        }
      } catch {
        setOrders([]);
        setOrdersError("No se pudieron cargar las órdenes. Revisa conexión o configuración del servidor.");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchConsultas();
    fetchOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!user) return;
    setUpdatingOrderId(orderId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const saveOrderGuia = async (orderId: string) => {
    if (!user) return;
    setUpdatingOrderId(orderId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numeroGuia: guiaEditValue.trim().slice(0, 200) }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, numeroGuia: guiaEditValue.trim() || null } : o))
        );
        setEditingGuiaOrderId(null);
        setGuiaEditValue("");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!user) return;
    const order = orders.find((o) => o.id === orderId);
    if (normalizeOrderStatus(order?.status) !== "finalizado") {
      alert("Solo puedes eliminar órdenes con estado finalizado.");
      return;
    }
    if (!confirm("¿Eliminar esta orden finalizada? No se puede deshacer.")) return;
    setDeletingOrderId(orderId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setDeletingOrderId(null);
    }
  };

  const deleteConsulta = async (consultaId: string) => {
    if (!user) return;
    if (!confirm("¿Eliminar esta solicitud de plan? No se puede deshacer.")) return;
    setDeletingConsultaId(consultaId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/consultas/${consultaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConsultas((prev) => prev.filter((c) => c.id !== consultaId));
    } finally {
      setDeletingConsultaId(null);
    }
  };

  if (authLoading || !user || !isDidiUser(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  const pendingShip = orders.filter((o) => normalizeOrderStatus(o.status) === "pendiente").length;
  const shipped = orders.filter((o) => normalizeOrderStatus(o.status) === "enviado").length;

  return (
    <div className="min-h-screen text-foreground bg-gradient-to-b from-background via-background to-teal-500/5">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 shadow-sm">
              <LayoutDashboard className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de la Nutrióloga</h1>
              <p className="text-muted text-sm mt-0.5">Solicitudes de dieta y compras de la tienda</p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-teal-500/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-teal-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Consultas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{consultas.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-500/15">
                <MessageSquare className="w-6 h-6 text-teal-500" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-500/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-teal-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Órdenes pendientes envío</p>
                <p className="text-2xl font-bold text-foreground mt-1">{pendingShip}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/15">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-500/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-teal-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Enviadas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{shipped}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15">
                <Truck className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Consultas */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            Solicitudes de plan (consultas)
          </h2>
          <p className="text-sm text-muted mb-4 rounded-lg bg-muted/40 border border-border/50 px-3 py-2 max-w-2xl">
            Solicitudes de dieta y compras de la tienda visibles para la Nutrióloga. Inicia sesión con <strong className="text-foreground">didi@dietas.com</strong>.
          </p>
          {loadingConsultas ? (
            <div className="flex items-center gap-3 text-muted py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500/30 border-t-teal-500" />
              <span>Cargando consultas...</span>
            </div>
          ) : consultas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-teal-500/30 bg-teal-500/5 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-teal-500/50 mx-auto mb-3" />
              <p className="text-muted">No hay consultas aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {consultas.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-teal-500/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-teal-500/5 hover:border-teal-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{c.nombre ?? "Sin nombre"}</h3>
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      {c.paidAt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Pagado
                        </span>
                      )}
                      {c.planDieta && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/15 text-teal-600 dark:text-teal-400">
                          {c.planDieta === "prueba" ? "Prueba ($10)" : c.planDieta === "semanal" ? "Semanal" : c.planDieta === "quincenal" ? "Quincenal" : c.planDieta === "mensual" ? "Mensual" : c.planDieta ?? ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted">
                      <Mail className="w-4 h-4 text-teal-500/70 shrink-0" />
                      <span className="truncate">{c.email ?? "-"}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <Phone className="w-4 h-4 text-teal-500/70 shrink-0" />
                      <span>{c.telefono ?? "-"}</span>
                    </li>
                    {typeof c.edad === "number" && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Edad:</span>
                        <span>{c.edad} años</span>
                      </li>
                    )}
                    {typeof c.estatura === "number" && c.estatura > 0 && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Estatura:</span>
                        <span>{c.estatura} cm</span>
                      </li>
                    )}
                    {c.peso && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Peso:</span>
                        <span>{c.peso} kg</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2 text-muted">
                      <Target className="w-4 h-4 text-teal-500/70 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.objetivoPrincipal ?? "-"}</span>
                    </li>
                    {c.metaPeso && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Meta peso:</span>
                        <span>{c.metaPeso === "bajar" ? "Bajar" : c.metaPeso === "mantener" ? "Mantener" : c.metaPeso === "subir" ? "Subir" : c.metaPeso}</span>
                      </li>
                    )}
                    {c.tipoDieta && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Dieta:</span>
                        <span className="line-clamp-1">{c.tipoDieta.replace(/-/g, " ")}</span>
                      </li>
                    )}
                    {c.condicionesMedicas && (
                      <li className="flex items-start gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80 shrink-0">Condiciones médicas:</span>
                        <span className="text-xs line-clamp-3">{c.condicionesMedicas}</span>
                      </li>
                    )}
                    {(c.habitos?.alimentacion?.length || c.habitos?.ejercicio?.length || c.habitos?.sueno?.length || c.habitos?.estres?.length) ? (
                      <li className="flex items-start gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80 shrink-0">Hábitos:</span>
                        <span className="text-xs">
                          {[
                            c.habitos?.alimentacion?.length ? `Alim.: ${c.habitos.alimentacion.join(", ")}` : "",
                            c.habitos?.ejercicio?.length ? `Ejerc.: ${c.habitos.ejercicio.join(", ")}` : "",
                            c.habitos?.sueno?.length ? `Sueño: ${c.habitos.sueno.join(", ")}` : "",
                            c.habitos?.estres?.length ? `Estrés: ${c.habitos.estres.join(", ")}` : "",
                          ].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ) : null}
                    {typeof c.importanciaSuplementos === "number" && (
                      <li className="flex items-center gap-2 text-muted">
                        <span className="text-xs font-medium text-foreground/80">Importancia suplementos (1-10):</span>
                        <span>{c.importanciaSuplementos}</span>
                      </li>
                    )}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      disabled={deletingConsultaId === c.id}
                      onClick={() => deleteConsulta(c.id)}
                    >
                      {deletingConsultaId === c.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Eliminar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Órdenes */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-500" />
            Órdenes (tienda)
          </h2>
          {ordersError && (
            <p className="text-sm mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
              {ordersError}
            </p>
          )}
          {loadingOrders ? (
            <div className="flex items-center gap-3 text-muted py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500/30 border-t-teal-500" />
              <span>Cargando órdenes...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-teal-500/30 bg-teal-500/5 p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-teal-500/50 mx-auto mb-3" />
              <p className="text-muted">No hay órdenes aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-teal-500/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-teal-500/5 hover:border-teal-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <code className="text-xs font-mono text-muted bg-muted/50 px-2 py-1 rounded">
                      {o.id.slice(0, 16)}…
                    </code>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        getOrderStatusClass(o.status)
                      }`}
                    >
                      {(normalizeOrderStatus(o.status) === "enviado" || normalizeOrderStatus(o.status) === "por llegar") && (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      {normalizeOrderStatus(o.status) === "pendiente" && <Package className="w-3.5 h-3.5" />}
                      {normalizeOrderStatus(o.status) === "finalizado" && <Sparkles className="w-3.5 h-3.5" />}
                      {getOrderStatusLabel(o.status)}
                    </span>
                  </div>
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div className="text-sm mb-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="font-medium text-foreground mb-1.5">Productos</p>
                      <ul className="space-y-1 text-muted">
                        {o.items.map((item, idx) => {
                          const current = item as { productId?: string; quantity?: number } | null;
                          return (
                            <li key={`${o.id}-item-${idx}`} className="flex items-center justify-between gap-3">
                              <span className="truncate">{current?.productId ?? "Producto"}</span>
                              <span>x{current?.quantity ?? 1}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-500/70" />
                      Creado: {o.createdAt ? new Date(o.createdAt).toLocaleString("es-MX") : "-"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      Pagado: {o.paidAt ? new Date(o.paidAt).toLocaleString("es-MX") : "-"}
                    </span>
                  </div>
                  {o.shippingAddress && (
                    <div className="text-sm mb-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-teal-500/70" />
                        Envío
                      </p>
                      <p className="text-foreground">{o.shippingAddress.name}</p>
                      <p className="text-muted">
                        {[o.shippingAddress.line1, o.shippingAddress.line2].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-muted">
                        {[o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                        {o.shippingAddress.country ? `, ${o.shippingAddress.country}` : ""}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-medium text-muted">Estado:</label>
                      <select
                        value={normalizeOrderStatus(o.status)}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        disabled={updatingOrderId === o.id}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getOrderStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(normalizeOrderStatus(o.status) === "enviado" ||
                      normalizeOrderStatus(o.status) === "por llegar" ||
                      normalizeOrderStatus(o.status) === "finalizado") && (
                      <>
                        {editingGuiaOrderId === o.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              placeholder="Número de guía"
                              value={guiaEditValue}
                              onChange={(e) => setGuiaEditValue(e.target.value)}
                              className="max-w-[220px] text-sm"
                            />
                            <Button size="sm" variant="outline" disabled={updatingOrderId === o.id} onClick={() => saveOrderGuia(o.id)}>
                              Guardar guía
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingGuiaOrderId(null);
                                setGuiaEditValue("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {o.numeroGuia ? (
                              <span className="text-sm text-muted">
                                Guía: <strong className="text-foreground">{o.numeroGuia}</strong>
                              </span>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted hover:text-foreground"
                              onClick={() => {
                                setEditingGuiaOrderId(o.id);
                                setGuiaEditValue(o.numeroGuia ?? "");
                              }}
                            >
                              {o.numeroGuia ? "Editar guía" : "Agregar número de guía"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      disabled={deletingOrderId === o.id || normalizeOrderStatus(o.status) !== "finalizado"}
                      onClick={() => deleteOrder(o.id)}
                    >
                      {deletingOrderId === o.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Eliminar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
