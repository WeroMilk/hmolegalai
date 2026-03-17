"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";
import { SUPERUSER_EMAIL, SUPERUSER_PASSWORD } from "./superuser";
import { DEMO_AUTO_CREATE } from "./demo-users";

const DEMO_USER_STORAGE = "vitahealth_demo_superuser";

/** Mensajes amigables para errores de Firebase Auth (evitar "auth/invalid-credential" etc.) */
function getFriendlyAuthMessage(code: string, fallback: string): string {
  const msg: Record<string, string> = {
    "auth/invalid-credential": "Usuario no encontrado o contraseña incorrecta.",
    "auth/user-not-found": "Usuario no encontrado.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-email": "Correo electrónico no válido.",
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Error de conexión. Revisa tu internet.",
    "auth/popup-closed-by-user": "Inicio de sesión cancelado.",
    "auth/cancelled-popup-request": "Inicio de sesión cancelado.",
    "auth/operation-not-allowed": "Operación no permitida.",
    "auth/requires-recent-login": "Por seguridad, cierra sesión y vuelve a entrar.",
  };
  return msg[code] || fallback;
}

/** Usuario demo cuando Firebase no está configurado (superusuario local) */
export interface DemoUser {
  email: string | null;
  uid: string;
  getIdToken: (_forceRefresh?: boolean) => Promise<string>;
}

export type AuthUser = User | DemoUser;

function createDemoUser(): DemoUser {
  return {
    email: SUPERUSER_EMAIL,
    uid: "demo-superuser",
    getIdToken: async () => "demo-superuser",
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      if (typeof window !== "undefined" && localStorage.getItem(DEMO_USER_STORAGE) === "1") {
        setUser(createDemoUser());
      }
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        setUser(authUser);
        setLoading(false);
      }, (error) => {
        console.warn("Auth state error (using temp config):", error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.warn("Auth initialization error:", error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const isSuperuserCreds = email === SUPERUSER_EMAIL && password === SUPERUSER_PASSWORD;

    if (!auth) {
      if (isSuperuserCreds) {
        if (typeof window !== "undefined") localStorage.setItem(DEMO_USER_STORAGE, "1");
        setUser(createDemoUser());
        return;
      }
      throw new Error("Firebase no está configurado. Usa admin@avatar.com / admin1234 para modo demo.");
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(auth.currentUser);
      setLoading(false);
    } catch (signInErr: any) {
      const code = signInErr?.code || "";
      const userNotFound = code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password";
      const demoMatch = DEMO_AUTO_CREATE.find(
        (d) => d.email.toLowerCase().trim() === email.trim().toLowerCase() && d.password === password
      );
      if (userNotFound && demoMatch) {
        await createUserWithEmailAndPassword(auth, demoMatch.email.trim(), demoMatch.password);
        await signInWithEmailAndPassword(auth, demoMatch.email.trim(), demoMatch.password);
        setUser(auth.currentUser);
        setLoading(false);
      } else {
        throw new Error(getFriendlyAuthMessage(code, signInErr?.message || "Error al iniciar sesión."));
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase no está configurado.");
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const code = err?.code || "";
      throw new Error(getFriendlyAuthMessage(code, err?.message || "Error al enviar el correo."));
    }
  };

  const logout = async () => {
    if (typeof window !== "undefined") localStorage.removeItem(DEMO_USER_STORAGE);
    if (!auth) {
      setUser(null);
      window.location.href = "/";
      return;
    }
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
