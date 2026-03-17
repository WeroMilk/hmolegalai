"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isDidiUser } from "@/lib/didi";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

type Consulta = {
  id: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  edad?: number;
  objetivoPrincipal?: string;
  createdAt?: string | null;
};

type Order = {
  id: string;
  stripeSessionId?: string;
  status?: string;
  userId?: string | null;
  items?: unknown;
  createdAt?: string | null;
  paidAt?: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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
        }
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
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchConsultas();
    fetchOrders();
  }, [user]);

  const markAsShipped = async (orderId: string) => {
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
        body: JSON.stringify({ status: "enviada" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "enviada" } : o))
        );
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authLoading || !user || !isDidiUser(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  const pendingShip = orders.filter((o) => o.status === "paid").length;
  const shipped = orders.filter((o) => o.status === "enviada").length;

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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de administración</h1>
              <p className="text-muted text-sm mt-0.5">Consultas y órdenes en un vistazo</p>
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
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-foreground truncate">{c.nombre ?? "Sin nombre"}</h3>
                    <span className="shrink-0 flex items-center gap-1 text-xs text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </span>
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
                    <li className="flex items-start gap-2 text-muted">
                      <Target className="w-4 h-4 text-teal-500/70 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.objetivoPrincipal ?? "-"}</span>
                    </li>
                  </ul>
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
                        o.status === "enviada"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : o.status === "paid"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {o.status === "enviada" && <Truck className="w-3.5 h-3.5" />}
                      {o.status === "paid" && <Package className="w-3.5 h-3.5" />}
                      {o.status === "enviada" ? "Enviada" : o.status === "paid" ? "Pagada" : (o.status ?? "pending")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-500/70" />
                      Creado: {o.createdAt ? new Date(o.createdAt).toLocaleString("es-MX") : "-"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      Pagado: {o.paidAt ? new Date(o.paidAt).toLocaleString("es-MX") : "-"}
                    </span>
                  </div>
                  {o.status === "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingOrderId === o.id}
                      onClick={() => markAsShipped(o.id)}
                      className="border-teal-500/50 text-teal-600 hover:bg-teal-500/10"
                    >
                      {updatingOrderId === o.id ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4 mr-2" />
                          Marcar como enviada
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
