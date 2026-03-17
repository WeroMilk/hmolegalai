"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isDidiUser } from "@/lib/didi";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-bold mb-8">Panel de administración</h1>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Consultas (formulario)</h2>
          {loadingConsultas ? (
            <p className="text-muted">Cargando...</p>
          ) : consultas.length === 0 ? (
            <p className="text-muted">No hay consultas aún.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Nombre</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Teléfono</th>
                    <th className="text-left p-3">Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-3 text-muted">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString("es-MX") : "-"}
                      </td>
                      <td className="p-3">{c.nombre ?? "-"}</td>
                      <td className="p-3">{c.email ?? "-"}</td>
                      <td className="p-3">{c.telefono ?? "-"}</td>
                      <td className="p-3">{c.objetivoPrincipal ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Órdenes (tienda)</h2>
          {loadingOrders ? (
            <p className="text-muted">Cargando...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted">No hay órdenes aún.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Creado</th>
                    <th className="text-left p-3">Pagado</th>
                    <th className="text-left p-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">{o.id.slice(0, 20)}...</td>
                      <td className="p-3">
                        <span
                          className={
                            o.status === "paid"
                              ? "text-green-600"
                              : o.status === "enviada"
                                ? "text-teal-600"
                                : "text-muted"
                          }
                        >
                          {o.status ?? "pending"}
                        </span>
                      </td>
                      <td className="p-3 text-muted">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString("es-MX") : "-"}
                      </td>
                      <td className="p-3 text-muted">
                        {o.paidAt ? new Date(o.paidAt).toLocaleString("es-MX") : "-"}
                      </td>
                      <td className="p-3">
                        {o.status === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingOrderId === o.id}
                            onClick={() => markAsShipped(o.id)}
                          >
                            {updatingOrderId === o.id ? "..." : "Marcar enviada"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
