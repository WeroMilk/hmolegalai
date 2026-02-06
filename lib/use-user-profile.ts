"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import type { UserProfile } from "./user-profile";
import { isSuperUser } from "./superuser";
import { isDidiUser } from "./didi";
import { isDemoAbogado } from "./demo-users";

/** Perfil sintético para DIDI - cliente, para que vea la app sin completar perfil */
const DIDI_PROFILE: UserProfile = {
  uid: "",
  email: "didi@dietas.com",
  role: "cliente",
};

/** Perfil sintético para abogado demo - ve solicitudes en su dashboard */
const DEMO_ABOGADO_PROFILE: UserProfile = {
  uid: "",
  email: "abogado@avatar.com",
  role: "abogado",
  approved: true,
  nombreCompleto: "Lic. María González López",
  nombreDespacho: "Despacho Legal González",
  direccionDespacho: "Av. Reforma 150, Col. Centro, Hermosillo, Sonora",
  telefonoDespacho: "(662) 215-3000",
};

/** Perfil sintético para admin en modo demo (Firebase no configurado) */
const DEMO_ADMIN_PROFILE: UserProfile = {
  uid: "demo-superuser",
  email: "admin@avatar.com",
  role: "abogado",
  approved: true,
  nombreCompleto: "Lic. Roberto Mendoza García",
  nombreDespacho: "Bufete Jurídico Mendoza & Asociados",
  direccionDespacho: "Blvd. Luis Encinas 222, Col. Centro, Hermosillo, Sonora, CP 83000",
  telefonoDespacho: "(662) 212-4500",
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (user.uid === "demo-superuser" && isSuperUser(user.email ?? null)) {
      setProfile(DEMO_ADMIN_PROFILE);
      setLoading(false);
      return;
    }
    // DIDI: perfil cliente sintético si el fetch falla (evita "Completa tu perfil" y "Token inválido")
    if (isDidiUser(user.email ?? null)) {
      let cancelled = false;
      const fetchProfile = async () => {
        try {
          const token = await user.getIdToken(true);
          const res = await fetch("/api/user-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          const data = await res.json();
          if (data?.profile?.role) {
            setProfile(data.profile);
          } else {
            setProfile({ ...DIDI_PROFILE, uid: user.uid, email: user.email ?? DIDI_PROFILE.email });
          }
        } catch {
          if (!cancelled) setProfile({ ...DIDI_PROFILE, uid: user.uid, email: user.email ?? DIDI_PROFILE.email });
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchProfile();
      return () => { cancelled = true; };
    }
    // abogado@avatar.com: perfil abogado sintético si el fetch falla
    if (isDemoAbogado(user.email ?? null)) {
      let cancelled = false;
      const fetchProfile = async () => {
        try {
          const token = await user.getIdToken(true);
          const res = await fetch("/api/user-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          const data = await res.json();
          if (data?.profile?.role) {
            setProfile(data.profile);
          } else {
            setProfile({ ...DEMO_ABOGADO_PROFILE, uid: user.uid, email: user.email ?? DEMO_ABOGADO_PROFILE.email });
          }
        } catch {
          if (!cancelled) setProfile({ ...DEMO_ABOGADO_PROFILE, uid: user.uid, email: user.email ?? DEMO_ABOGADO_PROFILE.email });
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchProfile();
      return () => { cancelled = true; };
    }
    // admin@avatar.com: perfil abogado sintético si el fetch falla (evita "Token inválido" cuando Firebase Admin no verifica)
    if (isSuperUser(user.email ?? null)) {
      let cancelled = false;
      const fetchProfile = async () => {
        try {
          const token = await user.getIdToken(true);
          const res = await fetch("/api/user-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          const data = await res.json();
          if (data?.profile?.role) {
            setProfile(data.profile);
          } else {
            setProfile({ ...DEMO_ADMIN_PROFILE, uid: user.uid, email: user.email ?? DEMO_ADMIN_PROFILE.email });
          }
        } catch {
          if (!cancelled) setProfile({ ...DEMO_ADMIN_PROFILE, uid: user.uid, email: user.email ?? DEMO_ADMIN_PROFILE.email });
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchProfile();
      return () => { cancelled = true; };
    }
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/user-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const data = await res.json();
        setProfile(data?.profile ?? null);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  const refetch = async () => {
    if (!user || user.uid === "demo-superuser") return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data?.profile ?? null);
    } finally {
      setLoading(false);
    }
  };

  const updateAbogadoProfile = async (updates: {
    nombreCompleto?: string;
    nombreDespacho?: string;
    direccionDespacho?: string;
    telefonoDespacho?: string;
  }) => {
    if (!user) return { ok: false, error: "No autenticado" };
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error ?? "Error al guardar" };
      if (data?.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile, uid: user.uid, email: user.email ?? "" } as UserProfile));
      } else {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        await refetch();
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Error al guardar" };
    }
  };

  return { profile, loading, refetch, updateAbogadoProfile };
}
